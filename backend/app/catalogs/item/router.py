from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, Path, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.catalogs.item import service
from app.catalogs.item.schema import (
    ItemCreate,
    ItemListResponse,
    ItemResponse,
    ItemUpdate,
)
from app.core.dependencies import get_current_user
from app.core.schema import UserPublic
from app.db.session import get_session


router = APIRouter(prefix="/items")


@router.get("", response_model=ItemListResponse)
async def get_items(
    page: Annotated[int, Query(ge=1)] = 1,
    size: Annotated[int, Query(ge=1, le=100)] = 20,
    include_deleted: bool = False,
    is_product: bool | None = None,
    grouped: bool = True,
    session: AsyncSession = Depends(get_session),
    user: UserPublic = Depends(get_current_user),
):
    return await service.list_items(session, page, size, include_deleted, is_product, grouped)


@router.get("/{id}", response_model=ItemResponse)
async def get_item(
    id: Annotated[int, Path(gt=0)],
    session: AsyncSession = Depends(get_session),
    user: UserPublic = Depends(get_current_user),
):
    return await service.get_item_by_id(session, id)


@router.post("", response_model=ItemResponse, status_code=status.HTTP_201_CREATED)
async def create_item(
    payload: ItemCreate,
    session: AsyncSession = Depends(get_session),
    user: UserPublic = Depends(get_current_user),
):
    return await service.create_item(session, payload)


@router.patch("/{id}", response_model=ItemResponse)
async def update_item(
    id: Annotated[int, Path(gt=0)],
    payload: ItemUpdate,
    session: AsyncSession = Depends(get_session),
    user: UserPublic = Depends(get_current_user),
):
    return await service.update_item(session, id, payload)


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_item(
    id: Annotated[int, Path(gt=0)],
    session: AsyncSession = Depends(get_session),
    user: UserPublic = Depends(get_current_user),
):
    await service.delete_item(session, id)


@router.post("/{id}/copy", response_model=ItemResponse, status_code=status.HTTP_201_CREATED)
async def copy_item(id: Annotated[int, Path(gt=0)], session: AsyncSession = Depends(get_session), user: UserPublic = Depends(get_current_user)):
    return await service.duplicate_item(session, id, variant=False)


@router.post("/{id}/variants", response_model=ItemResponse, status_code=status.HTTP_201_CREATED)
async def create_variant(id: Annotated[int, Path(gt=0)], session: AsyncSession = Depends(get_session), user: UserPublic = Depends(get_current_user)):
    return await service.duplicate_item(session, id, variant=True)


@router.post("/{id}/make-main", response_model=ItemResponse)
async def make_main(id: Annotated[int, Path(gt=0)], session: AsyncSession = Depends(get_session), user: UserPublic = Depends(get_current_user)):
    return await service.make_main(session, id)
