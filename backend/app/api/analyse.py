from datetime import datetime, timezone
import asyncio
import logging
import re

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


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


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


def _conclusion(result: AnalyzeResponse) -> str:
    ai = result.ai_voice_percent
    scam = result.scam_score
    risk = result.risk_score
    if ai >= 70 and scam >= 70:
        return "HIGH-RISK AI VOICE SCAM"
    if ai >= 70:
        return "LIKELY CLONED / SYNTHETIC VOICE"
    if scam >= 70:
        return "LIKELY SCAM — HUMAN VOICE POSSIBLE"
    if risk >= 40:
        return "SUSPICIOUS CALL — VERIFY BEFORE TRUSTING"
    return "LIKELY SAFE / NO STRONG THREAT DETECTED"


def _is_usable_transcript(text: str) -> bool:
    if not text:
        return False
    return not text.lstrip().startswith("[") and len(text.strip()) >= 2


def _merge_transcript(existing: list[str], text: str) -> None:
    text = re.sub(r"\s+", " ", (text or "").strip())
    if not _is_usable_transcript(text):
        return
    # Browser recognition can repeat a phrase after restarting. Avoid storing
    # exact duplicates while preserving the full chronological transcript.
    if not existing or existing[-1].strip().lower() != text.lower():
        existing.append(text)


@router.post("/api/v1/analyze/audio", response_model=AnalyzeResponse)
async def analyze_audio(
    session_id: str = Form(...),
    language: str = Form(...),
    file: UploadFile = File(...),
    current_user=Depends(get_current_user),
):
    """Batch analysis endpoint. FFmpeg/ML service decides whether audio is decodable."""
    audio_bytes = await file.read()
    if not audio_bytes:
        raise HTTPException(status_code=422, detail="Audio file is empty")

    transcript = await run_in_threadpool(transcribe_audio, audio_bytes, language)
    try:
        ml_output = await run_in_threadpool(analyze_voice, audio_bytes, transcript, language)
    except (OSError, ValueError) as exc:
        raise HTTPException(status_code=422, detail=f"Audio could not be decoded: {exc}") from exc

    scam_result = await run_in_threadpool(get_scam_score, transcript)
    result = _build_response(session_id, language, ml_output, transcript, int(scam_result.get("scam_score", 0)))

    await db["analysis_results"].insert_one({
        **result.dict(),
        "transcript": transcript,
        "file_name": file.filename,
        "user_id": current_user["user_id"],
        "created_at": _now_iso(),
        "analysis_type": "recorded",
        "conclusion": _conclusion(result),
    })
    return result


@router.websocket("/api/v1/analyze/live")
async def analyze_live(websocket: WebSocket):
    """Live analysis: transient 2-second inference windows, exactly one final DB record."""
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
    latest_scam_reasons: list[str] = []
    latest_result: AnalyzeResponse | None = None
    finalized = False
    browser_transcript_received = False
    last_audio_transcript_index = 0

    def aggregate_ml() -> dict:
        if not synthetic_scores:
            return {"synthetic_probability": 0.5, "speaker_match_probability": 0.5, "ai_voice_percent": 50.0}
        synthetic = max(0.0, min(1.0, sum(synthetic_scores) / len(synthetic_scores)))
        return {
            "synthetic_probability": round(synthetic, 4),
            "speaker_match_probability": round(1.0 - synthetic, 4),
            "ai_voice_percent": round(synthetic * 100, 2),
        }

    async def score_current_transcript() -> None:
        nonlocal latest_scam_score, latest_scam_reasons
        full_transcript = " ".join(transcript_parts).strip()
        if not _is_usable_transcript(full_transcript):
            return
        scam_result = await run_in_threadpool(get_scam_score, full_transcript)
        score = int(scam_result.get("scam_score", 0))
        # Keep call-level evidence. A harmless later sentence must not erase a
        # strong scam signal already detected during this call.
        latest_scam_score = max(latest_scam_score, score)
        latest_scam_reasons = list(dict.fromkeys(latest_scam_reasons + list(scam_result.get("reasons", []))))

    async def send_live_update(transcript: str = "") -> None:
        nonlocal latest_result
        full_transcript = " ".join(transcript_parts).strip()
        latest_result = _build_response(session_id, language, aggregate_ml(), full_transcript, latest_scam_score)
        await websocket.send_json({
            "type": "analysis",
            **latest_result.dict(),
            "transcript": transcript,
            "scam_reasons": latest_scam_reasons,
        })

    async def finalize_call():
        nonlocal latest_result, finalized
        if finalized:
            return

        # Mark finalization only after all scoring/persistence succeeds. This
        # prevents a transient DB/processing exception from permanently losing
        # the final conclusion.
        await score_current_transcript()
        full_transcript = " ".join(transcript_parts).strip()
        latest_result = _build_response(session_id, language, aggregate_ml(), full_transcript, latest_scam_score)
        conclusion = _conclusion(latest_result)
        now = datetime.now(timezone.utc)

        existing = await db["call_sessions"].find_one({"session_id": session_id})
        started_at = existing.get("started_at") if existing else session.get("started_at")
        duration_seconds = existing.get("duration_seconds") if existing else None
        if started_at:
            try:
                started_dt = datetime.fromisoformat(str(started_at).replace("Z", "+00:00"))
                if started_dt.tzinfo is None:
                    started_dt = started_dt.replace(tzinfo=timezone.utc)
                duration_seconds = max(0, int((now - started_dt).total_seconds()))
            except (TypeError, ValueError):
                pass

        # Upsert by session_id so a retry/finalize race can never create two
        # final records for the same live call.
        analysis_doc = {
            **latest_result.dict(),
            "transcript": full_transcript,
            "file_name": "live-call-final",
            "user_id": user["user_id"],
            "created_at": _now_iso(),
            "updated_at": _now_iso(),
            "live_final": True,
            "analysis_type": "live",
            "conclusion": conclusion,
            "duration_seconds": duration_seconds,
            "scam_reasons": latest_scam_reasons,
        }
        await db["analysis_results"].update_one(
            {"session_id": session_id, "user_id": user["user_id"], "live_final": True},
            {"$set": analysis_doc},
            upsert=True,
        )

        # Store the complete result on the call session too. This makes Call
        # History/Intelligence resilient even if one frontend refresh happens
        # between the websocket and the history API call.
        await db["call_sessions"].update_one(
            {"session_id": session_id},
            {"$set": {
                "status": "ended",
                "ended_at": now.isoformat(),
                "duration_seconds": duration_seconds,
                "risk_score": latest_result.risk_score,
                "risk_level": latest_result.risk_level,
                "synthetic_probability": latest_result.synthetic_probability,
                "ai_voice_percent": latest_result.ai_voice_percent,
                "scam_score": latest_result.scam_score,
                "risk_factors": latest_result.risk_factors,
                "suggestion": latest_result.suggestion,
                "transcript": full_transcript,
                "conclusion": conclusion,
                "threat_location": latest_result.threat_location,
                "analysis_completed": True,
            }},
        )

        finalized = True
        await websocket.send_json({
            "type": "final",
            **latest_result.dict(),
            "conclusion": conclusion,
            "transcript": full_transcript,
            "scam_reasons": latest_scam_reasons,
            "duration_seconds": duration_seconds,
        })

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
                    # The browser can provide instant text, but backend Whisper
                    # is still allowed as a safety net if browser text stops.
                    continue

                if control.get("type") == "transcript":
                    transcript = str(control.get("text", "")).strip()
                    if _is_usable_transcript(transcript):
                        _merge_transcript(transcript_parts, transcript)
                        browser_transcript_received = True
                        await score_current_transcript()
                        await send_live_update(transcript)
                    continue

                if control.get("type") == "finalize":
                    try:
                        await finalize_call()
                    except Exception as exc:
                        logger.exception("Final call analysis failed")
                        await websocket.send_json({"type": "error", "error": f"Final call analysis failed: {exc}"})
                    continue

            if finalized:
                continue

            audio_bytes = message.get("bytes")
            if not audio_bytes:
                continue

            try:
                # Run acoustic analysis and Whisper concurrently. This is the
                # key reliability change: Score 2 no longer depends exclusively
                # on browser SpeechRecognition being available.
                ml_task = run_in_threadpool(analyze_voice, audio_bytes, "", language)
                stt_task = run_in_threadpool(transcribe_audio, audio_bytes, language)
                ml_output, whisper_text = await asyncio.gather(ml_task, stt_task)
                synthetic_scores.append(float(ml_output["synthetic_probability"]))

                # If browser text is already arriving, prefer it. Otherwise use
                # Whisper for this audio window immediately.
                if not browser_transcript_received and _is_usable_transcript(whisper_text):
                    _merge_transcript(transcript_parts, whisper_text)
                    last_audio_transcript_index = len(transcript_parts)
                elif browser_transcript_received and len(transcript_parts) == last_audio_transcript_index:
                    # Browser recognition may have temporarily gone silent.
                    # Whisper still gets a chance to recover the current window.
                    if _is_usable_transcript(whisper_text):
                        _merge_transcript(transcript_parts, whisper_text)
                        last_audio_transcript_index = len(transcript_parts)

                await score_current_transcript()
                await send_live_update(whisper_text if _is_usable_transcript(whisper_text) else "")
            except (OSError, ValueError) as exc:
                await websocket.send_json({"type": "error", "error": f"Audio could not be decoded: {exc}"})
            except Exception as exc:
                logger.exception("Live inference failed")
                await websocket.send_json({"type": "error", "error": f"Live inference failed: {exc}"})

    except WebSocketDisconnect:
        # Do not create a fake analysis record on an unexpected disconnect.
        # The final record is created only by an explicit finalize command.
        pass
