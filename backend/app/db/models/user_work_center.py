from __future__ import annotations
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.db.models.user import User
    from app.db.models.work_center import WorkCenter

from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship, synonym

from app.db.base import Base


class UserWorkCenter(Base):
    __tablename__ = "user_work_centers"

    work_center_id: Mapped[int] = mapped_column(
        ForeignKey("work_centers.id", ondelete="CASCADE"),
        primary_key=True,
    )
    workstation_id = synonym("work_center_id")

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True,
    )

    user: Mapped["User"] = relationship(
        back_populates="work_center_links",
    )

    work_center: Mapped["WorkCenter"] = relationship(
        back_populates="user_links",
    )
    workstation = synonym("work_center")
