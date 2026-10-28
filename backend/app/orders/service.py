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
from app.db.models.workstation import Workstation
from app.db.models.unit import Unit
from app.tasks.planning import plan_order, snapshot_routes
from app.db.models.order import Order, OrderLine
from app.db.models.task import Task, TaskDependency
from app.db.models.task_history import TaskHistory
from app.orders.schema import CreateOrderRequest, UpdateOrderRequest
from app.tasks.service import activate_ready_tasks


def order_options():
    return [selectinload(Order.lines)]


def order_detail_options():
    return [
        selectinload(Order.lines),
        selectinload(Order.tasks).selectinload(Task.item),
        selectinload(Order.tasks).selectinload(Task.order),
        selectinload(Order.tasks).selectinload(Task.dependencies).selectinload(TaskDependency.depends_on_task).selectinload(Task.item),
    ]


async def get_active_item(session: AsyncSession, item_id: int) -> Item:
    result = await session.execute(
        select(Item).where(Item.id == item_id, Item.deleted_at.is_(None))
    )
    item = result.scalar_one_or_none()
    if item is None:
        raise HTTPException(status_code=404, detail=f"Item not found: {item_id}")
    return item


async def create_order_tasks(session: AsyncSession, order: Order, lines: list[OrderLine]) -> None:
    records = (await session.scalars(select(Item))).all()
    items = {item.id: dict(id=item.id, name=item.name, unit_id=item.unit_id, routes=item.routes)
             for item in records}
    try:
        plans = plan_order(items, [dict(id=line.id, item_id=line.item_id, quantity=line.quantity)
                                   for line in lines])
    except ValueError as error:
        raise HTTPException(status_code=409, detail=str(error)) from error
    operations = dict((await session.execute(select(OperationType.id, OperationType.name))).all())
    workstations = dict((await session.execute(select(Workstation.id, Workstation.name))).all())
    units = dict((await session.execute(select(Unit.id, Unit.symbol))).all())
    tasks = {}
    for item_id, plan in plans.items():
        routes = snapshot_routes(plan, items, operations, workstations, units)
        task = Task(task_type='operation', status='waiting', description=order.number,
                    planned_quantity=plan['quantity'], actual_quantity=Decimal('0'),
                    defect_quantity=Decimal('0'), order_id=order.id,
                    order_line_id=plan['line_id'], item_id=item_id, routes=routes)
        session.add(task)
        tasks[item_id] = task
    await session.flush()
    for item_id, plan in plans.items():
        for dependency in plan['dependencies']:
            session.add(TaskDependency(task_id=tasks[item_id].id,
                                       depends_on_task_id=tasks[dependency].id))


async def create_order(session: AsyncSession, payload: CreateOrderRequest) -> Order:
    existing_result = await session.execute(
        select(Order.id).where(Order.number == payload.number)
    )
    if existing_result.scalar_one_or_none() is not None:
        raise HTTPException(status_code=409, detail="Order already exists")

    order = Order(number=payload.number, status="created", priority=payload.priority,
                  deadline=payload.deadline)
    session.add(order)
    await session.flush()

    lines = []
    for line_payload in payload.lines:
        await get_active_item(session, line_payload.item_id)
        line = OrderLine(
            order_id=order.id,
            item_id=line_payload.item_id,
            quantity=line_payload.quantity,
        )
        session.add(line)
        await session.flush()
        lines.append(line)
    await create_order_tasks(session, order, lines)
    # Autoflush is disabled: persist every dependency before checking readiness.
    # activate_ready_tasks eagerly loads dependencies, avoiding async lazy loads.
    await session.flush()
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


async def update_order(session: AsyncSession, order_id: int, payload: UpdateOrderRequest) -> Order:
    order = await get_order_by_id(session, order_id)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(order, field, value)
    await session.flush()
    # updated_at is generated by the database, so refresh it before serialization.
    await session.refresh(order, attribute_names=['updated_at'])
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
