from typing import Any, Optional, cast

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.database import db
from app.services.auth_service import decode_access_token


bearer_scheme = HTTPBearer(auto_error=False)


UserRecord = dict[str, Any]


async def _load_user(token: Optional[str]) -> Optional[UserRecord]:
    if not token:
        return None

    user_id = decode_access_token(token)

    if not user_id:
        return None

    users_collection = cast(Any, db["users"])
    user = cast(
        Optional[UserRecord],
        await users_collection.find_one({"user_id": user_id}),
    )

    if not user:
        return None

    user.pop("password", None)
    user.pop("_id", None)

    return user


async def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme)
) -> Optional[UserRecord]:
    token = credentials.credentials if credentials else None
    return await _load_user(token)


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme)
) -> UserRecord:
    token = credentials.credentials if credentials else None

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = await _load_user(token)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user