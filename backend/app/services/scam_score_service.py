"""Scam-likelihood scoring for call transcripts.

The live demo must keep working even when Gemini is unavailable.  Therefore a
fast local rules engine always runs first; Gemini is an optional second signal.
The returned score is a single 0-100 value and is safe to use in live updates.
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
    logger.warning("google-generativeai not installed; Gemini scam scoring disabled.")

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")
_configured = False

if GEMINI_SDK_AVAILABLE and GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    _configured = True
elif GEMINI_SDK_AVAILABLE:
    logger.warning("GEMINI_API_KEY not set; using local scam scoring only.")

_PROMPT_TEMPLATE = (
    "You are a fraud-detection classifier. Read this phone call transcript and "
    "output ONLY one integer from 0 to 100. 0 means clearly safe and 100 means "
    "clearly a scam. Consider impersonation, urgency, OTP/password requests, "
    "financial transfers, payment redirection, threats, and requests to bypass "
    "normal verification.\n\nTranscript:\n{transcript}"
)
_NUMBER_RE = re.compile(r"-?\d+")

# High-signal phrases used as a deterministic fallback. These make the demo
# useful even if Whisper/Gemini has a temporary failure or no API key is set.
_RULES = [
    (r"\botp\b|one[- ]time password|verification code|security code", 35, "OTP/verification-code request"),
    (r"\bpin\b|password|passcode|login code", 30, "credential request"),
    (r"transfer (the )?money|send (the )?money|wire (the )?money|wire transfer", 30, "money-transfer request"),
    (r"bank account|account has been blocked|account is blocked|card has been blocked", 22, "bank/account pressure"),
    (r"urgent|immediately|right now|as soon as possible|within (\d+|an?) hour", 15, "artificial urgency"),
    (r"gift card|crypto|bitcoin|usdt", 25, "high-risk payment method"),
    (r"routing number|account number|debit card|credit card", 20, "sensitive financial information"),
    (r"do not tell|keep this secret|don't tell anyone|confidential", 18, "secrecy request"),
    (r"police|arrest|legal action|lawsuit|fine|penalty", 15, "threat/intimidation"),
    (r"verify your identity|kyc|remote access|install.*app|screen share", 18, "identity/access request"),
]


def _clamp(value: int, lo: int = 0, hi: int = 100) -> int:
    return max(lo, min(hi, int(value)))


def _local_scam_score(transcript: str) -> tuple[int, list[str]]:
    text = (transcript or "").lower().strip()
    score = 0
    reasons: list[str] = []
    for pattern, points, reason in _RULES:
        if re.search(pattern, text, flags=re.IGNORECASE):
            score += points
            reasons.append(reason)

    # Multiple different scam indicators are stronger than a single keyword.
    if len(reasons) >= 3:
        score += 10
    if len(reasons) >= 5:
        score += 10

    return _clamp(score), reasons


def get_scam_score(transcript: str) -> dict:
    """Return a live-safe scam score plus source/reasons metadata."""
    text = (transcript or "").strip()
    if not text or text.startswith("["):
        return {
            "scam_score": 0,
            "source": "no_transcript",
            "reasons": [],
            "note": "no usable transcript",
        }

    local_score, reasons = _local_scam_score(text)

    # Gemini is optional. Never replace a useful local score with zero just
    # because the API is unavailable. Use the stronger signal for a demo-safe
    # conservative result.
    gemini_score = None
    if _configured:
        try:
            model = genai.GenerativeModel(GEMINI_MODEL)
            response = model.generate_content(
                _PROMPT_TEMPLATE.format(transcript=text),
                generation_config={"temperature": 0, "max_output_tokens": 8},
            )
            raw_text = (response.text or "").strip()
            match = _NUMBER_RE.search(raw_text)
            if match:
                gemini_score = _clamp(int(match.group()))
            else:
                logger.warning("Gemini returned non-numeric output: %r", raw_text)
        except Exception as exc:
            logger.warning("Gemini scam scoring failed; keeping local score: %s", exc)

    if gemini_score is None:
        final_score = local_score
        source = "rules"
    else:
        # Keep the deterministic safety signal while allowing Gemini to raise
        # the score when it recognizes contextual social engineering.
        final_score = _clamp(max(local_score, gemini_score))
        source = "rules+gemini"

    return {
        "scam_score": final_score,
        "source": source,
        "local_score": local_score,
        "gemini_score": gemini_score,
        "reasons": reasons,
    }
