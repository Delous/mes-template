from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.catalogs.common.repository import get_active_or_none


def apply_fields(obj: Any, data: dict[str, Any]) -> None:
    for field, value in data.items():
        setattr(obj, field, value)


def ensure_update_payload(data: dict[str, Any]) -> None:
    if not data:
        raise HTTPException(status_code=400, detail="No fields to update")


async def flush_or_conflict(session: AsyncSession) -> None:
    try:
        await session.flush()
    except IntegrityError as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Catalog entity violates a uniqueness or foreign key constraint",
        ) from e


async def get_active_or_404(
    session: AsyncSession,
    model: type[Any],
    obj_id: int,
    name: str,
    options: list[Any] | None = None,
):
    obj = await get_active_or_none(session, model, obj_id, options)
    if obj is None:
        raise HTTPException(status_code=404, detail=f"{name} not found")
    return obj


async def ensure_active_exists(
    session: AsyncSession,
    model: type[Any],
    obj_id: int,
    name: str,
) -> None:
    await get_active_or_404(session, model, obj_id, name)


async def soft_delete_entity(
    session: AsyncSession,
    model: type[Any],
    obj_id: int,
    name: str,
) -> None:
    obj = await get_active_or_404(session, model, obj_id, name)
    obj.deleted_at = datetime.now(timezone.utc)
    await flush_or_conflict(session)
