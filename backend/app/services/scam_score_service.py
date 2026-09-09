"""
Score 2: scam-likelihood scoring of a call transcript, via Google's free
Gemini API tier.

Pipeline (as specified):
  audio -> speech_to_text.transcribe_audio() -> transcript text
  transcript -> Gemini -> integer 0-100 scam score (no other content)

Requires GEMINI_API_KEY in the environment (get a free key at
https://aistudio.google.com/apikey — the Gemini API has a free tier).
"""
import logging
import os
import re

logger = logging.getLogger(__name__)

try:
    import google.generativeai as genai
    GEMINI_SDK_AVAILABLE = True
except ImportError:  # pragma: no cover
    GEMINI_SDK_AVAILABLE = False
    logger.warning(
        "google-generativeai not installed — scam scoring will fall back to "
        "a neutral placeholder. Run: pip install google-generativeai"
    )

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")

_configured = False
if GEMINI_SDK_AVAILABLE and GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    _configured = True
elif GEMINI_SDK_AVAILABLE and not GEMINI_API_KEY:
    logger.warning("GEMINI_API_KEY not set — scam scoring will use a placeholder score.")

_PROMPT_TEMPLATE = (
    "You are a fraud-detection classifier. Read the following phone call "
    "transcript and output ONLY a single integer between 0 and 100 "
    "representing the likelihood this call is a scam (0 = definitely not a "
    "scam, 100 = definitely a scam). Do not output any words, explanation, "
    "punctuation, or formatting — output the number and nothing else.\n\n"
    "Transcript:\n{transcript}"
)

_NUMBER_RE = re.compile(r"-?\d+")


def _clamp(value: int, lo: int = 0, hi: int = 100) -> int:
    return max(lo, min(hi, value))


def get_scam_score(transcript: str) -> dict:
    """
    Returns {"scam_score": int 0-100, "source": "gemini" | "placeholder"}.
    """
    if not transcript or transcript.strip() in (
        "",
        "[transcription unavailable — faster-whisper not installed]",
        "[no speech detected]",
        "[transcription failed]",
    ):
        return {"scam_score": 0, "source": "placeholder", "note": "no usable transcript"}

    if not _configured:
        return {"scam_score": 0, "source": "placeholder", "note": "GEMINI_API_KEY not configured"}

    try:
        model = genai.GenerativeModel(GEMINI_MODEL)
        response = model.generate_content(
            _PROMPT_TEMPLATE.format(transcript=transcript.strip()),
            generation_config={"temperature": 0, "max_output_tokens": 8},
        )
        raw_text = (response.text or "").strip()
        match = _NUMBER_RE.search(raw_text)
        if not match:
            logger.warning("Gemini returned non-numeric output: %r", raw_text)
            return {"scam_score": 0, "source": "placeholder", "note": "unparseable model output"}

        score = _clamp(int(match.group()))
        return {"scam_score": score, "source": "gemini"}

    except Exception as exc:
        logger.error("Gemini scam scoring failed: %s", exc)
        return {"scam_score": 0, "source": "placeholder", "note": str(exc)}
