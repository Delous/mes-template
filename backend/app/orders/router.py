from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, Path, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user
from app.core.schema import UserPublic
from app.db.session import get_session
from app.orders import service
from app.orders.schema import CreateOrderRequest, OrderDetailResponse, OrderListResponse


router = APIRouter(prefix="/api/v1/orders", tags=["orders"])


@router.post("", response_model=OrderDetailResponse, status_code=status.HTTP_201_CREATED)
async def create_order(
    payload: CreateOrderRequest,
    session: AsyncSession = Depends(get_session),
    user: UserPublic = Depends(get_current_user),
):
    return await service.create_order(session, payload)


@router.get("", response_model=OrderListResponse)
async def get_orders(
    page: Annotated[int, Query(ge=1)] = 1,
    size: Annotated[int, Query(ge=1, le=100)] = 20,
    session: AsyncSession = Depends(get_session),
    user: UserPublic = Depends(get_current_user),
):
    return await service.list_orders(session, page, size)


@router.get("/{id}", response_model=OrderDetailResponse)
async def get_order(
    id: Annotated[int, Path(gt=0)],
    session: AsyncSession = Depends(get_session),
    user: UserPublic = Depends(get_current_user),
):
    return await service.get_order_by_id(session, id)


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_order(
    id: Annotated[int, Path(gt=0)],
    session: AsyncSession = Depends(get_session),
    user: UserPublic = Depends(get_current_user),
):
    await service.delete_order(session, id, user)
