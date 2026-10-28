from __future__ import annotations

from datetime import datetime
from uuid import UUID
from decimal import Decimal
from pydantic import BaseModel, ConfigDict, Field, model_validator
from app.catalogs.common.schema import ListResponse, UnitSummary

class RouteMaterial(BaseModel):
    input_item_id: int | None = Field(default=None, gt=0)
    source_route_key: str | None = None
    quantity: Decimal = Field(gt=0, max_digits=18, decimal_places=2)

    @model_validator(mode="after")
    def validate_source(self):
        if (self.input_item_id is None) == (self.source_route_key is None):
            raise ValueError("Материал должен ссылаться на номенклатуру или результат маршрута")
        return self

class RouteStep(BaseModel):
    operation_type_id: int = Field(gt=0)
    workstation_id: int = Field(gt=0)
    materials: list[RouteMaterial] = Field(default_factory=list)

class ItemRoute(BaseModel):
    key: str = Field(min_length=1, max_length=128)
    name: str = Field(min_length=1, max_length=256)
    output_quantity: Decimal = Field(gt=0, max_digits=18, decimal_places=2)
    steps: list[RouteStep] = Field(min_length=1)

    @model_validator(mode="after")
    def first_step_materials(self):
        if not self.steps[0].materials:
            raise ValueError("Первый шаг маршрута должен содержать материалы")
        return self


def validate_routes(routes):
    graph = {route.key: {m.source_route_key for step in route.steps for m in step.materials if m.source_route_key is not None} for route in routes}
    if len(graph) != len(routes):
        raise ValueError("Ключи маршрутов должны быть уникальны")
    visiting, visited = set(), set()
    def visit(key):
        if key not in graph:
            raise ValueError("Указан несуществующий маршрут")
        if key in visiting:
            raise ValueError("Циклическая зависимость маршрутов")
        if key in visited:
            return
        visiting.add(key)
        for dependency in graph[key]:
            visit(dependency)
        visiting.remove(key)
        visited.add(key)
    for key in graph:
        visit(key)
    return routes

class RoutesMixin(BaseModel):
    @model_validator(mode="after")
    def check_routes(self):
        if self.routes is not None:
            validate_routes(self.routes)
        return self

class ItemBase(RoutesMixin):
    routes: list[ItemRoute] = Field(default_factory=list)
    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")
    name: str = Field(min_length=1, max_length=256)
    unit_id: int = Field(gt=0)
    description: str | None = None
    labor_minutes: int | None = Field(default=None, ge=0, le=2147483647, strict=True)
    is_product: bool = False
class ItemCreate(ItemBase): pass
class ItemUpdate(RoutesMixin):
    routes: list[ItemRoute] | None = None
    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")
    name: str | None = Field(default=None, min_length=1, max_length=256)
    unit_id: int | None = Field(default=None, gt=0)
    description: str | None = None
    labor_minutes: int | None = Field(default=None, ge=0, le=2147483647, strict=True)
    is_product: bool | None = None
class ItemResponse(ItemBase):
    group_uuid: UUID
    is_main: bool
    variants: list[ItemResponse] = Field(default_factory=list)
    id: int
    unit: UnitSummary
    created_at: datetime
    updated_at: datetime
    deleted_at: datetime | None
    model_config = ConfigDict(from_attributes=True)
class ItemListResponse(ListResponse): items: list[ItemResponse]
