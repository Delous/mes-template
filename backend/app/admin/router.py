from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, Path, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.admin import service as admin_service
from app.admin.schema import (
    CreateUserRequest,
    UpdateUserRequest,
    UserListResponse,
    UserResponse,
)
from app.core.dependencies import get_current_user
from app.core.schema import UserPublic
from app.db.session import get_session


router = APIRouter(prefix="/api/v1/admin", tags=["admin"])


@router.post("/users", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    payload: CreateUserRequest,
    session: AsyncSession = Depends(get_session),
    user: UserPublic = Depends(get_current_user),
):
    return await admin_service.create_user(session, user, payload)


@router.patch("/users/{id}", response_model=UserResponse)
async def update_user(
    id: Annotated[int, Path()],
    payload: UpdateUserRequest,
    session: AsyncSession = Depends(get_session),
    user: UserPublic = Depends(get_current_user),
):
    return await admin_service.update_user(session, user, id, payload)


@router.get("/users", response_model=UserListResponse)
async def get_users(
    page: Annotated[int, Query(ge=1)] = 1,
    size: Annotated[int, Query(ge=5, le=100)] = 20,
    session: AsyncSession = Depends(get_session),
    user: UserPublic = Depends(get_current_user),
):
    return await admin_service.user_list(session, user, page, size)

