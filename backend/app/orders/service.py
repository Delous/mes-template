from __future__ import annotations

from decimal import Decimal

from fastapi import HTTPException
from fastapi import status as http_status
from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.schema import UserPublic
from app.db.models.item import Item
from app.db.models.order import Order, OrderLine
from app.db.models.resource_specification import (
    ResourceSpecification,
    ResourceSpecificationInput,
)
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


def specification_options():
    return [
        selectinload(ResourceSpecification.inputs).selectinload(
            ResourceSpecificationInput.item
        ),
        selectinload(ResourceSpecification.operation_type),
        selectinload(ResourceSpecification.workstation),
    ]


async def get_active_item(session: AsyncSession, item_id: int) -> Item:
    result = await session.execute(
        select(Item).where(Item.id == item_id, Item.deleted_at.is_(None))
    )
    item = result.scalar_one_or_none()
    if item is None:
        raise HTTPException(status_code=404, detail=f"Item not found: {item_id}")
    return item


async def get_specification_for_item(
    session: AsyncSession,
    item_id: int,
) -> ResourceSpecification | None:
    result = await session.execute(
        select(ResourceSpecification)
        .options(*specification_options())
        .where(ResourceSpecification.item_id == item_id)
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
        raise HTTPException(status_code=409, detail="Cyclic resource specification dependency detected")

    specification = await get_specification_for_item(session, item_id)
    if specification is None:
        return None, None

    stack.add(item_id)
    multiplier = required_quantity / Decimal(specification.output_quantity)
    dependency_tasks: list[Task] = []

    for specification_input in specification.inputs:
        input_quantity = specification_input.quantity * multiplier
        upstream_task, upstream_workstation_id = await create_tasks_for_item(
            session,
            order,
            line,
            specification_input.item_id,
            input_quantity,
            stack,
        )

        if upstream_task is not None:
            dependency = upstream_task
            if (
                upstream_workstation_id is not None
                and upstream_workstation_id != specification.workstation_id
            ):
                dependency = Task(
                    task_type="transfer",
                    status="waiting",
                    description=f"Доставить {specification_input.item.name}",
                    planned_quantity=input_quantity,
                    actual_quantity=Decimal("0"),
                    defect_quantity=Decimal("0"),
                    order_id=order.id,
                    order_line_id=line.id,
                    resource_specification_id=specification.id,
                    item_id=specification_input.item_id,
                    workstation_id=specification.workstation_id,
                    source_workstation_id=upstream_workstation_id,
                    target_workstation_id=specification.workstation_id,
                )
                session.add(dependency)
                await session.flush()
                await add_dependency(session, dependency, upstream_task)
            dependency_tasks.append(dependency)
        else:
            delivery_task = Task(
                task_type="warehouse_delivery",
                status="waiting",
                description=f"Доставить материалы: {specification_input.item.name}",
                planned_quantity=input_quantity,
                actual_quantity=Decimal("0"),
                defect_quantity=Decimal("0"),
                order_id=order.id,
                order_line_id=line.id,
                resource_specification_id=specification.id,
                item_id=specification_input.item_id,
                workstation_id=specification.workstation_id,
                target_workstation_id=specification.workstation_id,
            )
            session.add(delivery_task)
            await session.flush()
            dependency_tasks.append(delivery_task)

    operation_task = Task(
        task_type="operation",
        status="waiting",
        description=specification.name,
        planned_quantity=required_quantity,
        actual_quantity=Decimal("0"),
        defect_quantity=Decimal("0"),
        order_id=order.id,
        order_line_id=line.id,
        resource_specification_id=specification.id,
        item_id=specification.item_id,
        workstation_id=specification.workstation_id,
    )
    session.add(operation_task)
    await session.flush()

    for dependency_task in dependency_tasks:
        await add_dependency(session, operation_task, dependency_task)

    stack.remove(item_id)
    return operation_task, specification.workstation_id


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
        resource_specification_id=operation_task.resource_specification_id,
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
        if await get_specification_for_item(session, line_payload.item_id) is None:
            raise HTTPException(
                status_code=422,
                detail="Order line item has no resource specification",
            )

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
