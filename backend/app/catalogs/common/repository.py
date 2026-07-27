from __future__ import annotations

from typing import Any

from sqlalchemy import and_, func, select, true
from sqlalchemy.ext.asyncio import AsyncSession


def active_filter(model: type[Any], include_deleted: bool):
    if include_deleted:
        return true()
    return model.deleted_at.is_(None)


async def get_active_or_none(
    session: AsyncSession,
    model: type[Any],
    obj_id: int,
    options: list[Any] | None = None,
):
    stmt = select(model).where(model.id == obj_id, model.deleted_at.is_(None))
    if options:
        stmt = stmt.options(*options)

    result = await session.execute(stmt)
    return result.scalar_one_or_none()


async def list_entities(
    session: AsyncSession,
    model: type[Any],
    page: int,
    size: int,
    include_deleted: bool,
    options: list[Any] | None = None,
    order_by: list[Any] | None = None,
    filters: list[Any] | None = None,
) -> dict:
    where_clause = active_filter(model, include_deleted)
    if filters:
        where_clause = and_(where_clause, *filters)
    total_result = await session.execute(
        select(func.count()).select_from(model).where(where_clause)
    )

    order_by_clauses = order_by or [model.id.asc()]
    stmt = (
        select(model)
        .where(where_clause)
        .order_by(*order_by_clauses)
        .offset((page - 1) * size)
        .limit(size)
    )
    if options:
        stmt = stmt.options(*options)

    result = await session.execute(stmt)
    return {
        "items": list(result.scalars().all()),
        "total": total_result.scalar_one(),
        "page": page,
        "size": size,
    }
