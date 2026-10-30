from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, Path, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_session
from app.core.dependencies import get_current_user
from app.tasks import service as tasks_service

from app.tasks.schema import (
    TaskStatus,
    TaskType,
    TaskListResponse,
    TaskResponse,
    UpdateTaskRequest,
)
from app.tasks.service import TaskSort
from app.core.schema import UserPublic

router = APIRouter(prefix="/api/v1", tags=['tasks'])


@router.get("/tasks", response_model=TaskListResponse)
async def get_tasks(
    page: Annotated[int, Query(ge=1)] = 1,
    size: Annotated[int, Query(ge=5, le=100)] = 20,
    search: Annotated[str, Query(max_length=256)] = "",
    status: TaskStatus | None = None,
    task_type: TaskType | None = None,
    sort: TaskSort = "planning",
    session: AsyncSession = Depends(get_session),
    user: UserPublic = Depends(get_current_user),
):
    return await tasks_service.task_list(session, user, page, size, search, status, task_type, sort)


@router.get("/tasks/{id}", response_model=TaskResponse)
async def get_task(
    id: Annotated[int, Path()],
    session: AsyncSession = Depends(get_session),
    user: UserPublic = Depends(get_current_user),
):
    return await tasks_service.get_task_by_id(session, id, user)


@router.patch("/tasks/{id}", response_model=TaskResponse)
async def update_task(
    id: Annotated[int, Path(gt=0)],
    payload: UpdateTaskRequest,
    session: AsyncSession = Depends(get_session),
    user: UserPublic = Depends(get_current_user),
):
    return await tasks_service.update_task(session, id, payload, user)
