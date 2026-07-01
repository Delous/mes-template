from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, Path, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.catalogs.workstation import service
from app.catalogs.workstation.schema import (
    WorkstationCreate,
    WorkstationListResponse,
    WorkstationResponse,
    WorkstationUpdate,
)
from app.core.dependencies import get_current_user
from app.core.schema import UserPublic
from app.db.session import get_session


router = APIRouter(prefix="/workstations")


@router.get("", response_model=WorkstationListResponse)
async def get_workstations(
    page: Annotated[int, Query(ge=1)] = 1,
    size: Annotated[int, Query(ge=1, le=100)] = 20,
    session: AsyncSession = Depends(get_session),
    user: UserPublic = Depends(get_current_user),
):
    return await service.list_workstations(session, page, size)


@router.post("", response_model=WorkstationResponse, status_code=status.HTTP_201_CREATED)
async def create_workstation(
    payload: WorkstationCreate,
    session: AsyncSession = Depends(get_session),
    user: UserPublic = Depends(get_current_user),
):
    return await service.create_workstation(session, payload)


@router.patch("/{id}", response_model=WorkstationResponse)
async def update_workstation(
    id: Annotated[int, Path(gt=0)],
    payload: WorkstationUpdate,
    session: AsyncSession = Depends(get_session),
    user: UserPublic = Depends(get_current_user),
):
    return await service.update_workstation(session, id, payload)
