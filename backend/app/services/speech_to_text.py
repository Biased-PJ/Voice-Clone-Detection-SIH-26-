"""
Speech-to-text for uploaded audio.

Tries faster-whisper (free, runs locally, no API key) first. If it isn't
installed or the model can't load (e.g. no internet to download weights on
first run), falls back to a clearly-labeled placeholder so the rest of the
pipeline (ML scoring, risk engine) still runs end-to-end for the demo.

TODO (not done due to time/hackathon constraints): cache/bundle the
faster-whisper model file so first-run doesn't need network access, and add
language-specific model selection instead of always using "base".
"""
import io
import logging

logger = logging.getLogger(__name__)

_model = None
_model_load_failed = False


def _get_model():
    global _model, _model_load_failed
    if _model is not None or _model_load_failed:
        return _model
    try:
        from faster_whisper import WhisperModel
        _model = WhisperModel("base", device="cpu", compute_type="int8")
    except Exception as exc:  # ImportError, or model download/load failure
        logger.warning(
            "faster-whisper unavailable (%s); falling back to placeholder "
            "transcript. Run: pip install faster-whisper", exc
        )
        _model_load_failed = True
        _model = None
    return _model


def transcribe_audio(audio_bytes: bytes, language: str) -> str:
    model = _get_model()

    if model is None:
        # MOCK fallback — clearly labeled, not silently pretending it's real.
        # See module TODO above for how to make this real end-to-end.
        return "[transcription unavailable — faster-whisper not installed]"

    try:
        segments, _info = model.transcribe(io.BytesIO(audio_bytes), language=language[:2].lower() or None)
        text = " ".join(segment.text.strip() for segment in segments).strip()
        return text or "[no speech detected]"
    except Exception as exc:
        logger.error("Transcription failed: %s", exc)
        return "[transcription failed]"
