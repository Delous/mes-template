"""Add optional item labor effort in whole minutes.

Revision ID: 20261028_1600
Revises: 20261028_1400
"""
from alembic import op
import sqlalchemy as sa

revision = '20261028_1600'
down_revision = '20261028_1400'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('items', sa.Column('labor_minutes', sa.Integer(), nullable=True))
    op.create_check_constraint('ck_items_labor_minutes_non_negative', 'items', 'labor_minutes >= 0')


def downgrade():
    op.drop_constraint('ck_items_labor_minutes_non_negative', 'items', type_='check')
    op.drop_column('items', 'labor_minutes')
