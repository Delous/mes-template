from __future__ import annotations

from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.catalogs.common.repository import list_entities
from app.catalogs.common.service import (
    apply_fields,
    ensure_active_exists,
    ensure_update_payload,
    flush_or_conflict,
    get_active_or_404,
    soft_delete_entity,
)
from app.catalogs.item.schema import ItemCreate, ItemUpdate
from app.db.models.item import Item
from app.db.models.unit import Unit


def item_options() -> list[Any]:
    return [selectinload(Item.unit)]


async def list_items(
    session: AsyncSession,
    page: int,
    size: int,
    include_deleted: bool,
) -> dict:
    return await list_entities(session, Item, page, size, include_deleted, item_options())


async def get_item_by_id(session: AsyncSession, item_id: int) -> Item:
    return await get_active_or_404(session, Item, item_id, "Item", item_options())


async def create_item(session: AsyncSession, payload: ItemCreate) -> Item:
    await ensure_active_exists(session, Unit, payload.unit_id, "Unit")
    item = Item(**payload.model_dump())
    session.add(item)
    await flush_or_conflict(session)
    return await get_item_by_id(session, item.id)


async def update_item(
    session: AsyncSession,
    item_id: int,
    payload: ItemUpdate,
) -> Item:
    data = payload.model_dump(exclude_unset=True)
    ensure_update_payload(data)
    if "unit_id" in data:
        await ensure_active_exists(session, Unit, data["unit_id"], "Unit")

    item = await get_item_by_id(session, item_id)
    apply_fields(item, data)
    await flush_or_conflict(session)
    return await get_item_by_id(session, item.id)


async def delete_item(session: AsyncSession, item_id: int) -> None:
    await soft_delete_entity(session, Item, item_id, "Item")
