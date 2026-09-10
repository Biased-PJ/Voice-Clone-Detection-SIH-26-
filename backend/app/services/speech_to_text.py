"""Reliable local speech-to-text for uploaded and browser-recorded audio."""
import io
import logging
import os
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
            _model = WhisperModel("base", device="cpu", compute_type="int8")
        except Exception as exc:
            logger.exception("faster-whisper model could not be loaded: %s", exc)
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


def _decode_audio(audio_bytes: bytes) -> np.ndarray:
    waveform, _sample_rate = _ffmpeg_audio(audio_bytes)
    return waveform


def _transcribe_waveform(model, waveform: np.ndarray, language: str, live_chunk: bool = False) -> str:
    if waveform.size == 0:
        return "[no speech detected]"
    requested = (language or "auto").strip().lower()
    whisper_language = None if requested in {"", "auto", "detect"} else requested[:2]
    # VAD can incorrectly discard speech from very short 2-second browser chunks.
    # For live chunks we let Whisper see the complete normalized waveform.
    segments, _info = model.transcribe(
        waveform,
        language=whisper_language,
        beam_size=3,
        vad_filter=not live_chunk,
        condition_on_previous_text=False,
        temperature=0.0,
    )
    text = " ".join(segment.text.strip() for segment in segments).strip()
    return text or "[no speech detected]"


def transcribe_audio(audio_bytes: bytes, language: str, live_chunk: bool = True) -> str:
    """Transcribe one uploaded/browser audio chunk. Returns a status marker, never raises for STT errors."""
    if not audio_bytes:
        return "[no speech detected]"
    model = _get_model()
    if model is None:
        return "[transcription unavailable — faster-whisper model could not be loaded]"
    try:
        waveform = _decode_audio(audio_bytes)
        return _transcribe_waveform(model, waveform, language, live_chunk=live_chunk)
    except Exception as exc:
        logger.warning("Transcription failed: %s", exc)
        return "[transcription failed]"


def transcribe_audio_chunks(audio_chunks: list[bytes], language: str) -> str:
    """Decode every received live chunk to PCM, concatenate it, and transcribe once.

    Browser MediaRecorder chunks are commonly WebM/Opus fragments and cannot safely be
    concatenated as container bytes. We decode each fragment first, then concatenate PCM.
    This is used at call finalization as the reliable transcription fallback.
    """
    if not audio_chunks:
        return "[no speech detected]"
    model = _get_model()
    if model is None:
        return "[transcription unavailable — faster-whisper model could not be loaded]"
    try:
        waveforms = []
        for chunk in audio_chunks:
            if not chunk:
                continue
            try:
                data = _decode_audio(chunk)
                if data.size:
                    waveforms.append(data)
            except Exception as exc:
                logger.warning("Skipping an undecodable final audio chunk: %s", exc)
        if not waveforms:
            return "[no speech detected]"
        waveform = np.concatenate(waveforms).astype(np.float32, copy=False)
        return _transcribe_waveform(model, waveform, language, live_chunk=False)
    except Exception as exc:
        logger.exception("Final aggregate transcription failed: %s", exc)
        return "[transcription failed]"
