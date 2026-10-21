"""Remove logistics fields from tasks.

Revision ID: 20261022_1200
Revises: d65c00a33fb9
Create Date: 2026-10-22
"""
from typing import Sequence, Union

from alembic import op


revision: str = "20261022_1200"
down_revision: Union[str, Sequence[str], None] = "d65c00a33fb9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("DELETE FROM task_dependencies WHERE task_id IN (SELECT id FROM tasks WHERE task_type IN ('warehouse_delivery', 'transfer'))")
    op.execute("DELETE FROM task_history WHERE task_id IN (SELECT id FROM tasks WHERE task_type IN ('warehouse_delivery', 'transfer'))")
    op.execute("DELETE FROM tasks WHERE task_type IN ('warehouse_delivery', 'transfer')")
    op.drop_column("tasks", "target_workstation_id")
    op.drop_column("tasks", "source_workstation_id")


def downgrade() -> None:
    import sqlalchemy as sa

    op.add_column("tasks", sa.Column("source_workstation_id", sa.BigInteger(), nullable=True))
    op.add_column("tasks", sa.Column("target_workstation_id", sa.BigInteger(), nullable=True))
    op.create_foreign_key(None, "tasks", "workstations", ["source_workstation_id"], ["id"])
    op.create_foreign_key(None, "tasks", "workstations", ["target_workstation_id"], ["id"])
