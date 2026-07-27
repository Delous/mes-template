"""Add items is product flag

Revision ID: c41d6e9a2f05
Revises: 8f2d1c4a9b73
Create Date: 2026-07-27 00:02:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "c41d6e9a2f05"
down_revision: Union[str, Sequence[str], None] = "8f2d1c4a9b73"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        "items",
        sa.Column("is_product", sa.Boolean(), server_default=sa.false(), nullable=False),
    )
    op.alter_column("items", "is_product", server_default=None)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column("items", "is_product")
