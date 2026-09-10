
"""
DNN-based voice-clone detector with browser-audio decoding support.

Supports normal uploaded audio as well as browser MediaRecorder audio
such as WebM/Opus.

Browser audio flow:

    WebM/Opus
        ↓
    FFmpeg
        ↓
    16 kHz mono WAV
        ↓
    librosa
        ↓
    DNN
        ↓
    probability
"""

import io
import logging
import os
import shutil
import subprocess
import threading

import h5py
import numpy as np

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Optional ML imports
# ---------------------------------------------------------------------------

try:
    import librosa
    import tensorflow as tf
    from tensorflow.keras import layers, models

    ML_AVAILABLE = True

except ImportError:
    ML_AVAILABLE = False

    logger.warning(
        "librosa/tensorflow/h5py not installed - "
        "falling back to a neutral placeholder score."
    )


# ---------------------------------------------------------------------------
# Config - MUST MATCH TRAINING
# ---------------------------------------------------------------------------

SR = 16000
CLIP_SEC = 2.0
N_MELS = 40
N_FFT = 512
HOP_LENGTH = 256


_ASSETS_DIR = os.path.abspath(
    os.path.join(
        os.path.dirname(__file__),
        "..",
        "ml_assets",
    )
)


WEIGHTS_PATH = os.path.join(
    _ASSETS_DIR,
    "ai_vs_real_voice_dnn_weights.h5",
)


REPLAY_PATH = os.path.join(
    _ASSETS_DIR,
    "replay_buffer.npz",
)


# ---------------------------------------------------------------------------
# Self-update configuration
# ---------------------------------------------------------------------------

HIGH_CONF_FAKE = 0.95
HIGH_CONF_REAL = 0.05
UPDATE_LR = 1e-5
UPDATE_EPOCHS = 1
REPLAY_BATCH_FRACTION = 0.5


ENABLE_SELF_UPDATE = (
    os.getenv(
        "ENABLE_SELF_UPDATE",
        "false",
    ).lower()
    == "true"
)


# ---------------------------------------------------------------------------
# FFmpeg
# ---------------------------------------------------------------------------

def _find_ffmpeg():
    """
    Find the FFmpeg executable.

    FFmpeg should normally be available through PATH.
    """

    ffmpeg_path = shutil.which("ffmpeg")

    if ffmpeg_path:
        return ffmpeg_path

    # Windows fallback locations.
    if os.name == "nt":
        possible_paths = [
            r"C:\ffmpeg\bin\ffmpeg.exe",
            r"C:\Program Files\ffmpeg\bin\ffmpeg.exe",
            r"C:\Program Files (x86)\ffmpeg\bin\ffmpeg.exe",
        ]

        for path in possible_paths:
            if os.path.isfile(path):
                return path

    return None


FFMPEG_PATH = _find_ffmpeg()


if FFMPEG_PATH:
    logger.info(
        "FFmpeg found: %s",
        FFMPEG_PATH,
    )
else:
    logger.warning(
        "FFmpeg was not found in PATH. "
        "Browser WebM/Opus audio may fail to decode."
    )


# ---------------------------------------------------------------------------
# Audio decoding
# ---------------------------------------------------------------------------

def _decode_audio_with_ffmpeg(audio_bytes: bytes) -> bytes:
    """
    Convert browser audio into WAV PCM.

    Output:
        - mono
        - 16 kHz
        - signed 16-bit PCM
        - WAV container

    This is required because MediaRecorder commonly produces WebM/Opus,
    which soundfile/librosa may not decode directly.
    """

    if not audio_bytes:
        raise ValueError("Audio data is empty.")

    ffmpeg = FFMPEG_PATH or _find_ffmpeg()

    if not ffmpeg:
        raise RuntimeError(
            "FFmpeg was not found. "
            "Install FFmpeg and make sure it is available in PATH."
        )

    try:
        process = subprocess.run(
            [
                ffmpeg,
                "-hide_banner",
                "-loglevel",
                "error",
                "-i",
                "pipe:0",
                "-ac",
                "1",
                "-ar",
                str(SR),
                "-c:a",
                "pcm_s16le",
                "-f",
                "wav",
                "pipe:1",
            ],
            input=audio_bytes,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            check=False,
        )

    except FileNotFoundError as exc:
        raise RuntimeError(
            "FFmpeg executable could not be started."
        ) from exc

    except Exception as exc:
        raise RuntimeError(
            f"Could not run FFmpeg: {exc}"
        ) from exc

    if process.returncode != 0:
        error_message = (
            process.stderr.decode(
                "utf-8",
                errors="replace",
            ).strip()
        )

        logger.warning(
            "FFmpeg audio conversion failed: %s",
            error_message,
        )

        raise ValueError(
            f"FFmpeg could not decode the audio: {error_message}"
        )

    if not process.stdout:
        raise ValueError(
            "FFmpeg returned empty audio."
        )

    return process.stdout


def _load_audio(audio_bytes: bytes):
    """
    Decode audio and return a mono 16 kHz float32 waveform.

    First attempt direct librosa decoding so existing WAV/MP3/FLAC
    uploads continue to work.

    If that fails, use FFmpeg. This handles WebM/Opus browser audio.
    """

    if not audio_bytes:
        raise ValueError(
            "Audio file is empty."
        )

    # -----------------------------------------------------------------------
    # Attempt direct decoding.
    # -----------------------------------------------------------------------

    try:
        y, _ = librosa.load(
            io.BytesIO(audio_bytes),
            sr=SR,
            mono=True,
        )

        if y is not None and y.size > 0:
            return y.astype(
                np.float32,
                copy=False,
            )

    except Exception as direct_error:
        logger.debug(
            "Direct audio decoding failed: %s. "
            "Trying FFmpeg.",
            direct_error,
        )

    # -----------------------------------------------------------------------
    # FFmpeg fallback.
    # -----------------------------------------------------------------------

    wav_bytes = _decode_audio_with_ffmpeg(
        audio_bytes
    )

    try:
        y, _ = librosa.load(
            io.BytesIO(wav_bytes),
            sr=SR,
            mono=True,
        )

    except Exception as exc:
        logger.warning(
            "librosa could not read FFmpeg-converted WAV: %s",
            exc,
        )

        raise ValueError(
            "Converted audio could not be read."
        ) from exc

    if y is None or y.size == 0:
        raise ValueError(
            "Audio contained no samples."
        )

    return y.astype(
        np.float32,
        copy=False,
    )


# ---------------------------------------------------------------------------
# DNN
# ---------------------------------------------------------------------------

if ML_AVAILABLE:

    class _VoiceCloneDNN:
        """
        Loaded once per process.

        Thread-safe around inference and optional self-update.
        """

        def __init__(self):

            self._lock = threading.Lock()

            # ----------------------------------------------------------------
            # Calculate model input size.
            # ----------------------------------------------------------------

            dummy = np.zeros(
                int(CLIP_SEC * SR),
                dtype=np.float32,
            )

            dummy_mel = librosa.feature.melspectrogram(
                y=dummy,
                sr=SR,
                n_fft=N_FFT,
                hop_length=HOP_LENGTH,
                n_mels=N_MELS,
            )

            input_dim = dummy_mel.flatten().shape[0]

            # ----------------------------------------------------------------
            # Build model.
            # ----------------------------------------------------------------

            self.model = models.Sequential(
                [
                    layers.Input(
                        shape=(input_dim,),
                    ),

                    layers.Dense(
                        64,
                        activation="relu",
                        name="dense_1",
                    ),

                    layers.Dropout(
                        0.3,
                    ),

                    layers.Dense(
                        32,
                        activation="relu",
                        name="dense_2",
                    ),

                    layers.Dropout(
                        0.2,
                    ),

                    layers.Dense(
                        1,
                        activation="sigmoid",
                        name="output",
                    ),
                ]
            )

            # ----------------------------------------------------------------
            # Check weights.
            # ----------------------------------------------------------------

            if not os.path.exists(WEIGHTS_PATH):
                raise FileNotFoundError(
                    f"DNN weights file not found: {WEIGHTS_PATH}"
                )

            # ----------------------------------------------------------------
            # Load H5 weights.
            # ----------------------------------------------------------------

            with h5py.File(
                WEIGHTS_PATH,
                "r",
            ) as f:

                self.model.get_layer(
                    "dense_1"
                ).set_weights(
                    [
                        f["layers/dense/vars/0"][:],
                        f["layers/dense/vars/1"][:],
                    ]
                )

                self.model.get_layer(
                    "dense_2"
                ).set_weights(
                    [
                        f["layers/dense_1/vars/0"][:],
                        f["layers/dense_1/vars/1"][:],
                    ]
                )

                self.model.get_layer(
                    "output"
                ).set_weights(
                    [
                        f["layers/dense_2/vars/0"][:],
                        f["layers/dense_2/vars/1"][:],
                    ]
                )

            logger.info(
                "DNN weights loaded successfully."
            )

            # ----------------------------------------------------------------
            # Compile.
            # ----------------------------------------------------------------

            self.model.compile(
                optimizer=tf.keras.optimizers.Adam(
                    learning_rate=UPDATE_LR
                ),
                loss="binary_crossentropy",
                metrics=["accuracy"],
            )

            # ----------------------------------------------------------------
            # Replay buffer.
            # ----------------------------------------------------------------

            if not os.path.exists(REPLAY_PATH):
                raise FileNotFoundError(
                    f"Replay buffer not found: {REPLAY_PATH}"
                )

            replay = np.load(
                REPLAY_PATH
            )

            self.X_replay = replay["X_replay"]
            self.y_replay = replay["y_replay"]

            logger.info(
                "Loaded voice-clone DNN. "
                "input_dim=%s replay=%s",
                input_dim,
                self.X_replay.shape,
            )

        # --------------------------------------------------------------------
        # Audio processing
        # --------------------------------------------------------------------

        @staticmethod
        def _split_into_2s_clips(y):

            clip_len = int(
                CLIP_SEC * SR
            )

            total_len = len(y)

            if total_len <= clip_len:

                padded = np.zeros(
                    clip_len,
                    dtype=np.float32,
                )

                padded[:total_len] = y

                return [padded]

            clips = []

            n_full = total_len // clip_len

            for i in range(n_full):

                start = i * clip_len

                clips.append(
                    y[
                        start:
                        start + clip_len
                    ]
                )

            # Include remaining audio using the last 2 seconds.
            remainder = (
                total_len
                - n_full * clip_len
            )

            if remainder > 0:

                clips.append(
                    y[
                        total_len - clip_len:
                        total_len
                    ]
                )

            return clips

        # --------------------------------------------------------------------
        # Feature extraction
        # --------------------------------------------------------------------

        @staticmethod
        def _extract_features(clip):

            mel = librosa.feature.melspectrogram(
                y=clip,
                sr=SR,
                n_fft=N_FFT,
                hop_length=HOP_LENGTH,
                n_mels=N_MELS,
            )

            log_mel = librosa.power_to_db(
                mel,
                ref=np.max,
            )

            mean = log_mel.mean()
            std = log_mel.std()

            log_mel = (
                log_mel - mean
            ) / (
                std + 1e-8
            )

            return log_mel.flatten()

        # --------------------------------------------------------------------
        # Prediction
        # --------------------------------------------------------------------

        def predict(
            self,
            audio_bytes: bytes,
        ):

            # Browser MediaRecorder audio is normally WebM/Opus.
            # Convert it before passing the audio to librosa.
            y = _load_audio(
                audio_bytes
            )

            if y.size == 0:
                raise ValueError(
                    "Uploaded audio contained no samples."
                )

            # Split into model-sized 2-second clips.
            clips = self._split_into_2s_clips(
                y
            )

            # Extract features.
            feats = np.array(
                [
                    self._extract_features(
                        clip
                    )
                    for clip in clips
                ],
                dtype=np.float32,
            )

            if feats.size == 0:
                raise ValueError(
                    "Could not extract audio features."
                )

            # ----------------------------------------------------------------
            # DNN inference.
            # ----------------------------------------------------------------

            with self._lock:

                clip_probs = self.model.predict(
                    feats,
                    verbose=0,
                ).flatten()

            if clip_probs.size == 0:
                raise ValueError(
                    "DNN returned no predictions."
                )

            clip_probs = np.clip(
                clip_probs,
                0.0,
                1.0,
            )

            avg_score = float(
                clip_probs.mean()
            )

            # ----------------------------------------------------------------
            # Optional self-update.
            # ----------------------------------------------------------------

            if ENABLE_SELF_UPDATE:

                with self._lock:

                    if avg_score >= HIGH_CONF_FAKE:

                        self._self_update(
                            feats,
                            pseudo_label=1,
                        )

                    elif avg_score <= HIGH_CONF_REAL:

                        self._self_update(
                            feats,
                            pseudo_label=0,
                        )

            return (
                avg_score,
                clip_probs,
                feats,
            )

        # --------------------------------------------------------------------
        # Self-update
        # --------------------------------------------------------------------

        def _self_update(
            self,
            feats,
            pseudo_label,
        ):

            n_new = feats.shape[0]

            y_new = np.full(
                (n_new,),
                pseudo_label,
                dtype=np.int32,
            )

            if len(self.X_replay) == 0:
                return

            n_replay = max(
                1,
                int(
                    n_new
                    * REPLAY_BATCH_FRACTION
                    / (
                        1
                        - REPLAY_BATCH_FRACTION
                    )
                ),
            )

            n_replay = min(
                n_replay,
                len(self.X_replay),
            )

            replay_choice = np.random.choice(
                len(self.X_replay),
                size=n_replay,
                replace=False,
            )

            X_batch = np.concatenate(
                [
                    feats,
                    self.X_replay[
                        replay_choice
                    ],
                ],
                axis=0,
            )

            y_batch = np.concatenate(
                [
                    y_new,
                    self.y_replay[
                        replay_choice
                    ],
                ],
                axis=0,
            )

            perm = np.random.permutation(
                len(X_batch)
            )

            self.model.fit(
                X_batch[perm],
                y_batch[perm],
                epochs=UPDATE_EPOCHS,
                batch_size=16,
                verbose=0,
            )

            logger.info(
                "Self-update applied in memory "
                "(pseudo_label=%s, n_new=%s, n_replay=%s)",
                pseudo_label,
                n_new,
                n_replay,
            )

else:

    _VoiceCloneDNN = None


# ---------------------------------------------------------------------------
# Load DNN once per process
# ---------------------------------------------------------------------------

_dnn = None


if ML_AVAILABLE:

    try:

        _dnn = _VoiceCloneDNN()

    except Exception as exc:

        logger.exception(
            "Failed to load voice-clone DNN: %s",
            exc,
        )

        ML_AVAILABLE = False


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def analyze_voice(
    audio_bytes: bytes,
    transcript: str,
    language: str,
) -> dict:
    """
    Analyze an audio recording using the trained DNN.

    Used by:
        1. Recorded analysis
        2. Live WebSocket analysis

    Returns:
        synthetic_probability
        speaker_match_probability
        ai_voice_percent
        confidence
        features.per_clip_scores
    """

    if not ML_AVAILABLE or _dnn is None:

        return {
            "synthetic_probability": 0.5,
            "speaker_match_probability": 0.5,
            "ai_voice_percent": 50.0,
            "confidence": 0.0,
            "features": {
                "per_clip_scores": [],
            },
        }

    try:

        (
            avg_score,
            clip_probs,
            _feats,
        ) = _dnn.predict(
            audio_bytes
        )

    except Exception as exc:

        logger.exception(
            "DNN inference failed."
        )

        raise ValueError(
            f"unsupported or malformed audio: {exc}"
        ) from exc

    synthetic_probability = round(
        float(avg_score),
        4,
    )

    speaker_match_probability = round(
        1.0 - synthetic_probability,
        4,
    )

    # Lower prediction spread means more consistent predictions.
    if len(clip_probs) > 1:

        confidence = round(
            max(
                0.0,
                min(
                    1.0,
                    1.0
                    - float(
                        np.std(
                            clip_probs
                        )
                    ),
                ),
            ),
            4,
        )

    else:

        confidence = 0.75

    return {
        "synthetic_probability": (
            synthetic_probability
        ),

        "speaker_match_probability": (
            speaker_match_probability
        ),

        "ai_voice_percent": round(
            synthetic_probability * 100,
            2,
        ),

        "confidence": confidence,

        "features": {
            "per_clip_scores": [
                round(
                    float(probability),
                    4,
                )
                for probability in clip_probs
            ]
        },
    }

