def compute_risk(ml_output: dict, transcript: str) -> dict:
    synthetic_score = ml_output["synthetic_probability"] * 40
    mismatch_score = (1 - ml_output["speaker_match_probability"]) * 25

    financial_keywords = ["transfer", "lakh", "urgent", "immediately"]
    conversation_risk = 25 if any(w in transcript.lower() for w in financial_keywords) else 5

    transaction_context = 10 if "transfer" in transcript.lower() else 2

    risk_score = int(synthetic_score + mismatch_score + conversation_risk + transaction_context)
    risk_score = min(risk_score, 100)

    if risk_score <= 30:
        risk_level = "LOW"
    elif risk_score <= 60:
        risk_level = "MEDIUM"
    elif risk_score <= 80:
        risk_level = "HIGH"
    else:
        risk_level = "CRITICAL"

    risk_factors = []
    if ml_output["synthetic_probability"] > 0.7:
        risk_factors.append("High synthetic voice probability")
    if ml_output["speaker_match_probability"] < 0.4:
        risk_factors.append("Speaker identity mismatch")
    if conversation_risk >= 25:
        risk_factors.append("Urgent financial request")

    return {
        "risk_score": risk_score,
        "risk_level": risk_level,
        "risk_factors": risk_factors
    }