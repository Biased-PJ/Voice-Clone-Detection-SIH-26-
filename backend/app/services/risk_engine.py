def compute_risk(ml_output: dict, transcript: str, scam_score: int = 0) -> dict:
    """Combine acoustic clone evidence and conversational scam evidence."""
    synthetic = max(0.0, min(1.0, float(ml_output.get("synthetic_probability", 0.5))))
    speaker_match = max(0.0, min(1.0, float(ml_output.get("speaker_match_probability", 0.5))))
    scam = max(0, min(100, int(scam_score)))
    text = (transcript or "").lower()

    synthetic_component = synthetic * 60
    mismatch_component = (1.0 - speaker_match) * 10
    scam_component = scam * 0.30

    financial_keywords = [
        "transfer", "bank", "account", "otp", "one time password", "password",
        "verification code", "lakh", "urgent", "immediately", "gift card",
        "crypto", "payment", "wire", "routing number", "pin", "passcode",
    ]
    keyword_hits = sum(1 for word in financial_keywords if word in text)
    conversation_component = min(8, keyword_hits * 2)

    risk_score = int(round(
        synthetic_component + mismatch_component + scam_component + conversation_component
    ))
    risk_score = max(0, min(100, risk_score))

    if risk_score <= 30:
        risk_level = "LOW"
    elif risk_score <= 60:
        risk_level = "MEDIUM"
    elif risk_score <= 80:
        risk_level = "HIGH"
    else:
        risk_level = "CRITICAL"

    risk_factors = []
    if synthetic >= 0.70:
        risk_factors.append("High synthetic voice probability")
    if speaker_match < 0.40:
        risk_factors.append("Speaker identity mismatch")
    if scam >= 60:
        risk_factors.append("High conversational scam likelihood")
    if keyword_hits:
        risk_factors.append("Suspicious financial or authentication language")

    return {
        "risk_score": risk_score,
        "risk_level": risk_level,
        "risk_factors": risk_factors,
    }
