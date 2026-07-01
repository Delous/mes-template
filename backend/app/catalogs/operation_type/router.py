from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, Path, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.catalogs.operation_type import service
from app.catalogs.operation_type.schema import (
    OperationTypeCreate,
    OperationTypeListResponse,
    OperationTypeResponse,
    OperationTypeUpdate,
)
from app.core.dependencies import get_current_user
from app.core.schema import UserPublic
from app.db.session import get_session


router = APIRouter(prefix="/operation-types")


@router.get("", response_model=OperationTypeListResponse)
async def get_operation_types(
    page: Annotated[int, Query(ge=1)] = 1,
    size: Annotated[int, Query(ge=1, le=100)] = 20,
    include_deleted: bool = False,
    session: AsyncSession = Depends(get_session),
    user: UserPublic = Depends(get_current_user),
):
    return await service.list_operation_types(session, page, size, include_deleted)


@router.get("/{id}", response_model=OperationTypeResponse)
async def get_operation_type(
    id: Annotated[int, Path(gt=0)],
    session: AsyncSession = Depends(get_session),
    user: UserPublic = Depends(get_current_user),
):
    return await service.get_operation_type_by_id(session, id)


@router.post("", response_model=OperationTypeResponse, status_code=status.HTTP_201_CREATED)
async def create_operation_type(
    payload: OperationTypeCreate,
    session: AsyncSession = Depends(get_session),
    user: UserPublic = Depends(get_current_user),
):
    return await service.create_operation_type(session, payload)


@router.patch("/{id}", response_model=OperationTypeResponse)
async def update_operation_type(
    id: Annotated[int, Path(gt=0)],
    payload: OperationTypeUpdate,
    session: AsyncSession = Depends(get_session),
    user: UserPublic = Depends(get_current_user),
):
    return await service.update_operation_type(session, id, payload)
