from __future__ import annotations
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.db.models.task import Task
    from app.db.models.user import User

from datetime import datetime
from decimal import Decimal

from sqlalchemy import (
    BigInteger,
    DateTime,
    ForeignKey,
    Numeric,
    Text,
    CheckConstraint,
    Index,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class TaskHistory(Base):
    __tablename__ = "task_history"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)

    task_id: Mapped[int] = mapped_column(
        ForeignKey("tasks.id", ondelete="CASCADE"),
        nullable=False,
    )

    changed_by_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        nullable=False,
    )

    old_status: Mapped[str] = mapped_column(Text, nullable=False)
    new_status: Mapped[str] = mapped_column(Text, nullable=False)

    actual_quantity_delta: Mapped[Decimal | None] = mapped_column(
        Numeric(18, 6),
        nullable=True,
    )
    defect_quantity_delta: Mapped[Decimal | None] = mapped_column(
        Numeric(18, 6),
        nullable=True,
    )

    comment: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    task: Mapped["Task"] = relationship(
        back_populates="history",
    )

    __table_args__ = (
        CheckConstraint(
            "actual_quantity_delta IS NULL OR actual_quantity_delta >= 0",
            name="ck_task_history_actual_quantity_delta_non_negative",
        ),
        CheckConstraint(
            "defect_quantity_delta IS NULL OR defect_quantity_delta >= 0",
            name="ck_task_history_defect_quantity_delta_non_negative",
        ),
        Index("ix_task_history_task_id_created_at", "task_id", "created_at"),
        Index("ix_task_history_new_status", "new_status"),
    )
