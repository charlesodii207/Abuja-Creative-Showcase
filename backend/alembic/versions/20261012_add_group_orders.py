"""add group orders

Revision ID: 8f3a1c9d2b7e
Revises: 21f898cc5b5e
Create Date: 2026-10-12
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "8f3a1c9d2b7e"
down_revision = "21f898cc5b5e"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "group_orders",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("reference_number", sa.String(), nullable=False),
        sa.Column("access_token", sa.String(), nullable=False),
        sa.Column("buyer_name", sa.String(), nullable=False),
        sa.Column("email", sa.String(), nullable=False),
        sa.Column("phone", sa.String(), nullable=False),
        sa.Column("ticket_type", sa.String(), nullable=False),
        sa.Column("quantity", sa.Integer(), nullable=False),
        sa.Column("unit_amount_kobo", sa.Integer(), nullable=False),
        sa.Column("amount_kobo", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("paid_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_group_orders_reference_number", "group_orders", ["reference_number"], unique=True)
    op.create_index("ix_group_orders_access_token", "group_orders", ["access_token"], unique=True)
    op.create_index("ix_group_orders_email", "group_orders", ["email"])
    op.create_index("ix_group_orders_status", "group_orders", ["status"])

    op.create_table(
        "group_tickets",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "group_order_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("group_orders.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "registrant_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("registrants.id"),
            nullable=False,
        ),
        sa.Column("seq", sa.Integer(), nullable=False),
        sa.Column("assigned_name", sa.String(), nullable=True),
        sa.Column("assigned_email", sa.String(), nullable=True),
        sa.Column("send_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("last_sent_at", sa.DateTime(timezone=True), nullable=True),
        sa.UniqueConstraint("registrant_id"),
        sa.UniqueConstraint("group_order_id", "seq", name="uq_group_tickets_order_seq"),
    )
    op.create_index("ix_group_tickets_group_order_id", "group_tickets", ["group_order_id"])


def downgrade() -> None:
    op.drop_index("ix_group_tickets_group_order_id", table_name="group_tickets")
    op.drop_table("group_tickets")
    op.drop_index("ix_group_orders_status", table_name="group_orders")
    op.drop_index("ix_group_orders_email", table_name="group_orders")
    op.drop_index("ix_group_orders_access_token", table_name="group_orders")
    op.drop_index("ix_group_orders_reference_number", table_name="group_orders")
    op.drop_table("group_orders")