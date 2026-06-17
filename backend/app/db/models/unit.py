from __future__ import annotations
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.db.models.bom import BomLine
    from app.db.models.item import Item
    from app.db.models.order import OrderLine
    from app.db.models.route import OperationInput, OperationOutput

from sqlalchemy import BigInteger, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.db.mixins import SoftDeleteMixin, TimestampMixin


class Unit(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "units"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    name: Mapped[str] = mapped_column(Text, nullable=False, unique=True)
    symbol: Mapped[str] = mapped_column(Text, nullable=False, unique=True)

    items: Mapped[list["Item"]] = relationship(
        back_populates="unit",
    )
