"""add confirmed status

Revision ID: d5edd68c1adf
Revises: afcb3f6d352b
Create Date: 2026-09-05 01:41:37.502781

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd5edd68c1adf'
down_revision: Union[str, Sequence[str], None] = 'afcb3f6d352b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.execute("ALTER TYPE registrantstatus ADD VALUE IF NOT EXISTS 'confirmed'")


def downgrade() -> None:
    """Downgrade schema."""
    # Postgres doesn't support removing enum values directly.
    pass