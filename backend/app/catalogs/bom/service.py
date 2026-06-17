from __future__ import annotations

from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.catalogs.bom.schema import BomCreate, BomLineCreate, BomUpdate
from app.catalogs.common.repository import list_entities
from app.catalogs.common.service import (
    apply_fields,
    ensure_active_exists,
    ensure_update_payload,
    flush_or_conflict,
    get_active_or_404,
    soft_delete_entity,
)
from app.db.models.bom import Bom, BomLine
from app.db.models.item import Item


def bom_options() -> list[Any]:
    return [
        selectinload(Bom.item),
        selectinload(Bom.lines).selectinload(BomLine.component_item),
    ]


def build_bom_lines(lines: list[BomLineCreate]) -> list[BomLine]:
    return [BomLine(**line.model_dump()) for line in lines]


async def ensure_bom_refs(
    session: AsyncSession,
    item_id: int,
    lines: list[BomLineCreate],
) -> None:
    await ensure_active_exists(session, Item, item_id, "Item")
    for line in lines:
        await ensure_active_exists(
            session,
            Item,
            line.component_item_id,
            "Component item",
        )


async def list_boms(
    session: AsyncSession,
    page: int,
    size: int,
    include_deleted: bool,
) -> dict:
    return await list_entities(session, Bom, page, size, include_deleted, bom_options())


async def get_bom_by_id(session: AsyncSession, bom_id: int) -> Bom:
    return await get_active_or_404(session, Bom, bom_id, "BOM", bom_options())


async def create_bom(session: AsyncSession, payload: BomCreate) -> Bom:
    await ensure_bom_refs(session, payload.item_id, payload.lines)
    data = payload.model_dump(exclude={"lines"})
    bom = Bom(**data, lines=build_bom_lines(payload.lines))
    session.add(bom)
    await flush_or_conflict(session)
    return await get_bom_by_id(session, bom.id)


async def update_bom(
    session: AsyncSession,
    bom_id: int,
    payload: BomUpdate,
) -> Bom:
    data = payload.model_dump(exclude_unset=True)
    ensure_update_payload(data)
    bom = await get_bom_by_id(session, bom_id)
    lines = data.pop("lines", None)
    target_item_id = data.get("item_id", bom.item_id)

    if "item_id" in data or lines is not None:
        await ensure_bom_refs(session, target_item_id, lines or [])

    apply_fields(bom, data)
    if lines is not None:
        bom.lines = build_bom_lines(lines)

    await flush_or_conflict(session)
    return await get_bom_by_id(session, bom.id)


async def delete_bom(session: AsyncSession, bom_id: int) -> None:
    await soft_delete_entity(session, Bom, bom_id, "BOM")
