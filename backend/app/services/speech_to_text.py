"""Reliable local speech-to-text for uploaded and browser-recorded audio."""
import io
import logging
import os
import shutil
import subprocess

import numpy as np
import soundfile as sf

logger = logging.getLogger(__name__)

_model = None
_model_load_failed = False


def _get_model():
    global _model, _model_load_failed
    if _model is not None:
        return _model
    if _model_load_failed:
        return None
    try:
        from faster_whisper import WhisperModel
        _model = WhisperModel("base", device="cpu", compute_type="int8")
    except Exception as exc:
        logger.exception("faster-whisper model could not be loaded: %s", exc)
        _model_load_failed = True
        return None
    return _model


def _ffmpeg_audio(audio_bytes: bytes) -> tuple[np.ndarray, int]:
    ffmpeg = shutil.which("ffmpeg")
    if not ffmpeg:
        raise RuntimeError("FFmpeg is required for live transcription and non-WAV uploads. Add FFmpeg to PATH.")
    proc = subprocess.run(
        [ffmpeg, "-hide_banner", "-loglevel", "error", "-i", "pipe:0", "-ac", "1", "-ar", "16000", "-f", "wav", "pipe:1"],
        input=audio_bytes,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        check=False,
    )
    if proc.returncode != 0 or not proc.stdout:
        detail = proc.stderr.decode("utf-8", errors="replace").strip()
        raise ValueError(f"FFmpeg could not decode audio: {detail or 'unknown format'}")
    data, sr = sf.read(io.BytesIO(proc.stdout), dtype="float32", always_2d=False)
    if data.ndim > 1:
        data = np.mean(data, axis=1)
    return np.asarray(data, dtype=np.float32), int(sr)


def transcribe_audio(audio_bytes: bytes, language: str) -> str:
    if not audio_bytes:
        return "[no speech detected]"
    model = _get_model()
    if model is None:
        return "[transcription unavailable — faster-whisper model could not be loaded]"
    try:
        waveform, sample_rate = _ffmpeg_audio(audio_bytes)
        if waveform.size == 0:
            return "[no speech detected]"
        segments, _info = model.transcribe(
            waveform,
            language=language[:2].lower() or None,
            beam_size=1,
            vad_filter=True,
        )
        text = " ".join(segment.text.strip() for segment in segments).strip()
        return text or "[no speech detected]"
    except Exception as exc:
        logger.warning("Transcription failed: %s", exc)
        return "[transcription failed]"
