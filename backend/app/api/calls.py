from fastapi import APIRouter, HTTPException, Depends, Body
from datetime import datetime, timezone
import uuid

from app.database import db
from app.dependencies import get_current_user
from app.schemas import CallStartRequest, CallSessionResponse

router = APIRouter()

@router.post("/api/v1/calls/start", response_model=CallSessionResponse)
async def start_call(payload: CallStartRequest, current_user=Depends(get_current_user)):

    session_id = str(uuid.uuid4())
    session = {
        "session_id": session_id,
        "user_id": current_user["user_id"],
        "language": payload.language,
        "status": "active",
        "started_at": datetime.now(timezone.utc).isoformat(),
        "ended_at": None,
    }
    await db["call_sessions"].insert_one(session)
    session.pop("_id", None)
    return session

@router.get("/api/v1/calls/{session_id}", response_model=CallSessionResponse)
async def get_call(session_id: str, current_user=Depends(get_current_user)):
    session = await db["call_sessions"].find_one({"session_id": session_id})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session["user_id"] != current_user["user_id"] and current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Not your session")
    session.pop("_id", None)
    return session

@router.post("/api/v1/calls/{session_id}/end", response_model=CallSessionResponse)
async def end_call(session_id: str, current_user=Depends(get_current_user), payload: dict | None = Body(default=None)):
    """End a live call and guarantee that one final analysis record exists.

    The frontend may send its last known websocket result as ``payload``. This
    endpoint is intentionally idempotent: repeated clicks/retries update the
    same session/result instead of creating duplicate history entries.
    """
    existing = await db["call_sessions"].find_one({"session_id": session_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Session not found")
    if existing["user_id"] != current_user["user_id"] and current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Not your session")

    ended_at = datetime.now(timezone.utc)
    started_at = existing.get("started_at")
    duration_seconds = existing.get("duration_seconds")
    if started_at:
        try:
            started_dt = datetime.fromisoformat(str(started_at).replace("Z", "+00:00"))
            if started_dt.tzinfo is None:
                started_dt = started_dt.replace(tzinfo=timezone.utc)
            duration_seconds = max(0, int((ended_at - started_dt).total_seconds()))
        except (TypeError, ValueError):
            pass

    payload = payload or {}

    result = payload.get("result") if isinstance(payload.get("result"), dict) else payload
    result = result if isinstance(result, dict) else {}

    update = {
        "status": "ended",
        "ended_at": ended_at.isoformat(),
        "duration_seconds": duration_seconds,
    }
    allowed = (
        "language", "risk_score", "risk_level", "synthetic_probability",
        "speaker_match_probability", "ai_voice_percent", "scam_score",
        "risk_factors", "suggestion", "threat_location", "transcript",
        "conclusion", "scam_reasons",
    )
    for key in allowed:
        if key in result and result[key] is not None:
            update[key] = result[key]
    update["analysis_completed"] = True
    await db["call_sessions"].update_one({"session_id": session_id}, {"$set": update})

    final_session = await db["call_sessions"].find_one({"session_id": session_id})
    final_result = await db["analysis_results"].find_one({
        "session_id": session_id,
        "user_id": existing["user_id"],
        "live_final": True,
    })
    if not final_result:
        s = final_session or existing
        analysis_doc = {
            "session_id": session_id,
            "language": s.get("language", "auto"),
            "risk_score": int(s.get("risk_score", 0) or 0),
            "risk_level": s.get("risk_level", "LOW"),
            "synthetic_probability": float(s.get("synthetic_probability", 0.5) or 0.5),
            "speaker_match_probability": float(s.get("speaker_match_probability", 0.5) or 0.5),
            "ai_voice_percent": float(s.get("ai_voice_percent", 50) or 50),
            "scam_score": int(s.get("scam_score", 0) or 0),
            "risk_factors": s.get("risk_factors", []) or [],
            "suggestion": s.get("suggestion", "Review the call and verify the caller independently."),
            "threat_location": s.get("threat_location"),
            "transcript": s.get("transcript", "") or "",
            "file_name": "live-call-final",
            "user_id": existing["user_id"],
            "created_at": s.get("ended_at") or ended_at.isoformat(),
            "updated_at": ended_at.isoformat(),
            "live_final": True,
            "analysis_type": "live",
            "conclusion": s.get("conclusion", "LIKELY SAFE / NO STRONG THREAT DETECTED"),
            "duration_seconds": duration_seconds,
            "scam_reasons": s.get("scam_reasons", []) or [],
        }
        await db["analysis_results"].update_one(
            {"session_id": session_id, "user_id": existing["user_id"], "live_final": True},
            {"$set": analysis_doc},
            upsert=True,
        )

    result_session = await db["call_sessions"].find_one({"session_id": session_id})
    result_session.pop("_id", None)
    return result_session

@router.get("/api/v1/calls")
async def list_calls(current_user=Depends(get_current_user)):
    """Return all real analyses, including every completed live call exactly once."""
    is_admin = current_user.get("role") == "admin"
    user_filter = {} if is_admin else {"user_id": current_user["user_id"]}

    analysis_filter = {**user_filter, "live_chunk": {"$ne": True}}
    analysis_cursor = db["analysis_results"].find(analysis_filter).sort("created_at", -1)
    analysis_results = await analysis_cursor.to_list(length=1000)

    session_filter = {} if is_admin else {"user_id": current_user["user_id"]}
    session_cursor = db["call_sessions"].find(session_filter).sort("started_at", -1)
    call_sessions = await session_cursor.to_list(length=1000)

    analysis_ids = {str(x.get("session_id")) for x in analysis_results if x.get("session_id")}
    for s in call_sessions:
        sid = s.get("session_id")
        if s.get("status") == "ended" and sid and sid not in analysis_ids and s.get("analysis_completed"):
            analysis_results.append({
                "session_id": sid,
                "language": s.get("language", "auto"),
                "risk_score": int(s.get("risk_score", 0) or 0),
                "risk_level": s.get("risk_level", "LOW"),
                "synthetic_probability": float(s.get("synthetic_probability", 0.5) or 0.5),
                "speaker_match_probability": float(s.get("speaker_match_probability", 0.5) or 0.5),
                "ai_voice_percent": float(s.get("ai_voice_percent", 50) or 50),
                "scam_score": int(s.get("scam_score", 0) or 0),
                "risk_factors": s.get("risk_factors", []) or [],
                "suggestion": s.get("suggestion", "Review the call and verify the caller independently."),
                "threat_location": s.get("threat_location"),
                "transcript": s.get("transcript", "") or "",
                "file_name": "live-call-final",
                "user_id": s.get("user_id"),
                "created_at": s.get("ended_at") or s.get("started_at"),
                "live_final": True,
                "analysis_type": "live",
                "conclusion": s.get("conclusion", "LIKELY SAFE / NO STRONG THREAT DETECTED"),
                "duration_seconds": s.get("duration_seconds"),
                "scam_reasons": s.get("scam_reasons", []) or [],
            })

    real_ids = {str(x.get("session_id")) for x in analysis_results if x.get("session_id")}
    anonymous_count = sum(1 for x in analysis_results if not x.get("session_id"))
    total_analysis_results = len(real_ids) + anonymous_count

    demo_calls = []
    if is_admin:
        demo_cursor = db["calls"].find({"is_demo": True})
        demo_calls = await demo_cursor.to_list(length=500)

    for doc in (*analysis_results, *call_sessions, *demo_calls):
        doc.pop("_id", None)

    analysis_results.sort(key=lambda x: str(x.get("created_at", "")), reverse=True)
    return {
        "analysis_results": analysis_results[:1000],
        "call_sessions": call_sessions,
        "total_analysis_results": total_analysis_results,
        "demo_calls": demo_calls,
    }
