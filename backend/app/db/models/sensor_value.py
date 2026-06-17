from __future__ import annotations
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.db.models.sensor import Sensor

from datetime import datetime
from sqlalchemy import ForeignKey, Integer, DateTime, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class SensorValue(Base):
    __tablename__ = "sensor_values"

    ts: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        primary_key=True,
    )

    value: Mapped[int] = mapped_column(Integer, nullable=False)

    sensor_id: Mapped[int] = mapped_column(
        ForeignKey("sensors.id", ondelete="CASCADE"),
        primary_key=True,
    )

    sensor: Mapped["Sensor"] = relationship(
        back_populates="values",
    )

    __table_args__ = (
        Index("ix_sensor_values_ts", "ts"),
        Index("ix_sensor_values_sensor_id", "sensor_id"),
    )
