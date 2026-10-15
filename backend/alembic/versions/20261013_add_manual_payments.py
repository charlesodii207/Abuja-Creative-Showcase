"""add manual payments

Revision ID: c4d81f2a96e3
Revises: b7e3a91c4d20
Create Date: 2026-10-13

Bank transfer payments: one row per "I've paid" notice, reviewed by an admin.
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "c4d81f2a96e3"
down_revision = "b7e3a91c4d20"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "manual_payments",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "registrant_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("registrants.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("amount_kobo", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(), nullable=False, server_default="pending"),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column("reviewed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "reviewed_by_admin_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("admins.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("reviewed_by_name", sa.String(), nullable=True),
        sa.Column("note", sa.Text(), nullable=True),
    )
    op.create_index("ix_manual_payments_registrant_id", "manual_payments", ["registrant_id"])
    op.create_index("ix_manual_payments_status", "manual_payments", ["status"])
    op.create_index("ix_manual_payments_created_at", "manual_payments", ["created_at"])
    # At most one pending claim per registrant, even if the button is tapped twice.
    op.create_index(
        "uq_manual_payments_one_pending",
        "manual_payments",
        ["registrant_id"],
        unique=True,
        postgresql_where=sa.text("status = 'pending'"),
    )


def downgrade() -> None:
    op.drop_index("uq_manual_payments_one_pending", table_name="manual_payments")
    op.drop_index("ix_manual_payments_created_at", table_name="manual_payments")
    op.drop_index("ix_manual_payments_status", table_name="manual_payments")
    op.drop_index("ix_manual_payments_registrant_id", table_name="manual_payments")
    op.drop_table("manual_payments")