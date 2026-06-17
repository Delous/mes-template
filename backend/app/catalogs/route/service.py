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
from app.catalogs.route.schema import RouteCreate, RouteOperationCreate, RouteUpdate
from app.db.models.item import Item
from app.db.models.route import OperationInput, OperationOutput, Route, RouteOperation
from app.db.models.work_center import WorkCenter


def route_options() -> list[Any]:
    return [
        selectinload(Route.item),
        selectinload(Route.operations).selectinload(RouteOperation.work_center),
        selectinload(Route.operations)
        .selectinload(RouteOperation.inputs)
        .selectinload(OperationInput.item),
        selectinload(Route.operations)
        .selectinload(RouteOperation.outputs)
        .selectinload(OperationOutput.item),
    ]


def build_route_operations(
    operations: list[RouteOperationCreate],
) -> list[RouteOperation]:
    route_operations = []
    for operation in operations:
        data = operation.model_dump(exclude={"inputs", "outputs"})
        route_operations.append(
            RouteOperation(
                **data,
                inputs=[
                    OperationInput(**item.model_dump())
                    for item in operation.inputs
                ],
                outputs=[
                    OperationOutput(**item.model_dump())
                    for item in operation.outputs
                ],
            )
        )
    return route_operations


async def ensure_route_refs(
    session: AsyncSession,
    item_id: int,
    operations: list[RouteOperationCreate],
) -> None:
    await ensure_active_exists(session, Item, item_id, "Item")
    for operation in operations:
        await ensure_active_exists(
            session,
            WorkCenter,
            operation.work_center_id,
            "Work center",
        )
        for item in [*operation.inputs, *operation.outputs]:
            await ensure_active_exists(session, Item, item.item_id, "Operation item")


async def list_routes(
    session: AsyncSession,
    page: int,
    size: int,
    include_deleted: bool,
) -> dict:
    return await list_entities(
        session,
        Route,
        page,
        size,
        include_deleted,
        route_options(),
    )


async def get_route_by_id(session: AsyncSession, route_id: int) -> Route:
    return await get_active_or_404(session, Route, route_id, "Route", route_options())


async def create_route(session: AsyncSession, payload: RouteCreate) -> Route:
    await ensure_route_refs(session, payload.item_id, payload.operations)
    data = payload.model_dump(exclude={"operations"})
    route = Route(**data, operations=build_route_operations(payload.operations))
    session.add(route)
    await flush_or_conflict(session)
    return await get_route_by_id(session, route.id)


async def update_route(
    session: AsyncSession,
    route_id: int,
    payload: RouteUpdate,
) -> Route:
    data = payload.model_dump(exclude_unset=True)
    ensure_update_payload(data)
    route = await get_route_by_id(session, route_id)
    operations = data.pop("operations", None)
    target_item_id = data.get("item_id", route.item_id)

    if "item_id" in data or operations is not None:
        await ensure_route_refs(session, target_item_id, operations or [])

    apply_fields(route, data)
    if operations is not None:
        route.operations = build_route_operations(operations)

    await flush_or_conflict(session)
    return await get_route_by_id(session, route.id)


async def delete_route(session: AsyncSession, route_id: int) -> None:
    await soft_delete_entity(session, Route, route_id, "Route")
