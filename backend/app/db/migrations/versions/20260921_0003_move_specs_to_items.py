"""Move resource specifications into items."""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "d912c0be4a71"
down_revision: Union[str, Sequence[str], None] = "c41d6e9a2f05"
branch_labels = None
depends_on = None

def upgrade() -> None:
    op.add_column("items", sa.Column("operation_type_id", sa.BigInteger(), nullable=True))
    op.add_column("items", sa.Column("workstation_id", sa.BigInteger(), nullable=True))
    op.add_column("items", sa.Column("output_quantity", sa.Integer(), nullable=True))
    op.create_foreign_key("fk_items_operation_type_id", "items", "operation_types", ["operation_type_id"], ["id"])
    op.create_foreign_key("fk_items_workstation_id", "items", "workstations", ["workstation_id"], ["id"])
    op.create_index("ix_items_operation_type_id", "items", ["operation_type_id"])
    op.create_index("ix_items_workstation_id", "items", ["workstation_id"])
    op.create_check_constraint("ck_items_output_quantity_positive", "items", "output_quantity IS NULL OR output_quantity >= 1")
    op.create_table("item_inputs",
        sa.Column("id", sa.BigInteger(), primary_key=True),
        sa.Column("item_id", sa.BigInteger(), nullable=False),
        sa.Column("input_item_id", sa.BigInteger(), nullable=False),
        sa.Column("quantity", sa.Numeric(18, 2), nullable=False),
        sa.CheckConstraint("quantity > 0", name="ck_item_inputs_quantity_positive"),
        sa.ForeignKeyConstraint(["item_id"], ["items.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["input_item_id"], ["items.id"]),
    )
    op.create_index("ix_item_inputs_item_id", "item_inputs", ["item_id"])
    op.create_index("ix_item_inputs_input_item_id", "item_inputs", ["input_item_id"])
    op.execute("UPDATE items SET operation_type_id = rs.operation_type_id, workstation_id = rs.workstation_id, output_quantity = rs.output_quantity FROM resource_specifications rs WHERE items.id = rs.item_id")
    op.execute("INSERT INTO item_inputs (id, item_id, input_item_id, quantity) SELECT rsi.id, rs.item_id, rsi.item_id, rsi.quantity FROM resource_specification_inputs rsi JOIN resource_specifications rs ON rs.id = rsi.resource_specification_id")
    op.drop_index("ix_tasks_resource_specification_id", table_name="tasks")
    op.drop_constraint("tasks_resource_specification_id_fkey", "tasks", type_="foreignkey")
    op.drop_column("tasks", "resource_specification_id")
    for table, column in [("order_lines", "quantity"), ("tasks", "planned_quantity"), ("tasks", "actual_quantity"), ("tasks", "defect_quantity"), ("task_history", "actual_quantity_delta"), ("task_history", "defect_quantity_delta")]:
        op.alter_column(table, column, type_=sa.Numeric(18, 2), existing_type=sa.Numeric(18, 6))
    op.drop_table("resource_specification_inputs")
    op.drop_table("resource_specifications")

def downgrade() -> None:
    raise NotImplementedError("This data migration is intentionally irreversible")
