
"""
Real DNN-based voice-clone detector.

Loads the trained Keras model (mel-spectrogram -> Dense(64)->Dense(32)->sigmoid)
and a replay buffer used for lightweight self-updating on high-confidence
predictions.

Public API:
    analyze_voice(audio_bytes, transcript, language) -> dict
"""

import io
import logging
import os
import threading

import h5py
import numpy as np

logger = logging.getLogger(__name__)

try:
    import librosa
    import tensorflow as tf
    from tensorflow.keras import layers, models

    ML_AVAILABLE = True

except ImportError:  # pragma: no cover
    ML_AVAILABLE = False
    logger.warning(
        "librosa/tensorflow/h5py not installed — falling back to a neutral "
        "placeholder score."
    )


# ---------------------------------------------------------------------------
# Config - MUST match training
# ---------------------------------------------------------------------------

SR = 16000
CLIP_SEC = 2.0
N_MELS = 40
N_FFT = 512
HOP_LENGTH = 256

_ASSETS_DIR = os.path.join(
    os.path.dirname(__file__),
    "..",
    "ml_assets",
)

WEIGHTS_PATH = os.path.join(
    _ASSETS_DIR,
    "ai_vs_real_voice_dnn_weights.h5",
)

REPLAY_PATH = os.path.join(
    _ASSETS_DIR,
    "replay_buffer.npz",
)

HIGH_CONF_FAKE = 0.95
HIGH_CONF_REAL = 0.05
UPDATE_LR = 1e-5
UPDATE_EPOCHS = 1
REPLAY_BATCH_FRACTION = 0.5

# Keep self-update disabled unless explicitly enabled.
ENABLE_SELF_UPDATE = (
    os.getenv("ENABLE_SELF_UPDATE", "false").lower() == "true"
)


class _VoiceCloneDNN:
    """Loaded once per process; thread-safe around self-update + save."""

    def __init__(self):
        self._lock = threading.Lock()

        # -------------------------------------------------------------------
        # Calculate model input size
        # -------------------------------------------------------------------

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

        # -------------------------------------------------------------------
        # Build model architecture
        # -------------------------------------------------------------------

        self.model = models.Sequential([
            layers.Input(
                shape=(input_dim,)
            ),

            layers.Dense(
                64,
                activation="relu",
                name="dense_1",
            ),

            layers.Dropout(0.3),

            layers.Dense(
                32,
                activation="relu",
                name="dense_2",
            ),

            layers.Dropout(0.2),

            layers.Dense(
                1,
                activation="sigmoid",
                name="output",
            ),
        ])

        # -------------------------------------------------------------------
        # Load H5 weights manually.
        #
        # The supplied H5 file contains:
        #
        # layers/dense/vars/0       -> 5040 x 64
        # layers/dense/vars/1       -> 64
        #
        # layers/dense_1/vars/0     -> 64 x 32
        # layers/dense_1/vars/1     -> 32
        #
        # layers/dense_2/vars/0     -> 32 x 1
        # layers/dense_2/vars/1     -> 1
        #
        # This avoids the TensorFlow/Keras H5 layer-count mismatch.
        # -------------------------------------------------------------------

        if not os.path.exists(WEIGHTS_PATH):
            raise FileNotFoundError(
                f"DNN weights file not found: {WEIGHTS_PATH}"
            )

        with h5py.File(WEIGHTS_PATH, "r") as f:

            # H5 dense -> project dense_1
            self.model.get_layer("dense_1").set_weights([
                f["layers/dense/vars/0"][:],
                f["layers/dense/vars/1"][:],
            ])

            # H5 dense_1 -> project dense_2
            self.model.get_layer("dense_2").set_weights([
                f["layers/dense_1/vars/0"][:],
                f["layers/dense_1/vars/1"][:],
            ])

            # H5 dense_2 -> project output
            self.model.get_layer("output").set_weights([
                f["layers/dense_2/vars/0"][:],
                f["layers/dense_2/vars/1"][:],
            ])

        logger.info(
            "DNN weights loaded successfully."
        )

        # -------------------------------------------------------------------
        # Compile model
        # -------------------------------------------------------------------

        self.model.compile(
            optimizer=tf.keras.optimizers.Adam(
                learning_rate=UPDATE_LR
            ),
            loss="binary_crossentropy",
            metrics=["accuracy"],
        )

        # -------------------------------------------------------------------
        # Load replay buffer
        # -------------------------------------------------------------------

        if not os.path.exists(REPLAY_PATH):
            raise FileNotFoundError(
                f"Replay buffer not found: {REPLAY_PATH}"
            )

        replay = np.load(REPLAY_PATH)

        self.X_replay = replay["X_replay"]
        self.y_replay = replay["y_replay"]

        logger.info(
            "Loaded voice-clone DNN. input_dim=%s replay=%s",
            input_dim,
            self.X_replay.shape,
        )

    # -----------------------------------------------------------------------
    # Audio processing
    # -----------------------------------------------------------------------

    @staticmethod
    def _split_into_2s_clips(y):
        clip_len = int(CLIP_SEC * SR)
        total_len = len(y)

        if total_len <= clip_len:
            padded = np.zeros(
                clip_len,
                dtype=y.dtype,
            )

            padded[:total_len] = y

            return [padded]

        clips = []

        n_full = total_len // clip_len

        for i in range(n_full):
            start = i * clip_len

            clips.append(
                y[start:start + clip_len]
            )

        # Include remaining audio
        if total_len - n_full * clip_len > 0:
            clips.append(
                y[total_len - clip_len:total_len]
            )

        return clips

    # -----------------------------------------------------------------------
    # Feature extraction
    # -----------------------------------------------------------------------

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

        log_mel = (
            log_mel - log_mel.mean()
        ) / (
            log_mel.std() + 1e-8
        )

        return log_mel.flatten()

    # -----------------------------------------------------------------------
    # Prediction
    # -----------------------------------------------------------------------

    def predict(self, audio_bytes: bytes):

        y, _ = librosa.load(
            io.BytesIO(audio_bytes),
            sr=SR,
            mono=True,
        )

        if y.size == 0:
            raise ValueError(
                "Uploaded audio contained no samples"
            )

        clips = self._split_into_2s_clips(y)

        feats = np.array(
            [
                self._extract_features(c)
                for c in clips
            ],
            dtype=np.float32,
        )

        clip_probs = self.model.predict(
            feats,
            verbose=0,
        ).flatten()

        avg_score = float(
            clip_probs.mean()
        )

        # Optional self-update
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

        return avg_score, clip_probs, feats

    # -----------------------------------------------------------------------
    # Self-update
    # -----------------------------------------------------------------------

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

        n_replay = max(
            1,
            int(
                n_new
                * REPLAY_BATCH_FRACTION
                / (1 - REPLAY_BATCH_FRACTION)
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
                self.X_replay[replay_choice],
            ],
            axis=0,
        )

        y_batch = np.concatenate(
            [
                y_new,
                self.y_replay[replay_choice],
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

        # IMPORTANT:
        # The current H5 format is not compatible with the old
        # load_weights() call. We therefore do not overwrite the
        # supplied trained weights automatically.
        #
        # Self-update remains disabled by default.
        logger.info(
            "Self-update applied in memory "
            "(pseudo_label=%s, n_new=%s, n_replay=%s)",
            pseudo_label,
            n_new,
            n_replay,
        )


# ---------------------------------------------------------------------------
# Load DNN once
# ---------------------------------------------------------------------------

_dnn = None

if ML_AVAILABLE:

    try:

        _dnn = _VoiceCloneDNN()

    except Exception as exc:

        logger.error(
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

    Returns:
        synthetic_probability
        speaker_match_probability
        ai_voice_percent
        confidence
        features
    """

    if not ML_AVAILABLE or _dnn is None:

        return {
            "synthetic_probability": 0.5,
            "speaker_match_probability": 0.5,
            "ai_voice_percent": 50.0,
            "confidence": 0.0,
            "features": {},
        }

    try:

        avg_score, clip_probs, _feats = _dnn.predict(
            audio_bytes
        )

    except Exception as exc:

        logger.warning(
            "DNN inference failed (%s).",
            exc,
        )

        raise ValueError(
            "unsupported or malformed audio"
        ) from exc

    synthetic_probability = round(
        float(avg_score),
        4,
    )

    speaker_match_probability = round(
        1.0 - synthetic_probability,
        4,
    )

    confidence = (
        round(
            float(np.std(clip_probs)) * -1 + 1.0,
            4,
        )
        if len(clip_probs) > 1
        else 0.75
    )

    return {
        "synthetic_probability": synthetic_probability,
        "speaker_match_probability": speaker_match_probability,
        "ai_voice_percent": round(
            synthetic_probability * 100,
            2,
        ),
        "confidence": confidence,
        "features": {
            "per_clip_scores": [
                round(float(p), 4)
                for p in clip_probs
            ]
        },
    }

