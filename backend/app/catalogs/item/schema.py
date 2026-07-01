from __future__ import annotations

from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

from app.catalogs.common.schema import (
    ItemSummary,
    ListResponse,
    OperationTypeSummary,
    UnitSummary,
    WorkstationSummary,
)


class ResourceSpecificationInputBase(BaseModel):
    item_id: int = Field(gt=0)
    quantity: Decimal = Field(gt=0, max_digits=18, decimal_places=6)


class ResourceSpecificationInputCreate(ResourceSpecificationInputBase):
    pass


class ResourceSpecificationInputResponse(ResourceSpecificationInputBase):
    id: int
    item: ItemSummary

    model_config = ConfigDict(from_attributes=True)


class ResourceSpecificationBase(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    name: str = Field(min_length=1, max_length=256)
    operation_type_id: int = Field(gt=0)
    workstation_id: int = Field(gt=0)
    output_quantity: int = Field(default=1, ge=1)


class ResourceSpecificationCreate(ResourceSpecificationBase):
    inputs: list[ResourceSpecificationInputCreate] = Field(default_factory=list)


class ResourceSpecificationUpdate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    name: str | None = Field(default=None, min_length=1, max_length=256)
    operation_type_id: int | None = Field(default=None, gt=0)
    workstation_id: int | None = Field(default=None, gt=0)
    output_quantity: int | None = Field(default=None, ge=1)
    inputs: list[ResourceSpecificationInputCreate] | None = None


class ResourceSpecificationResponse(ResourceSpecificationBase):
    id: int
    item_id: int
    operation_type: OperationTypeSummary
    workstation: WorkstationSummary
    inputs: list[ResourceSpecificationInputResponse]

    model_config = ConfigDict(from_attributes=True)


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
    resource_specification: ResourceSpecificationResponse | None

    model_config = ConfigDict(from_attributes=True)


class ItemListResponse(ListResponse):
    items: list[ItemResponse]
