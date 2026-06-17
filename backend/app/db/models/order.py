from __future__ import annotations
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.db.models.bom import Bom
    from app.db.models.item import Item
    from app.db.models.route import Route
    from app.db.models.task import Task

from decimal import Decimal

from sqlalchemy import (
    BigInteger,
    CheckConstraint,
    ForeignKey,
    Index,
    Numeric,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.db.mixins import TimestampMixin


class Order(Base, TimestampMixin):
    __tablename__ = "orders"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    number: Mapped[str] = mapped_column(Text, nullable=False, unique=True)
    status: Mapped[str] = mapped_column(Text, nullable=False)

    lines: Mapped[list["OrderLine"]] = relationship(
        back_populates="order",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    tasks: Mapped[list["Task"]] = relationship(
        back_populates="order",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    __table_args__ = (
        Index("ix_orders_status", "status"),
    )


class OrderLine(Base):
    __tablename__ = "order_lines"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    order_id: Mapped[int] = mapped_column(
        ForeignKey("orders.id", ondelete="CASCADE"),
        nullable=False,
    )
    item_id: Mapped[int] = mapped_column(
        ForeignKey("items.id"),
        nullable=False,
    )
    quantity: Mapped[Decimal] = mapped_column(Numeric(18, 6), nullable=False)
    bom_id: Mapped[int | None] = mapped_column(
        ForeignKey("boms.id"),
        nullable=True,
    )
    route_id: Mapped[int | None] = mapped_column(
        ForeignKey("routes.id"),
        nullable=True,
    )

    order: Mapped["Order"] = relationship(
        back_populates="lines",
    )

    item: Mapped["Item"] = relationship(
        back_populates="order_lines",
    )

    bom: Mapped["Bom | None"] = relationship(
        back_populates="order_lines",
    )

    route: Mapped["Route | None"] = relationship(
        back_populates="order_lines",
    )

    tasks: Mapped[list["Task"]] = relationship(
        back_populates="order_line",
    )

    __table_args__ = (
        CheckConstraint("quantity > 0", name="ck_order_lines_quantity_positive"),
        Index("ix_order_lines_order_id", "order_id"),
        Index("ix_order_lines_item_id", "item_id"),
        Index("ix_order_lines_bom_id", "bom_id"),
        Index("ix_order_lines_route_id", "route_id"),
    )
