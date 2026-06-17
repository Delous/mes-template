from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import RootModel
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_session
from app.sensors.service import fetch_values_payload, ingest_values_payload

router = APIRouter(prefix="/api/v1", tags=["values"])


class ValuesPayload(RootModel[dict[int, list[str]]]):
    pass


@router.post("/values")
async def post_values(
    payload: ValuesPayload,
    session: AsyncSession = Depends(get_session),
):
    try:
        stats = await ingest_values_payload(session, payload.root)
        return {"status": "ok", **stats}

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    except IntegrityError as e:
        # Важно: тут откатится ВСЯ пачка, потому что всё в одной транзакции
        raise HTTPException(
            status_code=409,
            detail="Duplicate (sensor_id, ts) or other constraint violation. Entire batch was rolled back.",
        ) from e


@router.get("/values")
async def get_values(
    start: int = Query(..., description="Unix seconds UTC, inclusive"),
    end: int = Query(..., description="Unix seconds UTC, exclusive"),
    session: AsyncSession = Depends(get_session),
):
    if start < 0 or end < 0:
        raise HTTPException(status_code=400, detail="start and end must be non-negative")
    if start >= end:
        raise HTTPException(status_code=400, detail="start must be less than end")

    return await fetch_values_payload(session, start, end)
