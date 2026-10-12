"""add attachments column to contact_messages

Revision ID: b7e3a91c4d20
Revises: 8f3a1c9d2b7e
Create Date: 2026-10-12

Outbound emails can now carry attachments. Only the details of each file
(filename, size, content type) are stored; the files are emailed, not kept.
"""
from alembic import op
import sqlalchemy as sa


revision = "b7e3a91c4d20"
down_revision = "8f3a1c9d2b7e"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "contact_messages",
        sa.Column("attachments", sa.JSON(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("contact_messages", "attachments")