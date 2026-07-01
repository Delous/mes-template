from __future__ import annotations
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.db.models.route import RouteOperation
    from app.db.models.task import Task
    from app.db.models.user_workstation import UserWorkstation

from sqlalchemy import BigInteger, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
class Workstation(Base):
    __tablename__ = "workstations"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    name: Mapped[str] = mapped_column(Text, nullable=False, unique=True)

    user_links: Mapped[list["UserWorkstation"]] = relationship(
        back_populates="workstation",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    route_operations: Mapped[list["RouteOperation"]] = relationship(
        back_populates="workstation",
    )

    tasks: Mapped[list["Task"]] = relationship(
        back_populates="workstation",
        foreign_keys="Task.workstation_id",
    )
