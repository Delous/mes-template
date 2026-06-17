from __future__ import annotations

from datetime import datetime, timedelta, timezone

import jwt
from jwt import ExpiredSignatureError, InvalidTokenError
from pydantic import ValidationError
from fastapi import HTTPException, status

from app.core.schema import TokenPayload, TokenPair, UserPublic
from app.core.config import get_settings

settings = get_settings()


def _build_token_payload(
    user: UserPublic,
    ttl: timedelta,
) -> dict:
    now = datetime.now(timezone.utc)
    expires_at = now + ttl

    return {
        "sub": str(user.id),
        "username": user.username,
        "full_name": user.full_name,
        "role": user.role,
        "workstation_ids": user.workstation_ids,
        "iat": int(now.timestamp()),
        "exp": int(expires_at.timestamp()),
    }


def _encode(payload: dict) -> str:
    return jwt.encode(
        payload,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM,
    )


def create_token_pair(user: UserPublic) -> TokenPair:
    access_token_payload = _build_token_payload(
        user=user,
        ttl=timedelta(minutes=settings.ACCESS_TOKEN_TTL_MINUTES),
    )

    refresh_token_payload = _build_token_payload(
        user=user,
        ttl=timedelta(days=settings.REFRESH_TOKEN_TTL_DAYS),
    )

    return TokenPair(
        access_token=_encode(access_token_payload),
        refresh_token=_encode(refresh_token_payload),
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_TTL_MINUTES * 60,
    )


def decode_token(token: str) -> TokenPayload:
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
            options={
                "require": [
                    "sub",
                    "username",
                    "full_name",
                    "role",
                    "workstation_ids",
                    "exp",
                    "iat",
                ],
            },
        )
        return TokenPayload(**payload)

    except ExpiredSignatureError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
        ) from exc

    except (InvalidTokenError, ValidationError) as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        ) from exc
