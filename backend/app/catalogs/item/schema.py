from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.catalogs.common.schema import ListResponse, UnitSummary


class ItemBase(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    name: str = Field(min_length=1, max_length=256)
    unit_id: int = Field(gt=0)
    description: str | None = None


class ItemCreate(ItemBase):
    pass


class ItemUpdate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    name: str | None = Field(default=None, min_length=1, max_length=256)
    unit_id: int | None = Field(default=None, gt=0)
    description: str | None = None


class ItemResponse(ItemBase):
    id: int
    unit: UnitSummary
    created_at: datetime
    updated_at: datetime
    deleted_at: datetime | None

    model_config = ConfigDict(from_attributes=True)


class ItemListResponse(ListResponse):
    items: list[ItemResponse]
