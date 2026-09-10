"""Reliable local Whisper transcription for uploaded and browser-recorded audio."""
import io
import logging
import shutil
import subprocess
import threading

import numpy as np
import soundfile as sf

logger = logging.getLogger(__name__)

_model = None
_model_lock = threading.Lock()


def _get_model():
    global _model
    if _model is not None:
        return _model
    with _model_lock:
        if _model is not None:
            return _model
        try:
            from faster_whisper import WhisperModel
            # base is a good CPU compromise for a student/demo machine.
            _model = WhisperModel("base", device="cpu", compute_type="int8")
        except Exception as exc:
            logger.exception("faster-whisper model could not be loaded: %s", exc)
            return None
        return _model


def _ffmpeg_audio(audio_bytes: bytes) -> tuple[np.ndarray, int]:
    """Decode any browser-supported audio container into 16-kHz mono PCM."""
    ffmpeg = shutil.which("ffmpeg")
    if not ffmpeg:
        raise RuntimeError(
            "FFmpeg is required for live transcription and non-WAV uploads. "
            "Add FFmpeg to PATH."
        )

    proc = subprocess.run(
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
            "16000",
            "-f",
            "wav",
            "pipe:1",
        ],
        input=audio_bytes,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        check=False,
    )

    if proc.returncode != 0 or not proc.stdout:
        detail = proc.stderr.decode("utf-8", errors="replace").strip()
        raise ValueError(f"FFmpeg could not decode audio: {detail or 'unknown format'}")

    data, sr = sf.read(
        io.BytesIO(proc.stdout),
        dtype="float32",
        always_2d=False,
    )

    if data.ndim > 1:
        data = np.mean(data, axis=1)

    data = np.asarray(data, dtype=np.float32)
    data = np.nan_to_num(data, nan=0.0, posinf=0.0, neginf=0.0)

    return data, int(sr)


def _audio_is_speech_candidate(waveform: np.ndarray) -> bool:
    """Reject genuinely empty/silent browser chunks before asking Whisper."""
    if waveform.size < 1600:  # <100 ms at 16 kHz
        return False

    rms = float(np.sqrt(np.mean(np.square(waveform), dtype=np.float64)))
    peak = float(np.max(np.abs(waveform))) if waveform.size else 0.0

    # Browser microphones normally produce substantially more energy than this
    # when someone is speaking. These conservative thresholds mainly prevent
    # Whisper from hallucinating phrases on silence/noise.
    return rms >= 0.003 or peak >= 0.025


def _clean_segment_text(text: str) -> str:
    text = " ".join((text or "").split()).strip()
    if not text:
        return ""

    # Whisper can hallucinate a repeated filler phrase on a poor/silent chunk.
    # Collapse exact consecutive repetition, but don't remove legitimate
    # different words.
    words = text.split()
    cleaned: list[str] = []
    i = 0
    while i < len(words):
        found = False
        for n in (4, 3, 2, 1):
            if i + 2 * n <= len(words):
                a = [w.lower() for w in words[i:i+n]]
                b = [w.lower() for w in words[i+n:i+2*n]]
                if a == b:
                    cleaned.extend(words[i:i+n])
                    i += 2 * n
                    found = True
                    break
        if not found:
            cleaned.append(words[i])
            i += 1

    return " ".join(cleaned).strip()


def _transcribe_waveform(model, waveform: np.ndarray, language: str, live_chunk: bool = False) -> str:
    if waveform.size == 0 or not _audio_is_speech_candidate(waveform):
        return "[no speech detected]"

    requested = (language or "auto").strip().lower()
    whisper_language = None if requested in {"", "auto", "detect"} else requested[:2]

    try:
        segments, _info = model.transcribe(
            waveform,
            language=whisper_language,
            beam_size=5,
            best_of=5,
            vad_filter=True,
            vad_parameters={
                "min_silence_duration_ms": 350,
                "speech_pad_ms": 250,
            },
            condition_on_previous_text=False,
            temperature=0.0,
            no_speech_threshold=0.60,
            log_prob_threshold=-1.2,
            compression_ratio_threshold=2.4,
        )

        accepted: list[str] = []
        for segment in segments:
            segment_text = _clean_segment_text(segment.text)
            if not segment_text:
                continue

            # Reject low-confidence hallucinated segments, especially on short
            # live windows. Keep the thresholds slightly more permissive for a
            # final aggregate transcription.
            no_speech = float(getattr(segment, "no_speech_prob", 0.0) or 0.0)
            avg_logprob = float(getattr(segment, "avg_logprob", 0.0) or 0.0)
            compression = float(getattr(segment, "compression_ratio", 0.0) or 0.0)

            if no_speech > 0.72:
                continue
            if avg_logprob < (-1.45 if live_chunk else -1.60):
                continue
            if compression > 2.4:
                continue

            accepted.append(segment_text)

        text = " ".join(accepted).strip()
        return text or "[no speech detected]"
    except Exception:
        # Let the caller return a controlled status marker instead of breaking
        # the live WebSocket.
        raise


def transcribe_audio(audio_bytes: bytes, language: str, live_chunk: bool = True) -> str:
    """Transcribe one audio window without allowing STT errors to break a call."""
    if not audio_bytes:
        return "[no speech detected]"

    model = _get_model()
    if model is None:
        return "[transcription unavailable]"

    try:
        waveform = _ffmpeg_audio(audio_bytes)[0]
        return _transcribe_waveform(model, waveform, language, live_chunk=live_chunk)
    except Exception as exc:
        logger.warning("Transcription failed for live audio window: %s", exc)
        return "[transcription failed]"


def transcribe_audio_chunks(audio_chunks: list[bytes], language: str) -> str:
    """Decode each MediaRecorder chunk to PCM, join PCM, then transcribe once."""
    if not audio_chunks:
        return "[no speech detected]"

    model = _get_model()
    if model is None:
        return "[transcription unavailable]"

    try:
        waveforms: list[np.ndarray] = []
        for chunk in audio_chunks:
            if not chunk:
                continue
            try:
                waveform = _ffmpeg_audio(chunk)[0]
                if waveform.size and _audio_is_speech_candidate(waveform):
                    waveforms.append(waveform)
            except Exception as exc:
                logger.warning("Skipping an undecodable final audio chunk: %s", exc)

        if not waveforms:
            return "[no speech detected]"

        waveform = np.concatenate(waveforms).astype(np.float32, copy=False)
        return _transcribe_waveform(model, waveform, language, live_chunk=False)
    except Exception as exc:
        logger.warning("Final aggregate transcription failed: %s", exc)
        return "[transcription failed]"
