from __future__ import annotations

from decimal import Decimal

from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.models.bom import Bom
from app.db.models.item import Item
from app.db.models.order import Order, OrderLine
from app.db.models.route import OperationInput, OperationOutput, Route, RouteOperation
from app.db.models.task import Task, TaskDependency
from app.orders.schema import CreateOrderRequest
from app.tasks.service import activate_ready_tasks


def order_options():
    return [selectinload(Order.lines)]


def route_options():
    return [
        selectinload(Route.operations).selectinload(RouteOperation.inputs),
        selectinload(Route.operations).selectinload(RouteOperation.outputs),
    ]


async def get_active_item(session: AsyncSession, item_id: int) -> Item:
    result = await session.execute(
        select(Item).where(Item.id == item_id, Item.deleted_at.is_(None))
    )
    item = result.scalar_one_or_none()
    if item is None:
        raise HTTPException(status_code=404, detail=f"Item not found: {item_id}")
    return item


async def get_active_route(session: AsyncSession, route_id: int) -> Route:
    result = await session.execute(
        select(Route)
        .options(*route_options())
        .where(Route.id == route_id, Route.deleted_at.is_(None))
    )
    route = result.scalar_one_or_none()
    if route is None:
        raise HTTPException(status_code=404, detail=f"Route not found: {route_id}")
    if route.status != "active":
        raise HTTPException(status_code=409, detail=f"Route is not active: {route_id}")
    return route


async def get_active_bom(session: AsyncSession, bom_id: int) -> Bom:
    result = await session.execute(
        select(Bom).where(Bom.id == bom_id, Bom.deleted_at.is_(None))
    )
    bom = result.scalar_one_or_none()
    if bom is None:
        raise HTTPException(status_code=404, detail=f"BOM not found: {bom_id}")
    if bom.status != "active":
        raise HTTPException(status_code=409, detail=f"BOM is not active: {bom_id}")
    return bom


async def get_default_bom_id(session: AsyncSession, item_id: int) -> int | None:
    result = await session.execute(
        select(Bom.id).where(
            Bom.item_id == item_id,
            Bom.deleted_at.is_(None),
            Bom.status == "active",
            Bom.is_default.is_(True),
        )
    )
    return result.scalar_one_or_none()


async def item_has_active_route(session: AsyncSession, item_id: int) -> bool:
    result = await session.execute(
        select(Route.id)
        .where(
            Route.item_id == item_id,
            Route.deleted_at.is_(None),
            Route.status == "active",
        )
        .limit(1)
    )
    return result.scalar_one_or_none() is not None


def output_item_id(operation: RouteOperation, fallback_item_id: int) -> int:
    if operation.outputs:
        return operation.outputs[0].item_id
    return fallback_item_id


def output_quantity(operation: RouteOperation, order_quantity: Decimal) -> Decimal:
    if operation.outputs:
        return operation.outputs[0].quantity * order_quantity
    return order_quantity


async def add_dependency(
    session: AsyncSession,
    task: Task,
    depends_on: Task | None,
) -> None:
    if depends_on is None:
        return
    session.add(
        TaskDependency(
            task_id=task.id,
            depends_on_task_id=depends_on.id,
        )
    )


async def create_tasks_for_order_line(
    session: AsyncSession,
    order: Order,
    line: OrderLine,
    route: Route,
) -> None:
    operations = sorted(route.operations, key=lambda operation: operation.operation_number)
    if not operations:
        raise HTTPException(status_code=422, detail="Route has no operations")

    previous_stage_task: Task | None = None

    for index, operation in enumerate(operations):
        raw_delivery_tasks: list[Task] = []
        raw_inputs = []
        for operation_input in operation.inputs:
            if not await item_has_active_route(session, operation_input.item_id):
                raw_inputs.append(operation_input)

        for operation_input in raw_inputs:
            delivery_task = Task(
                task_type="warehouse_delivery",
                status="waiting",
                description=f"Доставить материалы: {operation.operation_number}",
                planned_quantity=operation_input.quantity * line.quantity,
                actual_quantity=Decimal("0"),
                defect_quantity=Decimal("0"),
                order_id=order.id,
                order_line_id=line.id,
                route_operation_id=operation.id,
                item_id=operation_input.item_id,
                workstation_id=operation.workstation_id,
                target_workstation_id=operation.workstation_id,
            )
            session.add(delivery_task)
            await session.flush()
            if previous_stage_task is not None:
                await add_dependency(session, delivery_task, previous_stage_task)
            raw_delivery_tasks.append(delivery_task)

        operation_task = Task(
            task_type="operation",
            status="waiting",
            description=operation.name,
            planned_quantity=output_quantity(operation, line.quantity),
            actual_quantity=Decimal("0"),
            defect_quantity=Decimal("0"),
            order_id=order.id,
            order_line_id=line.id,
            route_operation_id=operation.id,
            item_id=output_item_id(operation, line.item_id),
            workstation_id=operation.workstation_id,
        )
        session.add(operation_task)
        await session.flush()

        await add_dependency(session, operation_task, previous_stage_task)
        for delivery_task in raw_delivery_tasks:
            await add_dependency(session, operation_task, delivery_task)

        stage_task: Task = operation_task
        if operation.requires_quality_review:
            quality_task = Task(
                task_type="quality_review",
                status="waiting",
                description=f"Контроль качества: {operation.operation_number}",
                planned_quantity=operation_task.planned_quantity,
                actual_quantity=Decimal("0"),
                defect_quantity=Decimal("0"),
                order_id=order.id,
                order_line_id=line.id,
                route_operation_id=operation.id,
                item_id=operation_task.item_id,
                workstation_id=operation.workstation_id,
            )
            session.add(quality_task)
            await session.flush()
            await add_dependency(session, quality_task, operation_task)
            stage_task = quality_task

        next_operation = operations[index + 1] if index + 1 < len(operations) else None
        if (
            next_operation is not None
            and operation.workstation_id != next_operation.workstation_id
        ):
            transfer_task = Task(
                task_type="transfer",
                status="waiting",
                description=(
                    f"Move result from operation {operation.operation_number} "
                    f"to {next_operation.operation_number}"
                ),
                planned_quantity=operation_task.planned_quantity,
                actual_quantity=Decimal("0"),
                defect_quantity=Decimal("0"),
                order_id=order.id,
                order_line_id=line.id,
                route_operation_id=next_operation.id,
                item_id=operation_task.item_id,
                workstation_id=next_operation.workstation_id,
                source_workstation_id=operation.workstation_id,
                target_workstation_id=next_operation.workstation_id,
            )
            session.add(transfer_task)
            await session.flush()
            await add_dependency(session, transfer_task, stage_task)
            previous_stage_task = transfer_task
        else:
            previous_stage_task = stage_task


async def create_order(session: AsyncSession, payload: CreateOrderRequest) -> Order:
    existing_result = await session.execute(
        select(Order.id).where(Order.number == payload.number)
    )
    if existing_result.scalar_one_or_none() is not None:
        raise HTTPException(status_code=409, detail="Order already exists")

    order = Order(number=payload.number, status="created")
    session.add(order)
    await session.flush()

    routes_by_line: dict[int, Route] = {}
    for line_payload in payload.lines:
        await get_active_item(session, line_payload.item_id)
        route = await get_active_route(session, line_payload.route_id)
        if route.item_id != line_payload.item_id:
            raise HTTPException(
                status_code=422,
                detail="Route item_id does not match order line item_id",
            )

        bom_id = line_payload.bom_id
        if bom_id is not None:
            bom = await get_active_bom(session, bom_id)
            if bom.item_id != line_payload.item_id:
                raise HTTPException(
                    status_code=422,
                    detail="BOM item_id does not match order line item_id",
                )
        else:
            bom_id = await get_default_bom_id(session, line_payload.item_id)

        line = OrderLine(
            order_id=order.id,
            item_id=line_payload.item_id,
            route_id=line_payload.route_id,
            bom_id=bom_id,
            quantity=line_payload.quantity,
        )
        session.add(line)
        await session.flush()
        routes_by_line[line.id] = route

    await session.refresh(order, attribute_names=["lines"])
    for line in order.lines:
        await create_tasks_for_order_line(session, order, line, routes_by_line[line.id])

    await activate_ready_tasks(session)
    await session.flush()
    return await get_order_by_id(session, order.id)


async def get_order_by_id(session: AsyncSession, order_id: int) -> Order:
    result = await session.execute(
        select(Order)
        .options(*order_options())
        .where(Order.id == order_id)
    )
    order = result.scalar_one_or_none()
    if order is None:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


async def list_orders(
    session: AsyncSession,
    page: int,
    size: int,
) -> dict:
    total_result = await session.execute(select(func.count()).select_from(Order))
    total = total_result.scalar_one()

    result = await session.execute(
        select(Order)
        .options(*order_options())
        .order_by(Order.created_at.desc(), Order.id.desc())
        .offset((page - 1) * size)
        .limit(size)
    )
    return {
        "items": list(result.scalars().all()),
        "total": total,
        "page": page,
        "size": size,
    }
