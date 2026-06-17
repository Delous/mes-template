from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, Path, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.catalogs.route import service
from app.catalogs.route.schema import (
    RouteCreate,
    RouteListResponse,
    RouteResponse,
    RouteUpdate,
)
from app.core.dependencies import get_current_user
from app.core.schema import UserPublic
from app.db.session import get_session


router = APIRouter(prefix="/routes")


@router.get("", response_model=RouteListResponse)
async def get_routes(
    page: Annotated[int, Query(ge=1)] = 1,
    size: Annotated[int, Query(ge=1, le=100)] = 20,
    include_deleted: bool = False,
    session: AsyncSession = Depends(get_session),
    user: UserPublic = Depends(get_current_user),
):
    return await service.list_routes(session, page, size, include_deleted)


@router.get("/{id}", response_model=RouteResponse)
async def get_route(
    id: Annotated[int, Path(gt=0)],
    session: AsyncSession = Depends(get_session),
    user: UserPublic = Depends(get_current_user),
):
    return await service.get_route_by_id(session, id)


@router.post("", response_model=RouteResponse, status_code=status.HTTP_201_CREATED)
async def create_route(
    payload: RouteCreate,
    session: AsyncSession = Depends(get_session),
    user: UserPublic = Depends(get_current_user),
):
    return await service.create_route(session, payload)


@router.patch("/{id}", response_model=RouteResponse)
async def update_route(
    id: Annotated[int, Path(gt=0)],
    payload: RouteUpdate,
    session: AsyncSession = Depends(get_session),
    user: UserPublic = Depends(get_current_user),
):
    return await service.update_route(session, id, payload)


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_route(
    id: Annotated[int, Path(gt=0)],
    session: AsyncSession = Depends(get_session),
    user: UserPublic = Depends(get_current_user),
):
    await service.delete_route(session, id)
