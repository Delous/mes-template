from __future__ import annotations
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.db.models.order import OrderLine
    from app.db.models.resource_specification import (
        ResourceSpecification,
        ResourceSpecificationInput,
    )
    from app.db.models.task import Task
    from app.db.models.unit import Unit

from sqlalchemy import BigInteger, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.db.mixins import SoftDeleteMixin, TimestampMixin


class Item(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "items"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    name: Mapped[str] = mapped_column(Text, nullable=False, unique=True)
    unit_id: Mapped[int] = mapped_column(
        ForeignKey("units.id"),
        nullable=False,
    )
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    unit: Mapped["Unit"] = relationship(
        back_populates="items",
    )

    resource_specification: Mapped["ResourceSpecification | None"] = relationship(
        back_populates="item",
        cascade="all, delete-orphan",
        passive_deletes=True,
        uselist=False,
    )

    resource_specification_inputs: Mapped[list["ResourceSpecificationInput"]] = relationship(
        back_populates="item",
    )

    order_lines: Mapped[list["OrderLine"]] = relationship(
        back_populates="item",
    )

    tasks: Mapped[list["Task"]] = relationship(
        back_populates="item",
    )
