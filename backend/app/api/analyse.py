from datetime import datetime

from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException
import random

from app.database import db
from app.dependencies import get_current_user
from app.schemas import AnalyzeResponse
from app.services.ml_service import analyze_voice
from app.services.risk_engine import compute_risk
from app.services.suggestion_engine import generate_suggestion
from app.services.speech_to_text import transcribe_audio
from app.services.scam_score_service import get_scam_score

router = APIRouter()


@router.post("/api/v1/analyze/audio", response_model=AnalyzeResponse)
async def analyze_audio(
    session_id: str = Form(...),
    language: str = Form(...),
    file: UploadFile = File(...),
    current_user=Depends(get_current_user),
):
    """
    Single source of truth for recorded-audio + call-intelligence analysis:
    upload -> transcribe -> ML features -> risk score -> suggestion -> persist.
    """
    audio_bytes = await file.read()
    if not audio_bytes:
        raise HTTPException(status_code=422, detail="Audio file is empty")

    allowed_types = {"audio/wav", "audio/x-wav", "audio/mpeg", "audio/mp4", "audio/flac", "audio/ogg", "audio/webm"}
    if file.content_type and file.content_type not in allowed_types:
        raise HTTPException(status_code=422, detail="Unsupported audio type")

    transcript = transcribe_audio(audio_bytes, language)
    try:
        ml_output = analyze_voice(audio_bytes, transcript, language)
    except (OSError, ValueError) as exc:
        raise HTTPException(status_code=422, detail=f"Audio could not be decoded: {exc}") from exc
    # Score 2: transcript -> Gemini -> scam likelihood 0-100
    scam_result = get_scam_score(transcript)

    risk = compute_risk(ml_output, transcript)
    suggestion = generate_suggestion(risk["risk_level"])

    result = AnalyzeResponse(
        session_id=session_id,
        language=language,
        risk_score=risk["risk_score"],
        risk_level=risk["risk_level"],
        synthetic_probability=ml_output["synthetic_probability"],
        speaker_match_probability=ml_output["speaker_match_probability"],
        ai_voice_percent=ml_output["ai_voice_percent"],   # Score 1 (0-100)
        scam_score=scam_result["scam_score"],             # Score 2 (0-100)
        risk_factors=risk["risk_factors"],
        suggestion=suggestion,
    )

    cities = [
        ("Delhi", 28.6139, 77.2090), ("Mumbai", 19.0760, 72.8777),
        ("Bengaluru", 12.9716, 77.5946), ("Hyderabad", 17.3850, 78.4867),
        ("Chennai", 13.0827, 80.2707), ("Kolkata", 22.5726, 88.3639),
        ("Pune", 18.5204, 73.8567), ("Ahmedabad", 23.0225, 72.5714),
        ("Jaipur", 26.9124, 75.7873), ("Lucknow", 26.8467, 80.9462),
        ("Chandigarh", 30.7333, 76.7794), ("Bhopal", 23.2599, 77.4126),
    ]
    city, latitude, longitude = random.choice(cities)
    threat_location = {"city": city, "latitude": latitude, "longitude": longitude}
    result.threat_location = threat_location
    await db["analysis_results"].insert_one({
        **result.dict(),
        "transcript": transcript,
        "file_name": file.filename,
        "user_id": current_user["user_id"],
        "created_at": datetime.utcnow().isoformat(),
    })

    return result
