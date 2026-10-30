from __future__ import annotations

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.catalogs.common.repository import list_entities
from app.core.list_query import CatalogSort, catalog_order, search_filter

from app.catalogs.common.service import (
    apply_fields,
    ensure_unique_name,
    ensure_update_payload,
    flush_or_conflict,
)
from app.catalogs.operation_type.schema import OperationTypeCreate, OperationTypeUpdate
from app.db.models.operation_type import OperationType


async def list_operation_types(
    session: AsyncSession,
    page: int,
    size: int,
    search: str = "",
    sort: CatalogSort = "id_asc",
) -> dict:
    filters = [search_filter(search, OperationType.id, OperationType.name)] if search.strip() else []
    return await list_entities(session, OperationType, page, size, False,
                               order_by=catalog_order(OperationType, sort), filters=filters)


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
    await ensure_unique_name(session, OperationType, payload.name, "Operation type")
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
    if "name" in data:
        await ensure_unique_name(
            session,
            OperationType,
            data["name"],
            "Operation type",
            operation_type_id,
        )
    apply_fields(operation_type, data)
    await flush_or_conflict(session)
    return operation_type
