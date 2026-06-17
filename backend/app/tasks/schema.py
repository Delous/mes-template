from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


TaskType = Literal["warehouse_delivery", "operation", "quality_review", "transfer"]
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
        decimal_places=6,
    )
    defect_quantity_delta: Decimal | None = Field(
        default=None,
        gt=0,
        max_digits=18,
        decimal_places=6,
    )
    comment: str | None = None


class TaskWorkCenterResponse(BaseModel):
    id: int
    name: str
    type: str

    model_config = ConfigDict(from_attributes=True)


class TaskItemResponse(BaseModel):
    id: int
    name: str
    unit_id: int

    model_config = ConfigDict(from_attributes=True)


class TaskResponse(BaseModel):
    id: int
    task_type: TaskType
    status: TaskStatus
    description: str | None
    planned_quantity: Decimal
    actual_quantity: Decimal
    defect_quantity: Decimal
    order_id: int
    order_line_id: int
    item_id: int
    route_operation_id: int | None
    work_center_id: int | None
    source_work_center_id: int | None
    target_work_center_id: int | None
    item: TaskItemResponse
    work_center: TaskWorkCenterResponse | None
    source_work_center: TaskWorkCenterResponse | None
    target_work_center: TaskWorkCenterResponse | None
    executor_id: int | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TaskListResponse(BaseModel):
    items: list[TaskResponse]
    total: int
    page: int
    size: int
