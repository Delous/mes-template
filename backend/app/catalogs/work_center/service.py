from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from app.catalogs.common.repository import list_entities
from app.catalogs.common.service import (
    apply_fields,
    ensure_update_payload,
    flush_or_conflict,
    get_active_or_404,
    soft_delete_entity,
)
from app.catalogs.work_center.schema import WorkCenterCreate, WorkCenterUpdate
from app.db.models.work_center import WorkCenter


async def list_work_centers(
    session: AsyncSession,
    page: int,
    size: int,
    include_deleted: bool,
) -> dict:
    return await list_entities(session, WorkCenter, page, size, include_deleted)


async def get_work_center_by_id(
    session: AsyncSession,
    work_center_id: int,
) -> WorkCenter:
    return await get_active_or_404(
        session,
        WorkCenter,
        work_center_id,
        "Work center",
    )


async def create_work_center(
    session: AsyncSession,
    payload: WorkCenterCreate,
) -> WorkCenter:
    work_center = WorkCenter(**payload.model_dump())
    session.add(work_center)
    await flush_or_conflict(session)
    return work_center


async def update_work_center(
    session: AsyncSession,
    work_center_id: int,
    payload: WorkCenterUpdate,
) -> WorkCenter:
    data = payload.model_dump(exclude_unset=True)
    ensure_update_payload(data)
    work_center = await get_work_center_by_id(session, work_center_id)
    apply_fields(work_center, data)
    await flush_or_conflict(session)
    return work_center


async def delete_work_center(session: AsyncSession, work_center_id: int) -> None:
    await soft_delete_entity(session, WorkCenter, work_center_id, "Work center")
