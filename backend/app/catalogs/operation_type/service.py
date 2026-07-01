from __future__ import annotations

from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.catalogs.common.service import (
    apply_fields,
    ensure_update_payload,
    flush_or_conflict,
)
from app.catalogs.operation_type.schema import OperationTypeCreate, OperationTypeUpdate
from app.db.models.operation_type import OperationType


async def list_operation_types(
    session: AsyncSession,
    page: int,
    size: int,
    include_deleted: bool,
) -> dict:
    total_result = await session.execute(select(func.count()).select_from(OperationType))
    result = await session.execute(
        select(OperationType)
        .order_by(OperationType.id.asc())
        .offset((page - 1) * size)
        .limit(size)
    )
    return {
        "items": list(result.scalars().all()),
        "total": total_result.scalar_one(),
        "page": page,
        "size": size,
    }


async def get_operation_type_by_id(
    session: AsyncSession,
    operation_type_id: int,
) -> OperationType:
    result = await session.execute(
        select(OperationType).where(OperationType.id == operation_type_id)
    )
    operation_type = result.scalar_one_or_none()
    if operation_type is None:
        raise HTTPException(status_code=404, detail="Operation type not found")
    return operation_type


async def create_operation_type(
    session: AsyncSession,
    payload: OperationTypeCreate,
) -> OperationType:
    operation_type = OperationType(**payload.model_dump())
    session.add(operation_type)
    await flush_or_conflict(session)
    return operation_type


async def update_operation_type(
    session: AsyncSession,
    operation_type_id: int,
    payload: OperationTypeUpdate,
) -> OperationType:
    data = payload.model_dump(exclude_unset=True)
    ensure_update_payload(data)
    operation_type = await get_operation_type_by_id(session, operation_type_id)
    apply_fields(operation_type, data)
    await flush_or_conflict(session)
    return operation_type
