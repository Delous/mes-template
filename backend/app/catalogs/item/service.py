from __future__ import annotations
from collections.abc import Iterable
from typing import Any
from fastapi import HTTPException
from sqlalchemy import select, update
from datetime import datetime, timezone
from uuid import uuid4
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from app.catalogs.common.repository import list_entities
from app.catalogs.common.service import apply_fields, ensure_active_exists, ensure_unique_name, ensure_update_payload, flush_or_conflict, get_active_or_404
from app.catalogs.item.schema import ItemCreate, ItemInputCreate, ItemUpdate, ItemResponse
from app.db.models.item import Item
from app.db.models.item_input import ItemInput
from app.db.models.operation_type import OperationType
from app.db.models.unit import Unit
from app.db.models.workstation import Workstation

def item_options() -> list[Any]:
    return [selectinload(Item.unit), selectinload(Item.operation_type), selectinload(Item.workstation), selectinload(Item.inputs).selectinload(ItemInput.input_item)]
async def list_items(session: AsyncSession, page: int, size: int, include_deleted: bool, is_product: bool | None = None, grouped: bool = True) -> dict:
    filters = [Item.is_main.is_(True)] if grouped else []
    if is_product is not None:
        matching = select(Item.group_uuid).where(Item.is_product.is_(is_product), Item.deleted_at.is_(None))
        filters.append(Item.group_uuid.in_(matching) if grouped else Item.is_product.is_(is_product))
    result = await list_entities(session, Item, page, size, include_deleted, item_options(), [Item.name.asc(), Item.id.asc()], filters)
    if grouped and result["items"]:
        groups = [item.group_uuid for item in result["items"]]
        query = select(Item).where(Item.group_uuid.in_(groups), Item.is_main.is_(False)).options(*item_options()).order_by(Item.created_at, Item.id)
        if not include_deleted:
            query = query.where(Item.deleted_at.is_(None))
        variants = (await session.scalars(query)).all()
        result["items"] = [ItemResponse.model_validate(item).model_copy(update={"variants": [ItemResponse.model_validate(v) for v in variants if v.group_uuid == item.group_uuid]}) for item in result["items"]]
    return result
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
    inputs = [ItemInputCreate(**line) for line in data.pop("inputs")]; item = Item(**data, inputs=[]); session.add(item); await session.flush(); await replace_inputs(session, item, inputs); await flush_or_conflict(session)
    return await get_item_by_id(session, item.id)
async def update_item(session: AsyncSession, item_id: int, payload: ItemUpdate) -> Item:
    data = payload.model_dump(exclude_unset=True); ensure_update_payload(data); item = await get_item_by_id(session, item_id); await ensure_item_refs(session, data)
    if "name" in data: await ensure_unique_name(session, Item, data["name"], "Item", item_id)
    inputs = data.pop("inputs", None); apply_fields(item, data)
    if inputs is not None: await replace_inputs(session, item, [ItemInputCreate(**line) for line in inputs])
    await flush_or_conflict(session); return await get_item_by_id(session, item.id)
async def lock_group(session: AsyncSession, item_id: int) -> Item:
    item = await get_item_by_id(session, item_id)
    # Serialize changes across the whole group, including creation and deletion.
    await session.execute(select(Item.id).where(Item.group_uuid == item.group_uuid).order_by(Item.id).with_for_update())
    await session.refresh(item, attribute_names=["is_main", "deleted_at"])
    if item.deleted_at is not None:
        raise HTTPException(status_code=404, detail="Item not found")
    return item

async def duplicate_item(session: AsyncSession, item_id: int, variant: bool) -> Item:
    source = await lock_group(session, item_id)
    suffix = "вариант" if variant else "копия"
    name = f"{source.name[:210]} ({suffix} {uuid4().hex[:12]})"
    item = Item(name=name, unit_id=source.unit_id, description=source.description,
                is_product=source.is_product, operation_type_id=source.operation_type_id,
                workstation_id=source.workstation_id, output_quantity=source.output_quantity,
                group_uuid=source.group_uuid if variant else uuid4(), is_main=not variant,
                inputs=[ItemInput(input_item_id=line.input_item_id, quantity=line.quantity) for line in source.inputs])
    session.add(item)
    await flush_or_conflict(session)
    return await get_item_by_id(session, item.id)

async def make_main(session: AsyncSession, item_id: int) -> Item:
    item = await lock_group(session, item_id)
    await session.execute(update(Item).where(Item.group_uuid == item.group_uuid, Item.is_main.is_(True)).values(is_main=False))
    await session.flush()
    item.is_main = True
    await flush_or_conflict(session)
    return await get_item_by_id(session, item.id)

async def delete_item(session: AsyncSession, item_id: int) -> None:
    item = await lock_group(session, item_id)
    was_main = item.is_main
    item.deleted_at = datetime.now(timezone.utc)
    item.is_main = False
    await flush_or_conflict(session)
    if was_main:
        successor = await session.scalar(select(Item).where(Item.group_uuid == item.group_uuid, Item.deleted_at.is_(None)).order_by(Item.created_at, Item.id).limit(1))
        if successor:
            successor.is_main = True
            await flush_or_conflict(session)
