def generate_suggestion(risk_level: str) -> str:
    if risk_level == "CRITICAL":
        return "Do not approve the transaction. Verify the caller independently."

    elif risk_level == "HIGH":
        return "Perform secondary verification before proceeding."

    else:
        return "Proceed with standard verification."