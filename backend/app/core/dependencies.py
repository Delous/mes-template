from __future__ import annotations

from typing import Annotated

from fastapi import Cookie, HTTPException, status

from app.core.config import get_settings
from app.core.jwt import decode_token
from app.core.schema import UserPublic

settings = get_settings()


async def get_current_user(
    access_token: Annotated[
        str | None,
        Cookie(alias=settings.ACCESS_COOKIE_NAME),
    ] = None,
) -> UserPublic:
    if not access_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )

    payload = decode_token(access_token)

    return UserPublic(
        id=payload.sub,
        username=payload.username,
        full_name=payload.full_name,
        role=payload.role,
        workstation_ids=payload.workstation_ids,
    )
