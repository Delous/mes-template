from __future__ import annotations

from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

from app.tasks.schema import TaskResponse


class CreateOrderLineRequest(BaseModel):
    item_id: int = Field(gt=0)
    quantity: Decimal = Field(gt=0, max_digits=18, decimal_places=6)


class CreateOrderRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    number: str = Field(min_length=1, max_length=128)
    lines: list[CreateOrderLineRequest] = Field(min_length=1)


class OrderLineResponse(BaseModel):
    id: int
    item_id: int
    quantity: Decimal

    model_config = ConfigDict(from_attributes=True)


class OrderResponse(BaseModel):
    id: int
    number: str
    status: str
    created_at: datetime
    updated_at: datetime
    lines: list[OrderLineResponse]

    model_config = ConfigDict(from_attributes=True)


class OrderDetailResponse(OrderResponse):
    tasks: list[TaskResponse]


class OrderListResponse(BaseModel):
    items: list[OrderResponse]
    total: int
    page: int
    size: int
