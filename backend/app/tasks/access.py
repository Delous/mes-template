from fastapi import HTTPException

from sqlalchemy import and_, case, false, or_, true

from app.core.schema import UserPublic
from app.db.models.task import Task
from app.tasks.schema import UpdateTaskRequest
from app.tasks.status_model import OPERATOR_TASK_TYPES, TASK_STATUS_FLOW


VISIBLE_ACTIVE_STATUSES = {"to_do", "in_progress", "blocked"}


def visible_task_filter(user: UserPublic):
    if user.role == "admin":
        return true()

    if user.role == "operator":
        return and_(
            Task.task_type.in_(OPERATOR_TASK_TYPES),
            Task.workstation_id.in_(user.workstation_ids),
            or_(
                and_(
                    Task.status == "in_progress",
                    Task.executor_id == user.id,
                ),
                and_(
                    Task.status.in_(["to_do", "blocked"]),
                    Task.executor_id.is_(None),
                ),
            ),
        )

    if user.role == "reviewer":
        return and_(
            Task.task_type == "quality_review",
            Task.status.in_(VISIBLE_ACTIVE_STATUSES),
        )

    return false()


def can_view_task(user: UserPublic, task: Task) -> bool:
    if user.role == "admin":
        return True

    if task.status not in VISIBLE_ACTIVE_STATUSES:
        return False

    if user.role == "operator":
        if task.task_type not in OPERATOR_TASK_TYPES:
            return False
        if task.workstation_id not in user.workstation_ids:
            return False
        if task.status == "in_progress":
            return task.executor_id == user.id
        return task.executor_id is None

    if user.role == "reviewer":
        return task.task_type == "quality_review"

    return False


def validate_update_task_status(
    user: UserPublic,
    task: Task,
    new_status: str,
) -> None:
    if new_status == "rejected":
        if user.role != "reviewer" or task.task_type != "quality_review":
            raise HTTPException(status_code=403, detail="Task rejection is forbidden")
        if task.status not in {"to_do", "in_progress"}:
            raise HTTPException(status_code=403, detail="Task rejection is forbidden")
        return

    transition_rules = TASK_STATUS_FLOW.get(task.status, {}).get(new_status)
    if transition_rules is None:
        raise HTTPException(
            status_code=403,
            detail=f"Transition from {task.status} to {new_status} is forbidden",
        )

    if user.role not in transition_rules.get("roles", set()):
        raise HTTPException(
            status_code=403,
            detail=f"Transition from {task.status} to {new_status} is forbidden",
        )

    if user.role == "operator":
        if (
            task.task_type not in OPERATOR_TASK_TYPES
            or task.workstation_id not in user.workstation_ids
        ):
            raise HTTPException(status_code=403, detail="Task update is forbidden")

    if user.role == "reviewer" and task.task_type != "quality_review":
        raise HTTPException(status_code=403, detail="Task update is forbidden")


def validate_task_update_payload(
    user: UserPublic,
    task: Task,
    payload: UpdateTaskRequest,
) -> None:
    if payload.actual_quantity_delta is not None and task.task_type != "operation":
        raise HTTPException(
            status_code=422,
            detail="Actual quantity can be changed only for operation tasks",
        )

    if payload.status == "rejected" and payload.defect_quantity_delta is None:
        raise HTTPException(
            status_code=422,
            detail="Defect quantity is required when rejecting quality review",
        )

    if user.role != "operator" and payload.actual_quantity_delta is not None:
        raise HTTPException(
            status_code=403,
            detail="Only operators can set actual quantity",
        )

    if user.role != "reviewer" and payload.defect_quantity_delta is not None:
        raise HTTPException(
            status_code=403,
            detail="Only reviewers can set defect quantity",
        )

    if payload.defect_quantity_delta is not None and task.task_type != "quality_review":
        raise HTTPException(
            status_code=422,
            detail="Defect quantity can be changed only for quality review tasks",
        )

    if user.role != "reviewer" and payload.comment is not None:
        raise HTTPException(
            status_code=403,
            detail="Only reviewers can set review comment",
        )

    if (
        user.role == "operator"
        and task.task_type == "operation"
        and payload.status == "done"
        and payload.actual_quantity_delta is None
    ):
        raise HTTPException(
            status_code=422,
            detail="Actual quantity is required when completing an operation task",
        )


def task_status_order_expression():
    return case(
        (Task.status == "in_progress", 1),
        (Task.status == "to_do", 2),
        (Task.status == "blocked", 3),
        (Task.status == "waiting", 4),
        (Task.status == "done", 5),
        (Task.status == "cancelled", 6),
        else_=100,
    )
