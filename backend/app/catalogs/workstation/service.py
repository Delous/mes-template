from __future__ import annotations

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.catalogs.common.repository import list_entities
from app.core.list_query import CatalogSort, catalog_order, search_filter

from app.catalogs.common.service import (
    apply_fields,
    ensure_unique_name,
    ensure_update_payload,
    flush_or_conflict,
)
from app.catalogs.workstation.schema import WorkstationCreate, WorkstationUpdate
from app.db.models.workstation import Workstation


async def list_workstations(
    session: AsyncSession,
    page: int,
    size: int,
    search: str = "",
    sort: CatalogSort = "id_asc",
) -> dict:
    filters = [search_filter(search, Workstation.id, Workstation.name)] if search.strip() else []
    return await list_entities(session, Workstation, page, size, False,
                               order_by=catalog_order(Workstation, sort), filters=filters)


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
    await ensure_unique_name(session, Workstation, payload.name, "Workstation")
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
    if "name" in data:
        await ensure_unique_name(
            session,
            Workstation,
            data["name"],
            "Workstation",
            workstation_id,
        )
    apply_fields(workstation, data)
    await flush_or_conflict(session)
    return workstation
