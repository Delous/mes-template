from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.catalogs.common.schema import ListResponse


class UnitBase(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    name: str = Field(min_length=1, max_length=256)
    symbol: str = Field(min_length=1, max_length=32)


class UnitCreate(UnitBase):
    pass


class UnitUpdate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    name: str | None = Field(default=None, min_length=1, max_length=256)
    symbol: str | None = Field(default=None, min_length=1, max_length=32)


class UnitResponse(UnitBase):
    id: int
    created_at: datetime
    updated_at: datetime
    deleted_at: datetime | None

    model_config = ConfigDict(from_attributes=True)


class UnitListResponse(ListResponse):
    items: list[UnitResponse]
