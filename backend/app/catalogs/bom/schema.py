from __future__ import annotations

from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

from app.catalogs.common.schema import ItemSummary, ListResponse


class BomLineBase(BaseModel):
    component_item_id: int = Field(gt=0)
    quantity: Decimal = Field(gt=0, max_digits=18, decimal_places=6)
    scrap_percent: Decimal = Field(
        default=Decimal("0"),
        ge=0,
        le=100,
        max_digits=5,
        decimal_places=2,
    )


class BomLineCreate(BomLineBase):
    pass


class BomLineResponse(BomLineBase):
    id: int
    component_item: ItemSummary

    model_config = ConfigDict(from_attributes=True)


class BomBase(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    item_id: int = Field(gt=0)
    name: str = Field(min_length=1, max_length=256)
    version: str = Field(min_length=1, max_length=64)
    status: str = Field(min_length=1, max_length=64)
    is_default: bool = False


class BomCreate(BomBase):
    lines: list[BomLineCreate] = Field(default_factory=list)


class BomUpdate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    item_id: int | None = Field(default=None, gt=0)
    name: str | None = Field(default=None, min_length=1, max_length=256)
    version: str | None = Field(default=None, min_length=1, max_length=64)
    status: str | None = Field(default=None, min_length=1, max_length=64)
    is_default: bool | None = None
    lines: list[BomLineCreate] | None = None


class BomResponse(BomBase):
    id: int
    item: ItemSummary
    created_at: datetime
    updated_at: datetime
    deleted_at: datetime | None
    lines: list[BomLineResponse]

    model_config = ConfigDict(from_attributes=True)


class BomListResponse(ListResponse):
    items: list[BomResponse]
