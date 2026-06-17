from __future__ import annotations
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.db.models.sensor_value import SensorValue

from datetime import datetime, timezone

from sqlalchemy import CheckConstraint, Index, Integer, SmallInteger, String, UniqueConstraint, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.db.mixins import TimestampMixin


class Sensor(Base, TimestampMixin):
    __tablename__ = "sensors"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    code: Mapped[str] = mapped_column(String(15), nullable=False)
    channel: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    name: Mapped[str | None] = mapped_column(String(256), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    values: Mapped[list["SensorValue"]] = relationship(
        back_populates="sensor",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    __table_args__ = (
        UniqueConstraint("code", "channel", name="uq_sensors_code_channel"),
        CheckConstraint(
            r"code ~ '^([0-9]{1,3}\.){3}[0-9]{1,3}$'",
            name="ck_sensors_code_ipv4_format",
        ),
        CheckConstraint("channel >= 1 AND channel <= 3", name="ck_sensors_channel_range"),
        Index("ix_sensors_code_channel", "code", "channel"),
    )
