from __future__ import annotations

from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.catalogs.common.service import (
    apply_fields,
    ensure_update_payload,
    flush_or_conflict,
)
from app.catalogs.workstation.schema import WorkstationCreate, WorkstationUpdate
from app.db.models.workstation import Workstation


async def list_workstations(
    session: AsyncSession,
    page: int,
    size: int,
) -> dict:
    total_result = await session.execute(select(func.count()).select_from(Workstation))
    result = await session.execute(
        select(Workstation)
        .order_by(Workstation.id.asc())
        .offset((page - 1) * size)
        .limit(size)
    )
    return {
        "items": list(result.scalars().all()),
        "total": total_result.scalar_one(),
        "page": page,
        "size": size,
    }


async def get_workstation_by_id(
    session: AsyncSession,
    workstation_id: int,
) -> Workstation:
    result = await session.execute(
        select(Workstation).where(Workstation.id == workstation_id)
    )
    workstation = result.scalar_one_or_none()
    if workstation is None:
        raise HTTPException(status_code=404, detail="Workstation not found")
    return workstation


async def create_workstation(
    session: AsyncSession,
    payload: WorkstationCreate,
) -> Workstation:
    workstation = Workstation(**payload.model_dump())
    session.add(workstation)
    await flush_or_conflict(session)
    return workstation


async def update_workstation(
    session: AsyncSession,
    workstation_id: int,
    payload: WorkstationUpdate,
) -> Workstation:
    data = payload.model_dump(exclude_unset=True)
    ensure_update_payload(data)
    workstation = await get_workstation_by_id(session, workstation_id)
    apply_fields(workstation, data)
    await flush_or_conflict(session)
    return workstation
