from __future__ import annotations
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.db.models.bom import Bom, BomLine
    from app.db.models.order import OrderLine
    from app.db.models.route import OperationInput, OperationOutput, Route
    from app.db.models.task import Task
    from app.db.models.unit import Unit

from sqlalchemy import BigInteger, ForeignKey, Index, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.db.mixins import SoftDeleteMixin, TimestampMixin


class Item(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "items"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    unit_id: Mapped[int] = mapped_column(
        ForeignKey("units.id"),
        nullable=False,
    )
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    unit: Mapped["Unit"] = relationship(
        back_populates="items",
    )

    boms: Mapped[list["Bom"]] = relationship(
        back_populates="item",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    routes: Mapped[list["Route"]] = relationship(
        back_populates="item",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    bom_component_lines: Mapped[list["BomLine"]] = relationship(
        back_populates="component_item",
        foreign_keys="BomLine.component_item_id",
    )

    operation_inputs: Mapped[list["OperationInput"]] = relationship(
        back_populates="item",
    )

    operation_outputs: Mapped[list["OperationOutput"]] = relationship(
        back_populates="item",
    )

    order_lines: Mapped[list["OrderLine"]] = relationship(
        back_populates="item",
    )

    tasks: Mapped[list["Task"]] = relationship(
        back_populates="item",
    )

    __table_args__ = (
        Index("ix_items_name", "name"),
    )
