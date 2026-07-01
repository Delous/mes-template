from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field

from app.catalogs.common.schema import ListResponse


class WorkstationBase(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    name: str = Field(min_length=1, max_length=256)


class WorkstationCreate(WorkstationBase):
    pass


class WorkstationUpdate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    name: str | None = Field(default=None, min_length=1, max_length=256)


class WorkstationResponse(WorkstationBase):
    id: int

    model_config = ConfigDict(from_attributes=True)


class WorkstationListResponse(ListResponse):
    items: list[WorkstationResponse]
