import os
import uuid

from fastapi import APIRouter, HTTPException, Depends

from app.database import db
from app.dependencies import get_current_user
from app.schemas import (
    UserRegisterRequest,
    UserLoginRequest,
    GoogleAuthRequest,
    TokenResponse,
    UserResponse,
)
from app.services.auth_service import hash_password, verify_password, create_access_token

router = APIRouter()

ADMIN_EMAILS = {
    e.strip().lower()
    for e in os.getenv("ADMIN_EMAILS", "").split(",")
    if e.strip()
}


def _role_for(email: str) -> str:
    return "admin" if email.lower() in ADMIN_EMAILS else "user"


@router.post("/api/v1/auth/register", response_model=UserResponse)
async def register(payload: UserRegisterRequest):
    existing = await db["users"].find_one({"email": payload.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user_id = str(uuid.uuid4())
    user = {
        "user_id": user_id,
        "name": payload.name,
        "email": payload.email,
        "password": hash_password(payload.password),
        "provider": "email",
        "role": _role_for(payload.email),
    }
    await db["users"].insert_one(user)
    return {"user_id": user_id, "name": payload.name, "email": payload.email, "role": user["role"]}


@router.post("/api/v1/auth/login", response_model=TokenResponse)
async def login(payload: UserLoginRequest):
    user = await db["users"].find_one({"email": payload.email})
    if not user or not user.get("password") or not verify_password(payload.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token(user["user_id"])
    return {"access_token": token}


@router.get("/api/v1/auth/google/status")
async def google_auth_status():
    """Non-secret readiness check for the Google OAuth integration."""
    client_configured = bool(os.getenv("GOOGLE_CLIENT_ID"))
    try:
        from google.oauth2 import id_token as _google_id_token  # noqa: F401
        package_available = True
    except ImportError:
        package_available = False
    return {
        "configured": client_configured and package_available,
        "client_configured": client_configured,
        "backend_configured": client_configured,
        "package_available": package_available,
    }


@router.post("/api/v1/auth/google", response_model=TokenResponse)
async def google_auth(payload: GoogleAuthRequest):
    """
    Verify a Google ID token (sent by @react-oauth/google's <GoogleLogin> on
    the frontend), find-or-create the user, and return our own JWT.

    Requires GOOGLE_CLIENT_ID in .env and the `google-auth` package
    (pip install google-auth).
    """
    try:
        from google.oauth2 import id_token as google_id_token
        from google.auth.transport import requests as google_requests
    except ImportError as exc:
        raise HTTPException(
            status_code=500,
            detail="google-auth is not installed. Run: pip install google-auth",
        ) from exc

    client_id = os.getenv("GOOGLE_CLIENT_ID")
    if not client_id:
        raise HTTPException(status_code=500, detail="GOOGLE_CLIENT_ID is not configured")

    try:
        claims = google_id_token.verify_oauth2_token(
            payload.credential, google_requests.Request(), client_id
        )
    except ValueError as exc:
        raise HTTPException(status_code=401, detail=f"Invalid Google token: {exc}")

    email = claims.get("email")
    if not email:
        raise HTTPException(status_code=401, detail="Google token had no email claim")

    name = claims.get("name") or email.split("@")[0]
    avatar = claims.get("picture")

    user = await db["users"].find_one({"email": email})
    if not user:
        user = {
            "user_id": str(uuid.uuid4()),
            "name": name,
            "email": email,
            "avatar": avatar,
            "provider": "google",
            "role": _role_for(email),
        }
        await db["users"].insert_one(user)
    elif user.get("role") != "admin" and _role_for(email) == "admin":
        # promote if the account was later added to ADMIN_EMAILS
        await db["users"].update_one({"email": email}, {"$set": {"role": "admin"}})
        user["role"] = "admin"

    token = create_access_token(user["user_id"])
    return {"access_token": token}


@router.get("/api/v1/auth/me", response_model=UserResponse)
async def get_me(current_user=Depends(get_current_user)):
    """
    The authoritative source for the logged-in user's role. The frontend
    calls this right after login (email or Google) so it never has to trust
    a client-side field for admin/demo-data gating — that decision always
    comes from the DB record behind the JWT.
    """
    return {
        "user_id": current_user["user_id"],
        "name": current_user.get("name", ""),
        "email": current_user.get("email", ""),
        "role": current_user.get("role", "user"),
    }
