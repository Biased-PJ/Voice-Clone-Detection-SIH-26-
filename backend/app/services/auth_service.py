import os
from datetime import datetime, timedelta, timezone
from typing import Any, Optional, Protocol, cast

from dotenv import load_dotenv
from jose import JWTError, jwt
from passlib.context import CryptContext

load_dotenv()

def _required_setting(name: str) -> str:
    value = os.getenv(name)
    if not value:
        raise RuntimeError(f"{name} is not configured")
    return value

def _expiry_minutes() -> int:
    value = os.getenv("JWT_EXPIRE_MINUTES", "1440")
    try:
        minutes = int(value)
    except ValueError as exc:
        raise RuntimeError("JWT_EXPIRE_MINUTES must be an integer") from exc
    if minutes <= 0:
        raise RuntimeError("JWT_EXPIRE_MINUTES must be greater than zero")
    return minutes

JWT_SECRET = _required_setting("JWT_SECRET")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
JWT_EXPIRE_MINUTES = _expiry_minutes()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class _PasswordContext(Protocol):
    def hash(self, secret: str) -> str: ...

    def verify(self, secret: str, hashed: str) -> bool: ...

typed_pwd_context = cast(_PasswordContext, pwd_context)
typed_jwt = cast(Any, jwt)

def hash_password(password: str) -> str:
    """Return a bcrypt hash for a plaintext password."""
    return typed_pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Return False for invalid password hashes instead of failing login."""
    try:
        return typed_pwd_context.verify(plain_password, hashed_password)
    except (TypeError, ValueError):
        return False

def create_access_token(user_id: str) -> str:
    """Create a signed access token containing the user's stable id."""
    if not user_id:
        raise ValueError("user_id must not be empty")

    expires_at = datetime.now(timezone.utc) + timedelta(minutes=JWT_EXPIRE_MINUTES)
    payload: dict[str, object] = {"sub": user_id, "exp": expires_at}
    return cast(str, typed_jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM))

def decode_access_token(token: str) -> Optional[str]:
    """Return the token subject, or None when the token is unusable."""
    if not token:
        return None

    try:
        payload = cast(dict[str, object], typed_jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM]))
    except (JWTError, TypeError, ValueError):
        return None

    subject = payload.get("sub")
    return subject if isinstance(subject, str) and subject else None