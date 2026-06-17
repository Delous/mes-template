from __future__ import annotations
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.db.models.route import RouteOperation
    from app.db.models.task import Task
    from app.db.models.user_work_center import UserWorkCenter

from sqlalchemy import BigInteger, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.db.mixins import SoftDeleteMixin, TimestampMixin


class WorkCenter(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "work_centers"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    name: Mapped[str] = mapped_column(Text, nullable=False, unique=True)
    type: Mapped[str] = mapped_column(Text, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    user_links: Mapped[list["UserWorkCenter"]] = relationship(
        back_populates="work_center",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    route_operations: Mapped[list["RouteOperation"]] = relationship(
        back_populates="work_center",
    )

    tasks: Mapped[list["Task"]] = relationship(
        back_populates="work_center",
        foreign_keys="Task.work_center_id",
    )
