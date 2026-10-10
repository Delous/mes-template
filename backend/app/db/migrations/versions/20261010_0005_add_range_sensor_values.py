"""Add range sensor values."""
from alembic import op
import sqlalchemy as sa

revision = "b804f293e615"
down_revision = "e72c1a04b931"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.drop_constraint("ck_sensors_channel_range", "sensors", type_="check")
    op.create_check_constraint(
        "ck_sensors_channel_range", "sensors", "channel >= 1 AND channel <= 4"
    )
    op.create_table(
        "range_sensor_values",
        sa.Column("ts", sa.DateTime(timezone=True), nullable=False),
        sa.Column("value", sa.Text(), nullable=False),
        sa.Column("sensor_id", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["sensor_id"], ["sensors.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("ts", "sensor_id"),
    )
    op.create_index("ix_range_sensor_values_ts", "range_sensor_values", ["ts"])
    op.create_index("ix_range_sensor_values_sensor_id", "range_sensor_values", ["sensor_id"])


def downgrade() -> None:
    op.drop_index("ix_range_sensor_values_sensor_id", table_name="range_sensor_values")
    op.drop_index("ix_range_sensor_values_ts", table_name="range_sensor_values")
    op.drop_table("range_sensor_values")
    op.drop_constraint("ck_sensors_channel_range", "sensors", type_="check")
    op.create_check_constraint(
        "ck_sensors_channel_range", "sensors", "channel >= 1 AND channel <= 3"
    )
