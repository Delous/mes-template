"""Add order priority and a deadline date without time.

Revision ID: 20261028_1400
Revises: 20261028_1200
"""
from alembic import op
import sqlalchemy as sa

revision = '20261028_1400'
down_revision = '20261028_1200'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('orders', sa.Column('priority', sa.Text(), nullable=True, server_default='medium'))
    op.add_column('orders', sa.Column('deadline', sa.Date(), nullable=True))
    op.create_check_constraint('ck_orders_priority', 'orders', "priority IN ('medium', 'high')")


def downgrade():
    op.drop_constraint('ck_orders_priority', 'orders', type_='check')
    op.drop_column('orders', 'deadline')
    op.drop_column('orders', 'priority')
