from __future__ import annotations
from collections.abc import Iterable
from typing import Any
from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from app.catalogs.common.repository import list_entities
from app.catalogs.common.service import apply_fields, ensure_active_exists, ensure_unique_name, ensure_update_payload, flush_or_conflict, get_active_or_404, soft_delete_entity
from app.catalogs.item.schema import ItemCreate, ItemInputCreate, ItemUpdate
from app.db.models.item import Item
from app.db.models.item_input import ItemInput
from app.db.models.operation_type import OperationType
from app.db.models.unit import Unit
from app.db.models.workstation import Workstation

def item_options() -> list[Any]:
    return [selectinload(Item.unit), selectinload(Item.operation_type), selectinload(Item.workstation), selectinload(Item.inputs).selectinload(ItemInput.input_item)]
async def list_items(session: AsyncSession, page: int, size: int, include_deleted: bool, is_product: bool | None = None) -> dict:
    filters = [Item.is_product.is_(is_product)] if is_product is not None else None
    return await list_entities(session, Item, page, size, include_deleted, item_options(), [Item.name.asc(), Item.id.asc()], filters)
async def get_item_by_id(session: AsyncSession, item_id: int) -> Item:
    return await get_active_or_404(session, Item, item_id, "Item", item_options())
async def ensure_item_refs(session: AsyncSession, data: dict) -> None:
    for model, key, label in [(Unit, "unit_id", "Unit"), (OperationType, "operation_type_id", "Operation type"), (Workstation, "workstation_id", "Workstation")]:
        if data.get(key) is not None: await ensure_active_exists(session, model, data[key], label)
    for line in data.get("inputs") or []: await ensure_active_exists(session, Item, line["input_item_id"], "Input item")
async def find_cycle_conflict_item(session: AsyncSession, target_id: int, input_ids: Iterable[int]) -> Item | None:
    result = await session.execute(select(Item).options(selectinload(Item.inputs)))
    graph = {item.id: [line.input_item_id for line in item.inputs] for item in result.scalars().all() if item.id != target_id}
    def reaches_target(item_id: int, visited: set[int]) -> bool:
        if item_id == target_id: return True
        if item_id in visited: return False
        visited.add(item_id)
        return any(reaches_target(next_id, visited) for next_id in graph.get(item_id, []))
    for input_id in input_ids:
        if reaches_target(input_id, set()): return await get_item_by_id(session, input_id)
    return None
async def replace_inputs(session: AsyncSession, item: Item, inputs: list[ItemInputCreate]) -> None:
    conflict = await find_cycle_conflict_item(session, item.id, [line.input_item_id for line in inputs])
    if conflict: raise HTTPException(status_code=409, detail={"message":"Циклическая зависимость состава номенклатуры","item_id":conflict.id,"item_name":conflict.name})
    item.inputs = [ItemInput(**line.model_dump()) for line in inputs]
async def create_item(session: AsyncSession, payload: ItemCreate) -> Item:
    data = payload.model_dump(); await ensure_item_refs(session, data); await ensure_unique_name(session, Item, data["name"], "Item")
    inputs = [ItemInputCreate(**line) for line in data.pop("inputs")]; item = Item(**data); session.add(item); await session.flush(); await replace_inputs(session, item, inputs); await flush_or_conflict(session)
    return await get_item_by_id(session, item.id)
async def update_item(session: AsyncSession, item_id: int, payload: ItemUpdate) -> Item:
    data = payload.model_dump(exclude_unset=True); ensure_update_payload(data); item = await get_item_by_id(session, item_id); await ensure_item_refs(session, data)
    if "name" in data: await ensure_unique_name(session, Item, data["name"], "Item", item_id)
    inputs = data.pop("inputs", None); apply_fields(item, data)
    if inputs is not None: await replace_inputs(session, item, [ItemInputCreate(**line) for line in inputs])
    await flush_or_conflict(session); return await get_item_by_id(session, item.id)
async def delete_item(session: AsyncSession, item_id: int) -> None:
    await soft_delete_entity(session, Item, item_id, "Item")
