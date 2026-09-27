from __future__ import annotations
from typing import TYPE_CHECKING
from uuid import UUID, uuid4

if TYPE_CHECKING:
    from app.db.models.order import OrderLine
    from app.db.models.item_input import ItemInput
    from app.db.models.operation_type import OperationType
    from app.db.models.task import Task
    from app.db.models.unit import Unit
    from app.db.models.workstation import Workstation

from sqlalchemy import BigInteger, Boolean, CheckConstraint, ForeignKey, Index, Text, Uuid, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.db.mixins import SoftDeleteMixin, TimestampMixin


class Item(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "items"
    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    group_uuid: Mapped[UUID] = mapped_column(Uuid, nullable=False, default=uuid4)
    is_main: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    name: Mapped[str] = mapped_column(Text, nullable=False, unique=True)
    is_product: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    unit_id: Mapped[int] = mapped_column(
        ForeignKey("units.id"),
        nullable=False,
    )
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    operation_type_id: Mapped[int | None] = mapped_column(ForeignKey("operation_types.id"), nullable=True)
    workstation_id: Mapped[int | None] = mapped_column(ForeignKey("workstations.id"), nullable=True)
    output_quantity: Mapped[int | None] = mapped_column(nullable=True)

    unit: Mapped["Unit"] = relationship(
        back_populates="items",
    )

    operation_type: Mapped["OperationType | None"] = relationship()
    workstation: Mapped["Workstation | None"] = relationship(back_populates="items")
    inputs: Mapped[list["ItemInput"]] = relationship(
        back_populates="item", cascade="all, delete-orphan", passive_deletes=True,
        foreign_keys="ItemInput.item_id",
    )
    used_as_input_by: Mapped[list["ItemInput"]] = relationship(
        back_populates="input_item", foreign_keys="ItemInput.input_item_id",
    )

    order_lines: Mapped[list["OrderLine"]] = relationship(
        back_populates="item",
    )

    tasks: Mapped[list["Task"]] = relationship(
        back_populates="item",
    )

    __table_args__ = (
        Index("ix_items_group_uuid", "group_uuid"),
        Index("uq_items_group_main", "group_uuid", unique=True, postgresql_where=text("is_main AND deleted_at IS NULL")),
        Index("ix_items_name", "name"),
        Index("ix_items_operation_type_id", "operation_type_id"),
        Index("ix_items_workstation_id", "workstation_id"),
        CheckConstraint("output_quantity IS NULL OR output_quantity >= 1", name="ck_items_output_quantity_positive"),
    )
