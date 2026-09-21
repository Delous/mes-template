from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, ConfigDict, Field
from app.catalogs.common.schema import ItemSummary, ListResponse, OperationTypeSummary, UnitSummary, WorkstationSummary

class ItemInputBase(BaseModel):
    input_item_id: int = Field(gt=0)
    quantity: Decimal = Field(gt=0, max_digits=18, decimal_places=2)
class ItemInputCreate(ItemInputBase): pass
class ItemInputResponse(ItemInputBase):
    id: int
    input_item: ItemSummary
    model_config = ConfigDict(from_attributes=True)

class ItemBase(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    name: str = Field(min_length=1, max_length=256)
    unit_id: int = Field(gt=0)
    description: str | None = None
    is_product: bool = False
    operation_type_id: int | None = Field(default=None, gt=0)
    workstation_id: int | None = Field(default=None, gt=0)
    output_quantity: int | None = Field(default=None, ge=1)
    inputs: list[ItemInputCreate] = Field(default_factory=list)
class ItemCreate(ItemBase): pass
class ItemUpdate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    name: str | None = Field(default=None, min_length=1, max_length=256)
    unit_id: int | None = Field(default=None, gt=0)
    description: str | None = None
    is_product: bool | None = None
    operation_type_id: int | None = Field(default=None, gt=0)
    workstation_id: int | None = Field(default=None, gt=0)
    output_quantity: int | None = Field(default=None, ge=1)
    inputs: list[ItemInputCreate] | None = None
class ItemResponse(ItemBase):
    id: int
    unit: UnitSummary
    operation_type: OperationTypeSummary | None
    workstation: WorkstationSummary | None
    inputs: list[ItemInputResponse]
    created_at: datetime
    updated_at: datetime
    deleted_at: datetime | None
    model_config = ConfigDict(from_attributes=True)
class ItemListResponse(ListResponse): items: list[ItemResponse]
