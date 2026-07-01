from __future__ import annotations
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.db.models.item import Item
    from app.db.models.order import OrderLine
    from app.db.models.task import Task
    from app.db.models.workstation import Workstation

from decimal import Decimal

from sqlalchemy import (
    BigInteger,
    Boolean,
    CheckConstraint,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.db.mixins import SoftDeleteMixin, TimestampMixin


class Route(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "routes"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    item_id: Mapped[int] = mapped_column(
        ForeignKey("items.id", ondelete="CASCADE"),
        nullable=False,
    )
    name: Mapped[str] = mapped_column(Text, nullable=False)
    version: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(Text, nullable=False)
    is_default: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    item: Mapped["Item"] = relationship(
        back_populates="routes",
    )

    operations: Mapped[list["RouteOperation"]] = relationship(
        back_populates="route",
        cascade="all, delete-orphan",
        passive_deletes=True,
        order_by="RouteOperation.operation_number",
    )

    order_lines: Mapped[list["OrderLine"]] = relationship(
        back_populates="route",
    )

    __table_args__ = (
        UniqueConstraint("item_id", "version", name="uq_routes_item_id_version"),
        Index("ix_routes_item_id", "item_id"),
        Index("ix_routes_status", "status"),
        Index("ix_routes_is_default", "is_default"),
    )


class RouteOperation(Base):
    __tablename__ = "route_operations"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    route_id: Mapped[int] = mapped_column(
        ForeignKey("routes.id", ondelete="CASCADE"),
        nullable=False,
    )
    operation_number: Mapped[int] = mapped_column(Integer, nullable=False)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    workstation_id: Mapped[int] = mapped_column(
        ForeignKey("workstations.id"),
        nullable=False,
    )
    setup_time_minutes: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    run_time_minutes: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    requires_quality_review: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
    )

    route: Mapped["Route"] = relationship(
        back_populates="operations",
    )

    workstation: Mapped["Workstation"] = relationship(
        back_populates="route_operations",
    )

    inputs: Mapped[list["OperationInput"]] = relationship(
        back_populates="operation",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    outputs: Mapped[list["OperationOutput"]] = relationship(
        back_populates="operation",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    tasks: Mapped[list["Task"]] = relationship(
        back_populates="route_operation",
    )

    __table_args__ = (
        UniqueConstraint(
            "route_id",
            "operation_number",
            name="uq_route_operations_route_id_operation_number",
        ),
        CheckConstraint(
            "setup_time_minutes >= 0",
            name="ck_route_operations_setup_time_minutes_non_negative",
        ),
        CheckConstraint(
            "run_time_minutes >= 0",
            name="ck_route_operations_run_time_minutes_non_negative",
        ),
        Index("ix_route_operations_route_id", "route_id"),
        Index("ix_route_operations_workstation_id", "workstation_id"),
    )


class OperationInput(Base):
    __tablename__ = "operation_inputs"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    operation_id: Mapped[int] = mapped_column(
        ForeignKey("route_operations.id", ondelete="CASCADE"),
        nullable=False,
    )
    item_id: Mapped[int] = mapped_column(
        ForeignKey("items.id"),
        nullable=False,
    )
    quantity: Mapped[Decimal] = mapped_column(Numeric(18, 6), nullable=False)
    operation: Mapped["RouteOperation"] = relationship(
        back_populates="inputs",
    )

    item: Mapped["Item"] = relationship(
        back_populates="operation_inputs",
    )

    __table_args__ = (
        CheckConstraint("quantity > 0", name="ck_operation_inputs_quantity_positive"),
        Index("ix_operation_inputs_operation_id", "operation_id"),
        Index("ix_operation_inputs_item_id", "item_id"),
    )


class OperationOutput(Base):
    __tablename__ = "operation_outputs"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    operation_id: Mapped[int] = mapped_column(
        ForeignKey("route_operations.id", ondelete="CASCADE"),
        nullable=False,
    )
    item_id: Mapped[int] = mapped_column(
        ForeignKey("items.id"),
        nullable=False,
    )
    quantity: Mapped[Decimal] = mapped_column(Numeric(18, 6), nullable=False)

    operation: Mapped["RouteOperation"] = relationship(
        back_populates="outputs",
    )

    item: Mapped["Item"] = relationship(
        back_populates="operation_outputs",
    )

    __table_args__ = (
        CheckConstraint("quantity > 0", name="ck_operation_outputs_quantity_positive"),
        Index("ix_operation_outputs_operation_id", "operation_id"),
        Index("ix_operation_outputs_item_id", "item_id"),
    )
