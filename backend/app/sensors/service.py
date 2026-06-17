from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import select, tuple_
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.sensor import Sensor
from app.db.models.sensor_value import SensorValue


@dataclass(frozen=True)
class ParsedLine:
    code: str
    ch_values: tuple[int | None, int | None, int | None]  # (ch1, ch2, ch3)


def parse_sensor_line(line: str) -> ParsedLine:
    parts = line.split()
    if len(parts) != 4:
        raise ValueError("Expected: '<code> <ch1> <ch2> <ch3>'")

    code_s, v1_s, v2_s, v3_s = parts

    def int_to_ipv4(n: int) -> str:
        if not (0 <= n <= 4294967295):
            raise ValueError("ipv4 int out of range")
        return ".".join(map(str, n.to_bytes(4, "little")))

    def parse_val(v: str) -> int | None:
        if v.lower() == "null":
            return None
        try:
            return int(v)
        except ValueError as e:
            raise ValueError(f"value must be int or NULL, got {v!r}") from e

    return ParsedLine(
        code=int_to_ipv4(int(code_s)),
        ch_values=(parse_val(v1_s), parse_val(v2_s), parse_val(v3_s)),
    )


def ts_int_to_datetime_utc(ts: int) -> datetime:
    """
    Превращает unix timestamp в datetime (UTC).
    Поддерживает секунды и миллисекунды:
    - 1700000000   -> seconds
    - 1700000000000 -> milliseconds
    """
    if ts < 0:
        raise ValueError("timestamp must be non-negative")

    # грубое эвристическое различение ms vs s
    # 10^12 — уже точно миллисекунды (примерно после 2001 года в ms)
    if ts >= 1_000_000_000_000:
        return datetime.fromtimestamp(ts / 1000.0, tz=timezone.utc)
    return datetime.fromtimestamp(ts, tz=timezone.utc)


async def ensure_sensors(
    session: AsyncSession,
    needed_sensors: set[tuple[str, int]],  # (code, channel)  <-- code у тебя строка ipv4
) -> dict[tuple[str, int], int]:
    if not needed_sensors:
        return {}

    stmt = select(Sensor).where(tuple_(Sensor.code, Sensor.channel).in_(needed_sensors))
    existing = (await session.execute(stmt)).scalars().all()
    mapping: dict[tuple[str, int], int] = {(s.code, s.channel): s.id for s in existing}

    missing = [pair for pair in needed_sensors if pair not in mapping]
    if missing:
        session.add_all([Sensor(code=code, channel=channel) for (code, channel) in missing])
        await session.flush()

        stmt2 = select(Sensor).where(tuple_(Sensor.code, Sensor.channel).in_(needed_sensors))
        all_rows = (await session.execute(stmt2)).scalars().all()
        mapping = {(s.code, s.channel): s.id for s in all_rows}

    return mapping


async def ingest_values_payload(
    session: AsyncSession,
    payload: dict[int, list[str]],
) -> dict[str, Any]:
    parsed_by_ts: dict[datetime, list[ParsedLine]] = {}
    needed_sensors: set[tuple[str, int]] = set()

    accepted_timestamps = 0
    accepted_lines = 0
    parsed_values = 0

    for ts_int, lines in payload.items():
        ts = ts_int_to_datetime_utc(ts_int)

        ok_lines: list[ParsedLine] = []
        for line in lines:
            pl = parse_sensor_line(line)
            ok_lines.append(pl)
            for ch_idx, v in enumerate(pl.ch_values, start=1):
                if v is not None:
                    needed_sensors.add((pl.code, ch_idx))
                    parsed_values += 1

        if ok_lines:
            parsed_by_ts[ts] = ok_lines
            accepted_timestamps += 1
            accepted_lines += len(ok_lines)

    sensors_map = await ensure_sensors(session, needed_sensors)

    rows: list[dict[str, Any]] = []
    for ts, plines in parsed_by_ts.items():
        for pl in plines:
            for ch_idx, v in enumerate(pl.ch_values, start=1):
                if v is None:
                    continue
                sensor_id = sensors_map[(pl.code, ch_idx)]
                rows.append({"sensor_id": sensor_id, "ts": ts, "value": v})

    if rows:
        stmt = pg_insert(SensorValue).values(rows)

        stmt = stmt.on_conflict_do_update(
            index_elements=["sensor_id", "ts"],
            set_={
                "value": stmt.excluded.value,
            },
        )

        await session.execute(stmt)

    return {
        "accepted_timestamps": accepted_timestamps,
        "accepted_lines": accepted_lines,
        "parsed_values": parsed_values,
        "to_insert": len(rows),
    }


async def fetch_values_payload(
    session: AsyncSession,
    start: int,
    end: int,
) -> dict[int, list[str]]:
    stmt = (
        select(SensorValue.ts, Sensor.code, Sensor.channel, SensorValue.value)
        .join(Sensor, Sensor.id == SensorValue.sensor_id)
        .where(SensorValue.ts >= start, SensorValue.ts < end)
        .order_by(SensorValue.ts, Sensor.code, Sensor.channel)
    )

    rows = (await session.execute(stmt)).all()

    temp: dict[int, dict[int, list[int | None]]] = {}
    for ts, code, channel, value in rows:
        per_ts = temp.setdefault(int(ts), {})
        per_code = per_ts.setdefault(int(code), [None, None, None])
        per_code[int(channel) - 1] = int(value)

    result: dict[int, list[str]] = {}
    for ts, codes_map in temp.items():
        lines: list[str] = []

        for code in sorted(codes_map.keys()):
            v1, v2, v3 = codes_map[code]

            def fmt(v: int | None) -> str:
                return "NULL" if v is None else str(v)

            lines.append(f"{code} {fmt(v1)} {fmt(v2)} {fmt(v3)}")

        result[ts] = lines

    return result
