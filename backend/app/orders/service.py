from __future__ import annotations

from decimal import Decimal

from fastapi import HTTPException
from fastapi import status as http_status
from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.schema import UserPublic
from app.db.models.item import Item
from app.db.models.operation_type import OperationType
from app.db.models.order import Order, OrderLine
from app.db.models.task import Task, TaskDependency
from app.db.models.task_history import TaskHistory
from app.orders.schema import CreateOrderRequest
from app.tasks.service import activate_ready_tasks


def order_options():
    return [selectinload(Order.lines)]


def order_detail_options():
    return [
        selectinload(Order.lines),
        selectinload(Order.tasks).selectinload(Task.item),
        selectinload(Order.tasks).selectinload(Task.workstation),
        selectinload(Order.tasks).selectinload(Task.source_workstation),
        selectinload(Order.tasks).selectinload(Task.target_workstation),
    ]


async def get_active_item(session: AsyncSession, item_id: int) -> Item:
    result = await session.execute(
        select(Item).where(Item.id == item_id, Item.deleted_at.is_(None))
    )
    item = result.scalar_one_or_none()
    if item is None:
        raise HTTPException(status_code=404, detail=f"Item not found: {item_id}")
    return item


async def get_item_with_routes(
    session: AsyncSession,
    item_id: int,
) -> Item | None:
    result = await session.execute(
        select(Item).where(Item.id == item_id, Item.deleted_at.is_(None))
    )
    return result.scalar_one_or_none()


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


async def create_tasks_for_item(
    session: AsyncSession,
    order: Order,
    line: OrderLine,
    item_id: int,
    required_quantity: Decimal,
    stack: set[int],
) -> tuple[Task | None, int | None]:
    if item_id in stack:
        raise HTTPException(status_code=409, detail="Cyclic item composition dependency detected")

    item = await get_item_with_routes(session, item_id)
    if item is not None and item.routes:
        stack.add(item_id)
        result = await create_tasks_for_routes(session, order, line, item, required_quantity, stack)
        stack.remove(item_id)
        return result
    return None, None


async def create_tasks_for_routes(session, order, line, item, required_quantity, stack):
    routes = {route["key"]: route for route in item.routes}
    referenced = {m["source_route_key"] for r in item.routes for step in r["steps"] for m in step["materials"] if m.get("source_route_key")}
    sinks = [key for key in routes if key not in referenced]
    quantities = {key: Decimal("0") for key in routes}
    visiting = set()

    def demand(key, quantity):
        if key in visiting or key not in routes:
            raise HTTPException(409, "Некорректная зависимость маршрутов")
        visiting.add(key)
        quantity = quantity.quantize(Decimal("0.01"), rounding="ROUND_CEILING")
        quantities[key] += quantity
        route = routes[key]
        for step in route["steps"]:
            for material in step["materials"]:
                if material.get("source_route_key"):
                    demand(material["source_route_key"], Decimal(str(material["quantity"])) * quantity / Decimal(str(route["output_quantity"])))
        visiting.remove(key)

    for key in sinks:
        demand(key, required_quantity)
    if not sinks:
        raise HTTPException(409, "Циклическая зависимость маршрутов")
    completed = {}

    async def new_task(kind, description, quantity, item_id, workstation, source=None, target=None):
        task = Task(task_type=kind, status="waiting", description=description,
                    planned_quantity=quantity, actual_quantity=Decimal("0"), defect_quantity=Decimal("0"),
                    order_id=order.id, order_line_id=line.id, item_id=item_id,
                    workstation_id=workstation, source_workstation_id=source, target_workstation_id=target)
        session.add(task)
        await session.flush()
        return task

    async def delivered(task, source, target, quantity, material_id, name):
        if task is not None and source != target:
            transfer = await new_task("transfer" if source is not None else "warehouse_delivery", f"Доставить {name}", quantity, material_id, target, source, target)
            await add_dependency(session, transfer, task)
            return transfer
        return task

    async def build(key):
        if key in completed:
            return completed[key]
        route = routes[key]
        quantity = quantities[key].quantize(Decimal("0.01"), rounding="ROUND_CEILING")
        multiplier = quantity / Decimal(str(route["output_quantity"]))
        # Every external route dependency gates the beginning of this route.
        prerequisites = []
        for step in route["steps"]:
            for material in step["materials"]:
                if material.get("source_route_key"):
                    upstream, _ = await build(material["source_route_key"])
                    prerequisites.append(upstream)
        previous, previous_post = None, None
        for index, step in enumerate(route["steps"]):
            post = step["workstation_id"]
            dependencies = list(prerequisites) if index == 0 else []
            if previous:
                dependencies.append(await delivered(previous, previous_post, post, quantity, item.id, route["name"]))
            for material in step["materials"]:
                amount = (Decimal(str(material["quantity"])) * multiplier).quantize(Decimal("0.01"), rounding="ROUND_CEILING")
                if material.get("source_route_key"):
                    upstream, source = await build(material["source_route_key"])
                    dependency = await delivered(upstream, source, post, amount, item.id, routes[material["source_route_key"]]["name"])
                else:
                    upstream, source = await create_tasks_for_item(session, order, line, material["input_item_id"], amount, stack)
                    dependency = await delivered(upstream, source, post, amount, material["input_item_id"], "материалы")
                    if dependency is None:
                        dependency = await new_task("warehouse_delivery", "Доставить материалы", amount, material["input_item_id"], post, target=post)
                dependencies.append(dependency)
            operation = await session.get(OperationType, step["operation_type_id"])
            previous = await new_task("operation", f'{route["name"]}: шаг {index + 1} — {operation.name}', quantity, item.id, post)
            for dependency in {task.id: task for task in dependencies}.values():
                await add_dependency(session, previous, dependency)
            previous_post = post
        completed[key] = previous, previous_post
        return completed[key]

    deliveries = []
    for key in sinks:
        task, post = await build(key)
        delivery = await new_task("warehouse_delivery", f"Доставить готовое на склад: {item.name} ({routes[key]['name']})", required_quantity, item.id, post, source=post)
        await add_dependency(session, delivery, task)
        deliveries.append(delivery)
    # One terminal dependency represents completion of all output routes.
    if len(deliveries) == 1:
        return deliveries[0], None
    terminal = await new_task("warehouse_delivery", f"Комплектовать: {item.name}", required_quantity, item.id, None)
    for delivery in deliveries:
        await add_dependency(session, terminal, delivery)
    return terminal, None


async def create_finished_goods_delivery(
    session: AsyncSession,
    order: Order,
    line: OrderLine,
    item: Item,
    operation_task: Task,
    workstation_id: int | None,
) -> None:
    if workstation_id is None:
        return

    delivery_task = Task(
        task_type="warehouse_delivery",
        status="waiting",
        description=f"Доставить готовое на склад: {item.name}",
        planned_quantity=line.quantity,
        actual_quantity=Decimal("0"),
        defect_quantity=Decimal("0"),
        order_id=order.id,
        order_line_id=line.id,
        item_id=item.id,
        workstation_id=workstation_id,
        source_workstation_id=workstation_id,
    )
    session.add(delivery_task)
    await session.flush()
    await add_dependency(session, delivery_task, operation_task)


async def create_order(session: AsyncSession, payload: CreateOrderRequest) -> Order:
    existing_result = await session.execute(
        select(Order.id).where(Order.number == payload.number)
    )
    if existing_result.scalar_one_or_none() is not None:
        raise HTTPException(status_code=409, detail="Order already exists")

    order = Order(number=payload.number, status="created")
    session.add(order)
    await session.flush()

    for line_payload in payload.lines:
        item = await get_active_item(session, line_payload.item_id)
        line = OrderLine(
            order_id=order.id,
            item_id=line_payload.item_id,
            quantity=line_payload.quantity,
        )
        session.add(line)
        await session.flush()
        operation_task, workstation_id = await create_tasks_for_item(
            session,
            order,
            line,
            line.item_id,
            line.quantity,
            set(),
        )
        if operation_task is not None:
            await create_finished_goods_delivery(
                session,
                order,
                line,
                item,
                operation_task,
                workstation_id,
            )
        elif not item.routes:
            delivery_task = Task(
                task_type="warehouse_delivery", status="waiting", description=f"Доставить со склада: {item.name}",
                planned_quantity=line.quantity, actual_quantity=Decimal("0"), defect_quantity=Decimal("0"),
                order_id=order.id, order_line_id=line.id, item_id=item.id,
                workstation_id=None, target_workstation_id=None,
            )
            session.add(delivery_task)

    await session.refresh(order, attribute_names=["lines"])
    await activate_ready_tasks(session)
    await session.flush()
    return await get_order_by_id(session, order.id)


async def get_order_by_id(session: AsyncSession, order_id: int) -> Order:
    result = await session.execute(
        select(Order)
        .options(*order_detail_options())
        .where(Order.id == order_id)
    )
    order = result.scalar_one_or_none()
    if order is None:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


async def delete_order(session: AsyncSession, order_id: int, user: UserPublic) -> None:
    if user.role != "admin":
        raise HTTPException(
            status_code=http_status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )

    result = await session.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()
    if order is None:
        raise HTTPException(status_code=404, detail="Order not found")

    order_task_ids = select(Task.id).where(Task.order_id == order_id)
    await session.execute(
        delete(TaskDependency).where(
            TaskDependency.task_id.in_(order_task_ids)
            | TaskDependency.depends_on_task_id.in_(order_task_ids)
        ).execution_options(synchronize_session=False)
    )
    await session.execute(
        delete(TaskHistory)
        .where(TaskHistory.task_id.in_(order_task_ids))
        .execution_options(synchronize_session=False)
    )
    await session.execute(
        delete(Task)
        .where(Task.order_id == order_id)
        .execution_options(synchronize_session=False)
    )
    await session.delete(order)
    await session.flush()


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
