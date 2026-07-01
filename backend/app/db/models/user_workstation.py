from __future__ import annotations
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.db.models.user import User
    from app.db.models.workstation import Workstation

from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class UserWorkstation(Base):
    __tablename__ = "user_workstations"

    workstation_id: Mapped[int] = mapped_column(
        ForeignKey("workstations.id", ondelete="CASCADE"),
        primary_key=True,
    )

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True,
    )

    user: Mapped["User"] = relationship(
        back_populates="workstation_links",
    )

    workstation: Mapped["Workstation"] = relationship(
        back_populates="user_links",
    )
