from __future__ import annotations

from pydantic import BaseModel, ConfigDict


class ListResponse(BaseModel):
    total: int
    page: int
    size: int


class UnitSummary(BaseModel):
    id: int
    name: str
    symbol: str

    model_config = ConfigDict(from_attributes=True)


class ItemSummary(BaseModel):
    id: int
    name: str
    unit_id: int
    description: str | None

    model_config = ConfigDict(from_attributes=True)


class WorkstationSummary(BaseModel):
    id: int
    name: str

    model_config = ConfigDict(from_attributes=True)
