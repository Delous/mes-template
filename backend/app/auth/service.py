from __future__ import annotations

from typing import Annotated

from fastapi import Cookie, Depends, HTTPException, Response, status
from pwdlib import PasswordHash
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.auth.schema import LoginRequest
from app.core.config import get_settings
from app.core.jwt import create_token_pair, decode_token
from app.core.schema import TokenPair, UserPublic
from app.db.session import get_session
from app.db.models.user import User

settings = get_settings()
password_hash = PasswordHash.recommended()


def user_public_from_record(user: User) -> UserPublic:
    return UserPublic(
        id=user.id,
        username=user.username,
        full_name=user.full_name,
        role=user.role,
        workstation_ids=[link.workstation_id for link in user.workstation_links],
    )


def set_auth_cookies(
    response: Response,
    access_token: str,
    refresh_token: str,
) -> None:
    response.set_cookie(
        key=settings.ACCESS_COOKIE_NAME,
        value=access_token,
        max_age=settings.ACCESS_TOKEN_TTL_MINUTES * 60,
        httponly=True,
        secure=settings.AUTH_COOKIE_SECURE,
        samesite=settings.AUTH_COOKIE_SAMESITE,
        path="/",
    )
    response.set_cookie(
        key=settings.REFRESH_COOKIE_NAME,
        value=refresh_token,
        max_age=settings.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60,
        httponly=True,
        secure=settings.AUTH_COOKIE_SECURE,
        samesite=settings.AUTH_COOKIE_SAMESITE,
        path="/api/v1/refresh",
    )


def clear_auth_cookies(
    response: Response,
) -> None:
    response.delete_cookie(
        key=settings.ACCESS_COOKIE_NAME,
        path="/",
    )
    response.delete_cookie(
        key=settings.REFRESH_COOKIE_NAME,
        path="/api/v1/refresh",
    )


async def start_session(
    payload: LoginRequest,
    session: AsyncSession = Depends(get_session),
) -> TokenPair:

    result = await session.execute(
        select(User)
        .options(selectinload(User.workstation_links))
        .where(User.username == payload.login)
    )
    user_record = result.scalar_one_or_none()

    if (
        user_record is None or
        not password_hash.verify(payload.password, user_record.hashed_password)
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )

    return create_token_pair(user_public_from_record(user_record))


async def refresh_session(
    refresh_token: Annotated[
        str,
        Cookie(alias=settings.REFRESH_COOKIE_NAME),
    ],
    session: AsyncSession = Depends(get_session),
) -> TokenPair:
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token is missing",
        )

    payload = decode_token(refresh_token)

    result = await session.execute(
        select(User)
        .options(selectinload(User.workstation_links))
        .where(User.id == payload.sub)
    )
    user_record = result.scalar_one_or_none()

    if user_record is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    return create_token_pair(user_public_from_record(user_record))
