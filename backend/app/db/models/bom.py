from __future__ import annotations
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.db.models.item import Item
    from app.db.models.order import OrderLine

from decimal import Decimal

from sqlalchemy import (
    BigInteger,
    Boolean,
    CheckConstraint,
    ForeignKey,
    Index,
    Numeric,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.db.mixins import SoftDeleteMixin, TimestampMixin


class Bom(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "boms"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    item_id: Mapped[int] = mapped_column(
        ForeignKey("items.id", ondelete="CASCADE"),
        nullable=False,
    )
    name: Mapped[str] = mapped_column(Text, nullable=False)
    version: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(Text, nullable=False)
    is_default: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    item: Mapped["Item"] = relationship(
        back_populates="boms",
    )

    lines: Mapped[list["BomLine"]] = relationship(
        back_populates="bom",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    order_lines: Mapped[list["OrderLine"]] = relationship(
        back_populates="bom",
    )

    __table_args__ = (
        UniqueConstraint("item_id", "version", name="uq_boms_item_id_version"),
        Index("ix_boms_item_id", "item_id"),
        Index("ix_boms_status", "status"),
        Index("ix_boms_is_default", "is_default"),
    )


class BomLine(Base):
    __tablename__ = "bom_lines"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    bom_id: Mapped[int] = mapped_column(
        ForeignKey("boms.id", ondelete="CASCADE"),
        nullable=False,
    )
    component_item_id: Mapped[int] = mapped_column(
        ForeignKey("items.id"),
        nullable=False,
    )
    quantity: Mapped[Decimal] = mapped_column(Numeric(18, 6), nullable=False)

    # Закладываемые потери материала при производстве
    scrap_percent: Mapped[Decimal] = mapped_column(
        Numeric(5, 2),
        nullable=False,
        default=0,
    )

    bom: Mapped["Bom"] = relationship(
        back_populates="lines",
    )

    component_item: Mapped["Item"] = relationship(
        back_populates="bom_component_lines",
        foreign_keys=[component_item_id],
    )

    __table_args__ = (
        CheckConstraint("quantity > 0", name="ck_bom_lines_quantity_positive"),
        CheckConstraint(
            "scrap_percent >= 0 AND scrap_percent <= 100",
            name="ck_bom_lines_scrap_percent_range",
        ),
        Index("ix_bom_lines_bom_id", "bom_id"),
        Index("ix_bom_lines_component_item_id", "component_item_id"),
    )
