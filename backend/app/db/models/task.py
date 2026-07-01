from __future__ import annotations
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.db.models.item import Item
    from app.db.models.order import Order, OrderLine
    from app.db.models.route import RouteOperation
    from app.db.models.task_history import TaskHistory
    from app.db.models.user import User
    from app.db.models.workstation import Workstation

from decimal import Decimal

from sqlalchemy import BigInteger, ForeignKey, Index, Numeric, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.db.mixins import TimestampMixin


class Task(Base, TimestampMixin):
    __tablename__ = "tasks"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    task_type: Mapped[str] = mapped_column(Text, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    planned_quantity: Mapped[Decimal] = mapped_column(Numeric(18, 6), nullable=False)
    status: Mapped[str] = mapped_column(Text, nullable=False)

    actual_quantity: Mapped[Decimal] = mapped_column(
        Numeric(18, 6),
        nullable=False,
        default=0,
    )

    defect_quantity: Mapped[Decimal] = mapped_column(
        Numeric(18, 6),
        nullable=False,
        default=0,
    )

    item_id: Mapped[int] = mapped_column(
        ForeignKey("items.id"),
        nullable=False,
    )

    order_id: Mapped[int] = mapped_column(
        ForeignKey("orders.id", ondelete="CASCADE"),
        nullable=False,
    )

    order_line_id: Mapped[int] = mapped_column(
        ForeignKey("order_lines.id"),
        nullable=False,
    )

    route_operation_id: Mapped[int | None] = mapped_column(
        ForeignKey("route_operations.id"),
        nullable=True,
    )

    workstation_id: Mapped[int | None] = mapped_column(
        ForeignKey("workstations.id"),
        nullable=True,
    )

    source_workstation_id: Mapped[int | None] = mapped_column(
        ForeignKey("workstations.id"),
        nullable=True,
    )

    target_workstation_id: Mapped[int | None] = mapped_column(
        ForeignKey("workstations.id"),
        nullable=True,
    )

    executor_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id"),
        nullable=True,
    )

    item: Mapped["Item"] = relationship(
        back_populates="tasks",
    )

    order: Mapped["Order"] = relationship(
        back_populates="tasks",
    )

    order_line: Mapped["OrderLine"] = relationship(
        back_populates="tasks",
    )

    route_operation: Mapped["RouteOperation"] = relationship(
        back_populates="tasks",
    )

    workstation: Mapped["Workstation"] = relationship(
        back_populates="tasks",
        foreign_keys=[workstation_id],
    )

    source_workstation: Mapped["Workstation | None"] = relationship(
        foreign_keys=[source_workstation_id],
    )

    target_workstation: Mapped["Workstation | None"] = relationship(
        foreign_keys=[target_workstation_id],
    )

    executor: Mapped["User | None"] = relationship(
        back_populates="assigned_tasks",
    )

    history: Mapped[list["TaskHistory"]] = relationship(
        back_populates="task",
        cascade="all, delete-orphan",
        passive_deletes=True,
        order_by="TaskHistory.created_at",
    )

    dependencies: Mapped[list["TaskDependency"]] = relationship(
        back_populates="task",
        cascade="all, delete-orphan",
        passive_deletes=True,
        foreign_keys="TaskDependency.task_id",
    )

    dependents: Mapped[list["TaskDependency"]] = relationship(
        back_populates="depends_on_task",
        cascade="all, delete-orphan",
        passive_deletes=True,
        foreign_keys="TaskDependency.depends_on_task_id",
    )

    __table_args__ = (
        Index("ix_tasks_order_id", "order_id"),
        Index("ix_tasks_order_line_id", "order_line_id"),
        Index("ix_tasks_status", "status"),
        Index("ix_tasks_task_type", "task_type"),
        Index("ix_tasks_workstation_id", "workstation_id"),
    )


class TaskDependency(Base):
    __tablename__ = "task_dependencies"

    task_id: Mapped[int] = mapped_column(
        ForeignKey("tasks.id", ondelete="CASCADE"),
        primary_key=True,
    )
    depends_on_task_id: Mapped[int] = mapped_column(
        ForeignKey("tasks.id", ondelete="CASCADE"),
        primary_key=True,
    )

    task: Mapped["Task"] = relationship(
        back_populates="dependencies",
        foreign_keys=[task_id],
    )
    depends_on_task: Mapped["Task"] = relationship(
        back_populates="dependents",
        foreign_keys=[depends_on_task_id],
    )
