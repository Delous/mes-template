from __future__ import annotations

from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import BigInteger, CheckConstraint, ForeignKey, Index, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.db.models.item import Item


class ItemInput(Base):
    __tablename__ = "item_inputs"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    item_id: Mapped[int] = mapped_column(ForeignKey("items.id", ondelete="CASCADE"), nullable=False)
    input_item_id: Mapped[int] = mapped_column(ForeignKey("items.id"), nullable=False)
    quantity: Mapped[Decimal] = mapped_column(Numeric(18, 2), nullable=False)

    item: Mapped["Item"] = relationship(back_populates="inputs", foreign_keys=[item_id])
    input_item: Mapped["Item"] = relationship(back_populates="used_as_input_by", foreign_keys=[input_item_id])

    __table_args__ = (
        CheckConstraint("quantity > 0", name="ck_item_inputs_quantity_positive"),
        Index("ix_item_inputs_item_id", "item_id"),
        Index("ix_item_inputs_input_item_id", "input_item_id"),
    )
