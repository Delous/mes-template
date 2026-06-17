from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, Path, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.catalogs.work_center import service
from app.catalogs.work_center.schema import (
    WorkCenterCreate,
    WorkCenterListResponse,
    WorkCenterResponse,
    WorkCenterUpdate,
)
from app.core.dependencies import get_current_user
from app.core.schema import UserPublic
from app.db.session import get_session


router = APIRouter(prefix="/work-centers")


@router.get("", response_model=WorkCenterListResponse)
async def get_work_centers(
    page: Annotated[int, Query(ge=1)] = 1,
    size: Annotated[int, Query(ge=1, le=100)] = 20,
    include_deleted: bool = False,
    session: AsyncSession = Depends(get_session),
    user: UserPublic = Depends(get_current_user),
):
    return await service.list_work_centers(session, page, size, include_deleted)


@router.get("/{id}", response_model=WorkCenterResponse)
async def get_work_center(
    id: Annotated[int, Path(gt=0)],
    session: AsyncSession = Depends(get_session),
    user: UserPublic = Depends(get_current_user),
):
    return await service.get_work_center_by_id(session, id)


@router.post("", response_model=WorkCenterResponse, status_code=status.HTTP_201_CREATED)
async def create_work_center(
    payload: WorkCenterCreate,
    session: AsyncSession = Depends(get_session),
    user: UserPublic = Depends(get_current_user),
):
    return await service.create_work_center(session, payload)


@router.patch("/{id}", response_model=WorkCenterResponse)
async def update_work_center(
    id: Annotated[int, Path(gt=0)],
    payload: WorkCenterUpdate,
    session: AsyncSession = Depends(get_session),
    user: UserPublic = Depends(get_current_user),
):
    return await service.update_work_center(session, id, payload)


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_work_center(
    id: Annotated[int, Path(gt=0)],
    session: AsyncSession = Depends(get_session),
    user: UserPublic = Depends(get_current_user),
):
    await service.delete_work_center(session, id)
