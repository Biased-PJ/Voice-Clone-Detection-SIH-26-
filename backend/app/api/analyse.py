from datetime import datetime
import logging

from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException, WebSocket, WebSocketDisconnect
from starlette.concurrency import run_in_threadpool

from app.database import db
from app.dependencies import get_current_user, _load_user
from app.schemas import AnalyzeResponse
from app.services.location_service import get_simulated_threat_location
from app.services.ml_service import analyze_voice
from app.services.risk_engine import compute_risk
from app.services.suggestion_engine import generate_suggestion
from app.services.speech_to_text import transcribe_audio
from app.services.scam_score_service import get_scam_score

router = APIRouter()
logger = logging.getLogger(__name__)


def _threat_location(session_id: str) -> dict:
    return get_simulated_threat_location(session_id)


def _build_response(session_id: str, language: str, ml_output: dict, transcript: str, scam_score: int) -> AnalyzeResponse:
    risk = compute_risk(ml_output, transcript, scam_score=scam_score)
    suggestion = generate_suggestion(risk["risk_level"])
    return AnalyzeResponse(
        session_id=session_id,
        language=language,
        risk_score=risk["risk_score"],
        risk_level=risk["risk_level"],
        synthetic_probability=ml_output["synthetic_probability"],
        speaker_match_probability=ml_output["speaker_match_probability"],
        ai_voice_percent=ml_output["ai_voice_percent"],
        scam_score=int(scam_score),
        risk_factors=risk["risk_factors"],
        suggestion=suggestion,
        threat_location=_threat_location(session_id),
    )


@router.post("/api/v1/analyze/audio", response_model=AnalyzeResponse)
async def analyze_audio(
    session_id: str = Form(...),
    language: str = Form(...),
    file: UploadFile = File(...),
    current_user=Depends(get_current_user),
):
    """Batch analysis endpoint used by Recorded Analysis."""
    audio_bytes = await file.read()
    if not audio_bytes:
        raise HTTPException(status_code=422, detail="Audio file is empty")

    allowed_types = {
        "audio/wav", "audio/x-wav", "audio/mpeg", "audio/mp4", "audio/flac",
        "audio/ogg", "audio/webm", "audio/webm;codecs=opus",
    }
    if file.content_type and file.content_type not in allowed_types:
        raise HTTPException(status_code=422, detail="Unsupported audio type")

    transcript = await run_in_threadpool(transcribe_audio, audio_bytes, language)
    try:
        ml_output = await run_in_threadpool(analyze_voice, audio_bytes, transcript, language)
    except (OSError, ValueError) as exc:
        raise HTTPException(status_code=422, detail=f"Audio could not be decoded: {exc}") from exc

    scam_result = await run_in_threadpool(get_scam_score, transcript)
    result = _build_response(
        session_id, language, ml_output, transcript, int(scam_result.get("scam_score", 0))
    )

    await db["analysis_results"].insert_one({
        **result.dict(),
        "transcript": transcript,
        "file_name": file.filename,
        "user_id": current_user["user_id"],
        "created_at": datetime.utcnow().isoformat(),
    })
    return result


@router.websocket("/api/v1/analyze/live")
async def analyze_live(websocket: WebSocket):
    """Live microphone inference. Chunks are transient; one call creates one DB result."""
    token = websocket.query_params.get("token")
    session_id = websocket.query_params.get("session_id")
    language = websocket.query_params.get("language", "en")

    if not token or not session_id:
        await websocket.close(code=1008, reason="Authentication and session_id are required")
        return

    user = await _load_user(token)
    if not user:
        await websocket.close(code=1008, reason="Invalid or expired token")
        return

    session = await db["call_sessions"].find_one({"session_id": session_id})
    if not session:
        await websocket.close(code=1008, reason="Call session not found")
        return
    if session.get("user_id") != user.get("user_id") and user.get("role") != "admin":
        await websocket.close(code=1008, reason="Session does not belong to user")
        return

    await websocket.accept()
    await websocket.send_json({"type": "ready", "session_id": session_id})

    transcript_parts: list[str] = []
    synthetic_scores: list[float] = []
    latest_scam_score = 0
    chunks_since_scam_check = 0
    latest_result: AnalyzeResponse | None = None
    finalized = False
    transcription_mode = "whisper"
    browser_transcript_received = False

    def usable_transcript(text: str) -> bool:
        return bool(text and not text.startswith("["))

    def aggregate_ml() -> dict:
        if not synthetic_scores:
            return {
                "synthetic_probability": 0.5,
                "speaker_match_probability": 0.5,
                "ai_voice_percent": 50.0,
            }
        synthetic = max(0.0, min(1.0, sum(synthetic_scores) / len(synthetic_scores)))
        return {
            "synthetic_probability": round(synthetic, 4),
            "speaker_match_probability": round(1.0 - synthetic, 4),
            "ai_voice_percent": round(synthetic * 100, 2),
        }

    async def score_current_transcript() -> None:
        nonlocal latest_scam_score
        full_transcript = " ".join(transcript_parts).strip()
        if full_transcript:
            scam_result = await run_in_threadpool(get_scam_score, full_transcript)
            latest_scam_score = int(scam_result.get("scam_score", latest_scam_score))

    async def finalize_call():
        nonlocal latest_result, finalized
        if finalized:
            return
        finalized = True

        await score_current_transcript()
        full_transcript = " ".join(transcript_parts).strip()
        ml_output = aggregate_ml()
        latest_result = _build_response(
            session_id, language, ml_output, full_transcript, latest_scam_score
        )

        ai_score = latest_result.ai_voice_percent
        scam_score = latest_result.scam_score
        risk_score = latest_result.risk_score

        if ai_score >= 70 and scam_score >= 70:
            conclusion = "HIGH-RISK AI VOICE SCAM"
        elif ai_score >= 70:
            conclusion = "LIKELY CLONED / SYNTHETIC VOICE"
        elif scam_score >= 70:
            conclusion = "LIKELY SCAM — HUMAN VOICE POSSIBLE"
        elif risk_score >= 40:
            conclusion = "SUSPICIOUS CALL — VERIFY BEFORE TRUSTING"
        else:
            conclusion = "LIKELY SAFE / NO STRONG THREAT DETECTED"

        # Send the final result first so the UI conclusion popup is not blocked
        # by a slow/transient database write.
        final_payload = {
            "type": "final",
            **latest_result.dict(),
            "conclusion": conclusion,
            "transcript": full_transcript,
        }
        await websocket.send_json(final_payload)

        # IMPORTANT: exactly one analysis_results record is written for the
        # entire live call. The 2-second windows are inference windows only.
        try:
            await db["analysis_results"].insert_one({
                **latest_result.dict(),
                "transcript": full_transcript,
                "file_name": "live-call-final",
                "user_id": user["user_id"],
                "created_at": datetime.utcnow().isoformat(),
                "live_final": True,
                "conclusion": conclusion,
                "duration_seconds": session.get("duration_seconds"),
            })
        except Exception as exc:
            logger.exception("Failed to persist final live analysis: %s", exc)

    try:
        while True:
            message = await websocket.receive()
            if message.get("type") == "websocket.disconnect":
                break

            text_message = message.get("text")
            if text_message:
                try:
                    import json
                    control = json.loads(text_message)
                except Exception:
                    control = {}
                if control.get("type") == "transcription_mode":
                    transcription_mode = str(control.get("mode", "whisper")).lower()
                    if transcription_mode not in {"browser", "whisper"}:
                        transcription_mode = "whisper"
                    continue

                if control.get("type") == "transcript":
                    transcript = str(control.get("text", "")).strip()
                    if usable_transcript(transcript):
                        transcript_parts.append(transcript.strip())
                        browser_transcript_received = True
                        # Browser SpeechRecognition gives us usable text even
                        # when faster-whisper is unavailable. Score immediately
                        # so scam indicators appear during the live call.
                        try:
                            await score_current_transcript()
                            full_transcript = " ".join(transcript_parts).strip()
                            result = _build_response(
                                session_id, language, aggregate_ml(), full_transcript, latest_scam_score
                            )
                            latest_result = result
                            await websocket.send_json({
                                "type": "analysis",
                                **result.dict(),
                                "transcript": transcript,
                            })
                        except Exception as exc:
                            await websocket.send_json({"type": "error", "error": f"Live transcript scoring failed: {exc}"})
                    continue

                if control.get("type") == "finalize":
                    try:
                        await finalize_call()
                    except Exception as exc:
                        await websocket.send_json({"type": "error", "error": f"Final call analysis failed: {exc}"})
                continue

            if finalized:
                continue

            audio_bytes = message.get("bytes")
            if not audio_bytes:
                continue

            try:
                # Each 2-second file is an inference window, not a call.
                ml_output = await run_in_threadpool(analyze_voice, audio_bytes, "", language)
                synthetic_scores.append(float(ml_output["synthetic_probability"]))

                # Prefer browser SpeechRecognition for live demo transcription.
                # Whisper remains the fallback when the browser does not expose
                # SpeechRecognition. This avoids a permanently-zero scam score
                # when the local Whisper model is unavailable.
                transcript = ""
                # Prefer browser transcription once it actually produces text.
                # Until then, use backend Whisper as a fallback.
                if transcription_mode != "browser" or not browser_transcript_received:
                    transcript = await run_in_threadpool(transcribe_audio, audio_bytes, language)
                    if usable_transcript(transcript):
                        transcript_parts.append(transcript.strip())

                chunks_since_scam_check += 1
                full_transcript = " ".join(transcript_parts).strip()

                # Re-score whenever usable transcript exists so Score 2 updates
                # immediately instead of waiting for several audio chunks.
                if full_transcript:
                    await score_current_transcript()
                    chunks_since_scam_check = 0

                result = _build_response(
                    session_id,
                    language,
                    ml_output,
                    full_transcript,
                    latest_scam_score,
                )
                latest_result = result

                # Do NOT write this chunk to analysis_results. It is only a
                # transient WebSocket update for the live dashboard.
                await websocket.send_json({
                    "type": "analysis",
                    **result.dict(),
                    "transcript": transcript if usable_transcript(transcript) else "",
                })
            except (OSError, ValueError) as exc:
                await websocket.send_json({"type": "error", "error": f"Audio could not be decoded: {exc}"})
            except Exception as exc:
                await websocket.send_json({"type": "error", "error": f"Live inference failed: {exc}"})

    except WebSocketDisconnect:
        pass
