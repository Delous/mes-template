"""Add route specifications without importing legacy item composition."""
from alembic import op
import sqlalchemy as sa

revision = "f14a005routes"
down_revision = "e72c1a04b931"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("items", sa.Column("routes", sa.JSON(), nullable=False, server_default=sa.text("'[]'")))
    op.alter_column("items", "routes", server_default=None)


def downgrade():
    op.drop_column("items", "routes")
