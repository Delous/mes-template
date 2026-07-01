from __future__ import annotations
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.db.models.item import Item
    from app.db.models.operation_type import OperationType
    from app.db.models.task import Task
    from app.db.models.workstation import Workstation

from decimal import Decimal

from sqlalchemy import BigInteger, CheckConstraint, ForeignKey, Index, Numeric, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class ResourceSpecification(Base):
    __tablename__ = "resource_specifications"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    item_id: Mapped[int] = mapped_column(
        ForeignKey("items.id", ondelete="CASCADE"),
        nullable=False,
    )
    name: Mapped[str] = mapped_column(Text, nullable=False)
    operation_type_id: Mapped[int] = mapped_column(
        ForeignKey("operation_types.id"),
        nullable=False,
    )
    workstation_id: Mapped[int] = mapped_column(
        ForeignKey("workstations.id"),
        nullable=False,
    )
    output_quantity: Mapped[int] = mapped_column(nullable=False, default=1)

    item: Mapped["Item"] = relationship(
        back_populates="resource_specification",
    )

    operation_type: Mapped["OperationType"] = relationship()

    workstation: Mapped["Workstation"] = relationship(
        back_populates="resource_specifications",
    )

    inputs: Mapped[list["ResourceSpecificationInput"]] = relationship(
        back_populates="resource_specification",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    tasks: Mapped[list["Task"]] = relationship(
        back_populates="resource_specification",
    )

    __table_args__ = (
        UniqueConstraint("item_id", name="uq_resource_specifications_item_id"),
        CheckConstraint(
            "output_quantity >= 1",
            name="ck_resource_specifications_output_quantity_positive",
        ),
        Index("ix_resource_specifications_item_id", "item_id"),
        Index("ix_resource_specifications_operation_type_id", "operation_type_id"),
        Index("ix_resource_specifications_workstation_id", "workstation_id"),
    )


class ResourceSpecificationInput(Base):
    __tablename__ = "resource_specification_inputs"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    resource_specification_id: Mapped[int] = mapped_column(
        ForeignKey("resource_specifications.id", ondelete="CASCADE"),
        nullable=False,
    )
    item_id: Mapped[int] = mapped_column(
        ForeignKey("items.id"),
        nullable=False,
    )
    quantity: Mapped[Decimal] = mapped_column(Numeric(18, 6), nullable=False)

    resource_specification: Mapped["ResourceSpecification"] = relationship(
        back_populates="inputs",
    )

    item: Mapped["Item"] = relationship(
        back_populates="resource_specification_inputs",
    )

    __table_args__ = (
        CheckConstraint(
            "quantity > 0",
            name="ck_resource_specification_inputs_quantity_positive",
        ),
        Index(
            "ix_resource_specification_inputs_resource_specification_id",
            "resource_specification_id",
        ),
        Index("ix_resource_specification_inputs_item_id", "item_id"),
    )
