"""Remove the direct workstation relation from tasks; keep route snapshots.

Revision ID: 20261028_1800
Revises: 20261028_1600
"""
from alembic import op
import sqlalchemy as sa

revision = '20261028_1800'
down_revision = '20261028_1600'
branch_labels = None
depends_on = None


def upgrade():
    op.drop_index('ix_tasks_workstation_id', table_name='tasks')
    op.drop_column('tasks', 'workstation_id')


def downgrade():
    op.add_column('tasks', sa.Column('workstation_id', sa.BigInteger(), nullable=True))
    op.create_foreign_key('tasks_workstation_id_fkey', 'tasks', 'workstations', ['workstation_id'], ['id'])
    op.create_index('ix_tasks_workstation_id', 'tasks', ['workstation_id'])
