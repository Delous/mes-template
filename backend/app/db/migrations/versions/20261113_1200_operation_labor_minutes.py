"""Move labor effort to route steps without carrying over item values.

New step values live in items.routes JSON and require no additional columns.
Existing steps keep their labor effort unspecified for manual entry.

Revision ID: 20261113_1200
Revises: 20261030_1200
"""
from alembic import op
import sqlalchemy as sa

revision = '20261113_1200'
down_revision = '20261030_1200'
branch_labels = None
depends_on = None


def upgrade():
    op.drop_constraint('ck_items_labor_minutes_non_negative', 'items', type_='check')
    op.drop_column('items', 'labor_minutes')


def downgrade():
    # The former item values cannot be recovered; restore only the optional field.
    op.add_column('items', sa.Column('labor_minutes', sa.Integer(), nullable=True))
    op.create_check_constraint('ck_items_labor_minutes_non_negative', 'items', 'labor_minutes >= 0')
