from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.tasks.schema import TaskResponse


class CreateOrderLineRequest(BaseModel):
    item_id: int = Field(gt=0)
    quantity: Decimal = Field(gt=0, max_digits=18, decimal_places=2)


class CreateOrderRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    number: str = Field(min_length=1, max_length=128)
    priority: Literal['medium', 'high'] | None = 'medium'
    deadline: date | None = None
    lines: list[CreateOrderLineRequest] = Field(min_length=1)


class UpdateOrderRequest(BaseModel):
    model_config = ConfigDict(extra='forbid')

    priority: Literal['medium', 'high'] | None = None
    deadline: date | None = None

    @model_validator(mode='after')
    def validate_patch(self):
        if not self.model_fields_set:
            raise ValueError('Укажите приоритет или дедлайн')
        return self


class OrderLineResponse(BaseModel):
    id: int
    item_id: int
    quantity: Decimal

    model_config = ConfigDict(from_attributes=True)


class OrderResponse(BaseModel):
    id: int
    number: str
    status: str
    priority: Literal['medium', 'high'] | None
    deadline: date | None
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
