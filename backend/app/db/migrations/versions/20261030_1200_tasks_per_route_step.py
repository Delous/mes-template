"""Create new order tasks per route step, preserving existing tasks and history.

Revision ID: 20261030_1200
Revises: 20261028_1800
"""
from alembic import op
import sqlalchemy as sa

revision = '20261030_1200'
down_revision = '20261028_1800'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('tasks', sa.Column('route_key', sa.Text(), nullable=True))
    op.add_column('tasks', sa.Column('step_number', sa.Integer(), nullable=True))
    op.add_column('tasks', sa.Column('workstation_id', sa.BigInteger(), nullable=True))
    op.create_foreign_key('tasks_workstation_id_fkey', 'tasks', 'workstations', ['workstation_id'], ['id'])
    op.drop_constraint('uq_tasks_order_item', 'tasks', type_='unique')
    op.create_unique_constraint('uq_tasks_order_item_route_step', 'tasks',
                                ['order_id', 'item_id', 'route_key', 'step_number'])


def downgrade():
    # Multiple step tasks cannot be collapsed without losing progress/history.
    raise RuntimeError('Restoring one task per item requires a database backup')
