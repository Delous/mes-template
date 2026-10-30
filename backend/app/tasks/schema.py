from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator


TaskType = Literal["operation", "quality_review"]
TaskStatus = Literal["waiting", "to_do", "in_progress", "blocked", "done", "cancelled"]
TaskUpdateStatus = Literal[
    "to_do",
    "in_progress",
    "blocked",
    "done",
    "cancelled",
    "rejected",
]


class UpdateTaskRequest(BaseModel):
    status: TaskUpdateStatus
    actual_quantity_delta: Decimal | None = Field(
        default=None,
        gt=0,
        max_digits=18,
        decimal_places=2,
    )
    defect_quantity_delta: Decimal | None = Field(
        default=None,
        gt=0,
        max_digits=18,
        decimal_places=2,
    )
    comment: str | None = None


class TaskItemResponse(BaseModel):
    id: int
    name: str
    unit_id: int

    model_config = ConfigDict(from_attributes=True)


class TaskDependencyResponse(BaseModel):
    id: int
    name: str
    description: str | None
    status: TaskStatus
    item: TaskItemResponse

    model_config = ConfigDict(from_attributes=True)

    @model_validator(mode="before")
    @classmethod
    def from_dependency_link(cls, value: Any) -> Any:
        # ORM dependencies are links; the API exposes the prerequisite task.
        return getattr(value, "depends_on_task", value)


class TaskRouteMaterialResponse(BaseModel):
    input_item_id: int | None = None
    source_route_key: str | None = None
    name: str
    quantity: Decimal
    unit: str


class TaskRouteStepResponse(BaseModel):
    operation_type_id: int
    workstation_id: int
    operation: str
    workstation: str
    materials: list[TaskRouteMaterialResponse]


class TaskRouteResponse(BaseModel):
    key: str
    name: str
    planned_quantity: Decimal
    steps: list[TaskRouteStepResponse]


class TaskOrderResponse(BaseModel):
    id: int
    number: str
    priority: Literal['medium', 'high'] | None
    deadline: date | None

    model_config = ConfigDict(from_attributes=True)


class TaskResponse(BaseModel):
    id: int
    name: str
    routes: list[TaskRouteResponse]
    route_key: str | None
    step_number: int | None
    workstation_id: int | None
    task_type: TaskType
    status: TaskStatus
    description: str | None
    planned_quantity: Decimal
    actual_quantity: Decimal
    defect_quantity: Decimal
    order_id: int
    order: TaskOrderResponse
    order_line_id: int
    item_id: int
    item: TaskItemResponse
    dependencies: list[TaskDependencyResponse]
    executor_id: int | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TaskListResponse(BaseModel):
    items: list[TaskResponse]
    total: int
    page: int
    size: int
