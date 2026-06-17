from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, Path, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.catalogs.bom import service
from app.catalogs.bom.schema import BomCreate, BomListResponse, BomResponse, BomUpdate
from app.core.dependencies import get_current_user
from app.core.schema import UserPublic
from app.db.session import get_session


router = APIRouter(prefix="/boms")


@router.get("", response_model=BomListResponse)
async def get_boms(
    page: Annotated[int, Query(ge=1)] = 1,
    size: Annotated[int, Query(ge=1, le=100)] = 20,
    include_deleted: bool = False,
    session: AsyncSession = Depends(get_session),
    user: UserPublic = Depends(get_current_user),
):
    return await service.list_boms(session, page, size, include_deleted)


@router.get("/{id}", response_model=BomResponse)
async def get_bom(
    id: Annotated[int, Path(gt=0)],
    session: AsyncSession = Depends(get_session),
    user: UserPublic = Depends(get_current_user),
):
    return await service.get_bom_by_id(session, id)


@router.post("", response_model=BomResponse, status_code=status.HTTP_201_CREATED)
async def create_bom(
    payload: BomCreate,
    session: AsyncSession = Depends(get_session),
    user: UserPublic = Depends(get_current_user),
):
    return await service.create_bom(session, payload)


@router.patch("/{id}", response_model=BomResponse)
async def update_bom(
    id: Annotated[int, Path(gt=0)],
    payload: BomUpdate,
    session: AsyncSession = Depends(get_session),
    user: UserPublic = Depends(get_current_user),
):
    return await service.update_bom(session, id, payload)


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_bom(
    id: Annotated[int, Path(gt=0)],
    session: AsyncSession = Depends(get_session),
    user: UserPublic = Depends(get_current_user),
):
    await service.delete_bom(session, id)
