"""Add items name index

Revision ID: 8f2d1c4a9b73
Revises: 39245ad97737
Create Date: 2026-07-27 00:01:00.000000

"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = "8f2d1c4a9b73"
down_revision: Union[str, Sequence[str], None] = "39245ad97737"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_index("ix_items_name", "items", ["name"], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index("ix_items_name", table_name="items")
