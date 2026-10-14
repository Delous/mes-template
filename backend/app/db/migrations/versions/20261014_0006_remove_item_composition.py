"""Permanently remove operations and materials stored directly on items."""
from alembic import op

revision = "f14a006cleanup"
down_revision = "f14a005routes"
branch_labels = None
depends_on = None


def upgrade():
    op.drop_table("item_inputs")
    op.drop_index("ix_items_operation_type_id", table_name="items")
    op.drop_index("ix_items_workstation_id", table_name="items")
    op.drop_constraint("ck_items_output_quantity_positive", "items", type_="check")
    op.drop_column("items", "operation_type_id")
    op.drop_column("items", "workstation_id")
    op.drop_column("items", "output_quantity")


def downgrade():
    raise RuntimeError("Удаление старого состава номенклатуры необратимо")
