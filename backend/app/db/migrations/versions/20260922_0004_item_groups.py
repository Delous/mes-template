"""Group items and identify the main active item."""
from alembic import op
import sqlalchemy as sa

revision = "e72c1a04b931"
down_revision = "d912c0be4a71"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("items", sa.Column("group_uuid", sa.Uuid(), nullable=False, server_default=sa.text("gen_random_uuid()")))
    op.add_column("items", sa.Column("is_main", sa.Boolean(), nullable=False, server_default=sa.true()))
    op.create_index("ix_items_group_uuid", "items", ["group_uuid"])
    op.create_index("uq_items_group_main", "items", ["group_uuid"], unique=True, postgresql_where=sa.text("is_main AND deleted_at IS NULL"))
    op.alter_column("items", "group_uuid", server_default=None)
    op.alter_column("items", "is_main", server_default=None)


def downgrade() -> None:
    op.drop_index("uq_items_group_main", table_name="items")
    op.drop_index("ix_items_group_uuid", table_name="items")
    op.drop_column("items", "is_main")
    op.drop_column("items", "group_uuid")
