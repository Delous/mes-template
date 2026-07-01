from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field

from app.catalogs.common.schema import ListResponse


class OperationTypeBase(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    name: str = Field(min_length=1, max_length=256)


class OperationTypeCreate(OperationTypeBase):
    pass


class OperationTypeUpdate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    name: str | None = Field(default=None, min_length=1, max_length=256)


class OperationTypeResponse(OperationTypeBase):
    id: int

    model_config = ConfigDict(from_attributes=True)


class OperationTypeListResponse(ListResponse):
    items: list[OperationTypeResponse]
