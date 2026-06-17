from __future__ import annotations

from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

from app.catalogs.common.schema import ItemSummary, ListResponse, WorkCenterSummary


class OperationInputBase(BaseModel):
    item_id: int = Field(gt=0)
    quantity: Decimal = Field(gt=0, max_digits=18, decimal_places=6)


class OperationInputCreate(OperationInputBase):
    pass


class OperationInputResponse(OperationInputBase):
    id: int
    item: ItemSummary

    model_config = ConfigDict(from_attributes=True)


class OperationOutputBase(BaseModel):
    item_id: int = Field(gt=0)
    quantity: Decimal = Field(gt=0, max_digits=18, decimal_places=6)


class OperationOutputCreate(OperationOutputBase):
    pass


class OperationOutputResponse(OperationOutputBase):
    id: int
    item: ItemSummary

    model_config = ConfigDict(from_attributes=True)


class RouteOperationBase(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    operation_number: int = Field(gt=0)
    name: str = Field(min_length=1, max_length=256)
    work_center_id: int = Field(gt=0)
    setup_time_minutes: int = Field(default=0, ge=0)
    run_time_minutes: int = Field(default=0, ge=0)
    requires_quality_review: bool = True


class RouteOperationCreate(RouteOperationBase):
    inputs: list[OperationInputCreate] = Field(default_factory=list)
    outputs: list[OperationOutputCreate] = Field(default_factory=list)


class RouteOperationResponse(RouteOperationBase):
    id: int
    work_center: WorkCenterSummary
    inputs: list[OperationInputResponse]
    outputs: list[OperationOutputResponse]

    model_config = ConfigDict(from_attributes=True)


class RouteBase(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    item_id: int = Field(gt=0)
    name: str = Field(min_length=1, max_length=256)
    version: str = Field(min_length=1, max_length=64)
    status: str = Field(min_length=1, max_length=64)
    is_default: bool = False


class RouteCreate(RouteBase):
    operations: list[RouteOperationCreate] = Field(default_factory=list)


class RouteUpdate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    item_id: int | None = Field(default=None, gt=0)
    name: str | None = Field(default=None, min_length=1, max_length=256)
    version: str | None = Field(default=None, min_length=1, max_length=64)
    status: str | None = Field(default=None, min_length=1, max_length=64)
    is_default: bool | None = None
    operations: list[RouteOperationCreate] | None = None


class RouteResponse(RouteBase):
    id: int
    item: ItemSummary
    created_at: datetime
    updated_at: datetime
    deleted_at: datetime | None
    operations: list[RouteOperationResponse]

    model_config = ConfigDict(from_attributes=True)


class RouteListResponse(ListResponse):
    items: list[RouteResponse]
