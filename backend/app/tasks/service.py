from __future__ import annotations

from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.schema import UserPublic
from app.db.models.task import Task, TaskDependency
from app.db.models.task_history import TaskHistory
from app.tasks.access import (
    can_view_task,
    task_status_order_expression,
    validate_task_update_payload,
    validate_update_task_status,
    visible_task_filter,
)
from app.tasks.schema import UpdateTaskRequest


def task_options():
    return [
        selectinload(Task.item),
        selectinload(Task.work_center),
        selectinload(Task.source_work_center),
        selectinload(Task.target_work_center),
    ]


async def activate_ready_tasks(session: AsyncSession) -> None:
    result = await session.execute(
        select(Task)
        .options(selectinload(Task.dependencies).selectinload(TaskDependency.depends_on_task))
        .where(Task.status == "waiting")
    )
    waiting_tasks = result.scalars().all()

    for task in waiting_tasks:
        if all(link.depends_on_task.status == "done" for link in task.dependencies):
            task.status = "to_do"


async def reset_dependent_tasks(session: AsyncSession, task: Task) -> None:
    result = await session.execute(
        select(TaskDependency)
        .options(selectinload(TaskDependency.task))
        .where(TaskDependency.depends_on_task_id == task.id)
    )
    links = result.scalars().all()

    for link in links:
        dependent = link.task
        if dependent.status not in {"done", "cancelled"}:
            dependent.status = "waiting"
            dependent.executor_id = None
            await reset_dependent_tasks(session, dependent)


async def get_task_record(session: AsyncSession, task_id: int) -> Task | None:
    result = await session.execute(
        select(Task)
        .options(*task_options())
        .where(Task.id == task_id)
    )
    return result.scalar_one_or_none()


async def get_operation_task_for_quality_review(
    session: AsyncSession,
    quality_task: Task,
) -> Task:
    result = await session.execute(
        select(Task).where(
            Task.order_line_id == quality_task.order_line_id,
            Task.route_operation_id == quality_task.route_operation_id,
            Task.task_type == "operation",
        )
    )
    operation_task = result.scalar_one_or_none()
    if operation_task is None:
        raise HTTPException(status_code=409, detail="Related operation task not found")
    return operation_task


async def reject_quality_review(
    session: AsyncSession,
    task: Task,
    payload: UpdateTaskRequest,
    user: UserPublic,
) -> Task:
    old_quality_status = task.status
    operation_task = await get_operation_task_for_quality_review(session, task)
    old_operation_status = operation_task.status

    task.status = "waiting"
    task.executor_id = None
    if payload.defect_quantity_delta is not None:
        task.defect_quantity += payload.defect_quantity_delta

    operation_task.status = "to_do"
    operation_task.executor_id = None
    await reset_dependent_tasks(session, task)

    session.add(
        TaskHistory(
            task_id=task.id,
            changed_by_id=user.id,
            old_status=old_quality_status,
            new_status="waiting",
            actual_quantity_delta=None,
            defect_quantity_delta=payload.defect_quantity_delta,
            comment=payload.comment,
        )
    )
    session.add(
        TaskHistory(
            task_id=operation_task.id,
            changed_by_id=user.id,
            old_status=old_operation_status,
            new_status="to_do",
            actual_quantity_delta=None,
            defect_quantity_delta=None,
            comment="Returned from quality review",
        )
    )
    await session.flush()
    return await get_task_record(session, task.id)


async def update_task(
    session: AsyncSession,
    task_id: int,
    payload: UpdateTaskRequest,
    user: UserPublic,
):
    task = await get_task_record(session, task_id)
    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")

    if not can_view_task(user, task):
        raise HTTPException(status_code=403, detail="Task access denied")

    validate_task_update_payload(user, task, payload)
    validate_update_task_status(user, task, payload.status)

    if payload.status == "rejected":
        return await reject_quality_review(session, task, payload, user)

    old_status = task.status
    task.status = payload.status

    if payload.status == "in_progress":
        task.executor_id = user.id

    if payload.status in {"done", "cancelled"}:
        task.executor_id = user.id if task.executor_id is None else task.executor_id

    if payload.actual_quantity_delta is not None:
        task.actual_quantity += payload.actual_quantity_delta

    if payload.defect_quantity_delta is not None:
        task.defect_quantity += payload.defect_quantity_delta

    session.add(
        TaskHistory(
            task_id=task.id,
            changed_by_id=user.id,
            old_status=old_status,
            new_status=task.status,
            actual_quantity_delta=payload.actual_quantity_delta,
            defect_quantity_delta=payload.defect_quantity_delta,
            comment=payload.comment,
        )
    )

    if task.status == "done":
        await activate_ready_tasks(session)

    await session.flush()
    return await get_task_record(session, task.id)


async def get_task_by_id(
    session: AsyncSession,
    task_id: int,
    user: UserPublic,
):
    task = await get_task_record(session, task_id)
    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")

    if not can_view_task(user, task):
        raise HTTPException(status_code=403, detail="Task access denied")

    return task


async def task_list(
    session: AsyncSession,
    user: UserPublic,
    page: int,
    size: int,
):
    total_result = await session.execute(
        select(func.count())
        .select_from(Task)
        .where(visible_task_filter(user))
    )
    total = total_result.scalar_one()

    result = await session.execute(
        select(Task)
        .options(*task_options())
        .where(visible_task_filter(user))
        .order_by(
            task_status_order_expression(),
            Task.created_at.asc(),
            Task.id.asc(),
        )
        .offset((page - 1) * size)
        .limit(size)
    )

    return {
        "items": list(result.scalars().all()),
        "total": total,
        "page": page,
        "size": size,
    }
