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
from app.catalogs.unit.schema import UnitCreate, UnitUpdate
from app.db.models.unit import Unit


async def list_units(
    session: AsyncSession,
    page: int,
    size: int,
    include_deleted: bool,
) -> dict:
    return await list_entities(session, Unit, page, size, include_deleted)


async def get_unit_by_id(session: AsyncSession, unit_id: int) -> Unit:
    return await get_active_or_404(session, Unit, unit_id, "Unit")


async def create_unit(session: AsyncSession, payload: UnitCreate) -> Unit:
    unit = Unit(**payload.model_dump())
    session.add(unit)
    await flush_or_conflict(session)
    return unit


async def update_unit(
    session: AsyncSession,
    unit_id: int,
    payload: UnitUpdate,
) -> Unit:
    data = payload.model_dump(exclude_unset=True)
    ensure_update_payload(data)
    unit = await get_unit_by_id(session, unit_id)
    apply_fields(unit, data)
    await flush_or_conflict(session)
    return unit


async def delete_unit(session: AsyncSession, unit_id: int) -> None:
    await soft_delete_entity(session, Unit, unit_id, "Unit")
