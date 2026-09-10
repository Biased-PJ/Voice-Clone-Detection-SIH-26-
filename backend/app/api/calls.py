from fastapi import APIRouter, HTTPException, Depends
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
async def end_call(session_id: str, current_user=Depends(get_current_user)):
    existing = await db["call_sessions"].find_one({"session_id": session_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Session not found")
    if existing["user_id"] != current_user["user_id"] and current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Not your session")

    ended_at = datetime.now(timezone.utc)
    started_at = existing.get("started_at")
    duration_seconds = None
    if started_at:
        try:
            started_dt = datetime.fromisoformat(started_at.replace("Z", "+00:00"))
            if started_dt.tzinfo is None:
                started_dt = started_dt.replace(tzinfo=timezone.utc)
            duration_seconds = max(0, int((ended_at - started_dt).total_seconds()))
        except (TypeError, ValueError):
            duration_seconds = None

    result = await db["call_sessions"].find_one_and_update(
        {"session_id": session_id},
        {"$set": {
            "status": "ended",
            "ended_at": ended_at.isoformat(),
            "duration_seconds": duration_seconds,
        }},
        return_document=True,
    )
    result.pop("_id", None)
    return result


@router.get("/api/v1/calls")
async def list_calls(current_user=Depends(get_current_user)):
    """
    A logged-in user's own analysis history — never a URL param, always
    derived from the JWT. Admins additionally see demo data (is_demo: true
    records in the "calls" collection) plus every user's real data.
    """
    is_admin = current_user.get("role") == "admin"

    if is_admin:
        analysis_filter = {"live_chunk": {"$ne": True}}
        session_filter = {}
    else:
        analysis_filter = {
            "user_id": current_user["user_id"],
            "live_chunk": {"$ne": True},
        }
        session_filter = {"user_id": current_user["user_id"]}

    total_analysis_results = await db["analysis_results"].count_documents(analysis_filter)
    analysis_cursor = db["analysis_results"].find(analysis_filter).sort("created_at", -1)
    analysis_results = await analysis_cursor.to_list(length=500)

    session_cursor = db["call_sessions"].find(session_filter).sort("started_at", -1)
    call_sessions = await session_cursor.to_list(length=500)

    demo_calls = []
    if is_admin:
        demo_cursor = db["calls"].find({"is_demo": True})
        demo_calls = await demo_cursor.to_list(length=500)

    for doc in (*analysis_results, *call_sessions, *demo_calls):
        doc.pop("_id", None)

    return {
        "analysis_results": analysis_results,
        "call_sessions": call_sessions,
        "total_analysis_results": total_analysis_results,
        "demo_calls": demo_calls,
    }
