from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.catalogs.common.schema import ListResponse


class WorkCenterBase(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    name: str = Field(min_length=1, max_length=256)
    type: str = Field(min_length=1, max_length=128)
    description: str | None = None


class WorkCenterCreate(WorkCenterBase):
    pass


class WorkCenterUpdate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    name: str | None = Field(default=None, min_length=1, max_length=256)
    type: str | None = Field(default=None, min_length=1, max_length=128)
    description: str | None = None


class WorkCenterResponse(WorkCenterBase):
    id: int
    created_at: datetime
    updated_at: datetime
    deleted_at: datetime | None

    model_config = ConfigDict(from_attributes=True)


class WorkCenterListResponse(ListResponse):
    items: list[WorkCenterResponse]
