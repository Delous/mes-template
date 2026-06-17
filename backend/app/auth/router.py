from typing import Annotated

from fastapi import APIRouter, Depends, Response, status

from app.core.dependencies import get_current_user
from app.core.schema import TokenPair, UserPublic
from app.auth.service import (
    clear_auth_cookies,
    refresh_session,
    set_auth_cookies,
    start_session,
)

router = APIRouter(
    prefix="/api/v1",
    tags=["auth"],
)


@router.post("/login", response_model=TokenPair)
async def login(
    response: Response,
    token_pair: Annotated[TokenPair, Depends(start_session)],
) -> TokenPair:
    """
    Проверяет логин/пароль, выпускает access/refresh токены,
    кладет их в HttpOnly cookies и дополнительно возвращает их в теле ответа.
    """
    set_auth_cookies(
        response=response,
        access_token=token_pair.access_token,
        refresh_token=token_pair.refresh_token,
    )

    return token_pair


@router.post("/refresh", response_model=TokenPair)
async def refresh(
    response: Response,
    token_pair: Annotated[TokenPair, Depends(refresh_session)],
) -> TokenPair:
    """
    Читает refresh token из HttpOnly cookie, проверяет его,
    перевыпускает новую пару токенов и заново пишет cookies.
    """

    set_auth_cookies(
        response=response,
        access_token=token_pair.access_token,
        refresh_token=token_pair.refresh_token,
    )

    return token_pair


@router.get("/me", response_model=UserPublic)
async def me(
    user: Annotated[UserPublic, Depends(get_current_user)],
) -> UserPublic:
    """
    Возвращает текущего пользователя по access token из cookie.
    """
    return user


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(
    response: Response,
):
    """
    Удаляет auth cookies.
    При желании позже сюда можно добавить инвалидацию refresh token в БД.
    """
    clear_auth_cookies(response=response)

    return {"message": "Logged out successfully"}
