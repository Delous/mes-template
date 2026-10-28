from __future__ import annotations
from typing import TYPE_CHECKING
from uuid import UUID, uuid4

if TYPE_CHECKING:
    from app.db.models.order import OrderLine
    from app.db.models.task import Task
    from app.db.models.unit import Unit

from sqlalchemy import JSON, BigInteger, Boolean, CheckConstraint, ForeignKey, Index, Integer, Text, Uuid, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.db.mixins import SoftDeleteMixin, TimestampMixin


class Item(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "items"
    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    group_uuid: Mapped[UUID] = mapped_column(Uuid, nullable=False, default=uuid4)
    is_main: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    name: Mapped[str] = mapped_column(Text, nullable=False, unique=True)
    is_product: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    unit_id: Mapped[int] = mapped_column(
        ForeignKey("units.id"),
        nullable=False,
    )
    routes: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    labor_minutes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    unit: Mapped["Unit"] = relationship(
        back_populates="items",
    )

    order_lines: Mapped[list["OrderLine"]] = relationship(
        back_populates="item",
    )

    tasks: Mapped[list["Task"]] = relationship(
        back_populates="item",
    )

    __table_args__ = (
        CheckConstraint('labor_minutes >= 0', name='ck_items_labor_minutes_non_negative'),
        Index("ix_items_group_uuid", "group_uuid"),
        Index("uq_items_group_main", "group_uuid", unique=True, postgresql_where=text("is_main AND deleted_at IS NULL")),
        Index("ix_items_name", "name"),
    )
