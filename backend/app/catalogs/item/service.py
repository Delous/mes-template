from __future__ import annotations

from collections.abc import Iterable
from typing import Any

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.catalogs.common.repository import list_entities
from app.catalogs.common.service import (
    apply_fields,
    ensure_active_exists,
    ensure_unique_name,
    ensure_update_payload,
    flush_or_conflict,
    get_active_or_404,
    soft_delete_entity,
)
from app.catalogs.item.schema import (
    ItemCreate,
    ItemUpdate,
    ResourceSpecificationCreate,
    ResourceSpecificationInputCreate,
    ResourceSpecificationUpdate,
)
from app.db.models.item import Item
from app.db.models.operation_type import OperationType
from app.db.models.resource_specification import (
    ResourceSpecification,
    ResourceSpecificationInput,
)
from app.db.models.unit import Unit
from app.db.models.workstation import Workstation


def item_options() -> list[Any]:
    return [
        selectinload(Item.unit),
        selectinload(Item.resource_specification).selectinload(
            ResourceSpecification.operation_type
        ),
        selectinload(Item.resource_specification).selectinload(
            ResourceSpecification.workstation
        ),
        selectinload(Item.resource_specification)
        .selectinload(ResourceSpecification.inputs)
        .selectinload(ResourceSpecificationInput.item),
    ]


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
    await ensure_unique_name(session, Item, payload.name, "Item")
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
    item = await get_item_by_id(session, item_id)
    if "unit_id" in data:
        await ensure_active_exists(session, Unit, data["unit_id"], "Unit")
    if "name" in data:
        await ensure_unique_name(session, Item, data["name"], "Item", item_id)

    apply_fields(item, data)
    await flush_or_conflict(session)
    return await get_item_by_id(session, item.id)


async def delete_item(session: AsyncSession, item_id: int) -> None:
    await soft_delete_entity(session, Item, item_id, "Item")


def build_specification_inputs(
    inputs: list[ResourceSpecificationInputCreate],
) -> list[ResourceSpecificationInput]:
    return [ResourceSpecificationInput(**item.model_dump()) for item in inputs]


async def ensure_specification_refs(
    session: AsyncSession,
    payload: ResourceSpecificationCreate | ResourceSpecificationUpdate,
) -> None:
    data = payload.model_dump(exclude_unset=True)
    if operation_type_id := data.get("operation_type_id"):
        result = await session.execute(
            select(OperationType.id).where(OperationType.id == operation_type_id)
        )
        if result.scalar_one_or_none() is None:
            raise HTTPException(status_code=404, detail="Operation type not found")

    if workstation_id := data.get("workstation_id"):
        result = await session.execute(
            select(Workstation.id).where(Workstation.id == workstation_id)
        )
        if result.scalar_one_or_none() is None:
            raise HTTPException(status_code=404, detail="Workstation not found")

    for item in data.get("inputs", []):
        await ensure_active_exists(session, Item, item["item_id"], "Input item")


async def find_cycle_conflict_item(
    session: AsyncSession,
    target_item_id: int,
    input_item_ids: Iterable[int],
) -> Item | None:
    result = await session.execute(
        select(ResourceSpecification).options(
            selectinload(ResourceSpecification.inputs),
            selectinload(ResourceSpecification.item),
        )
    )
    specifications = result.scalars().all()
    graph = {
        specification.item_id: [line.item_id for line in specification.inputs]
        for specification in specifications
        if specification.item_id != target_item_id
    }

    def reaches_target(item_id: int, visited: set[int]) -> bool:
        if item_id == target_item_id:
            return True
        if item_id in visited:
            return False
        visited.add(item_id)
        return any(reaches_target(next_item_id, visited) for next_item_id in graph.get(item_id, []))

    for input_item_id in input_item_ids:
        if reaches_target(input_item_id, set()):
            return await get_item_by_id(session, input_item_id)

    return None


async def ensure_no_cycle(
    session: AsyncSession,
    item_id: int,
    inputs: list[ResourceSpecificationInputCreate],
) -> None:
    conflict_item = await find_cycle_conflict_item(
        session,
        item_id,
        [item.item_id for item in inputs],
    )
    if conflict_item is not None:
        raise HTTPException(
            status_code=409,
            detail={
                "message": "Циклическая зависимость ресурсной спецификации",
                "item_id": conflict_item.id,
                "item_name": conflict_item.name,
            },
        )


async def create_resource_specification(
    session: AsyncSession,
    item_id: int,
    payload: ResourceSpecificationCreate,
) -> Item:
    item = await get_item_by_id(session, item_id)
    if item.resource_specification is not None:
        raise HTTPException(
            status_code=409,
            detail="Resource specification already exists",
        )
    await ensure_specification_refs(session, payload)
    await ensure_no_cycle(session, item_id, payload.inputs)

    specification = ResourceSpecification(
        item_id=item_id,
        **payload.model_dump(exclude={"inputs"}),
        inputs=build_specification_inputs(payload.inputs),
    )
    session.add(specification)
    await flush_or_conflict(session)
    return await get_item_by_id(session, item_id)


async def update_resource_specification(
    session: AsyncSession,
    item_id: int,
    payload: ResourceSpecificationUpdate,
) -> Item:
    data = payload.model_dump(exclude_unset=True)
    ensure_update_payload(data)
    item = await get_item_by_id(session, item_id)
    specification = item.resource_specification
    if specification is None:
        raise HTTPException(
            status_code=404,
            detail="Resource specification not found",
        )

    await ensure_specification_refs(session, payload)
    inputs = data.pop("inputs", None)
    if inputs is not None:
        input_payload = [
            ResourceSpecificationInputCreate(**line)
            for line in inputs
        ]
        await ensure_no_cycle(session, item_id, input_payload)
        specification.inputs = build_specification_inputs(input_payload)

    apply_fields(specification, data)
    await flush_or_conflict(session)
    return await get_item_by_id(session, item_id)
