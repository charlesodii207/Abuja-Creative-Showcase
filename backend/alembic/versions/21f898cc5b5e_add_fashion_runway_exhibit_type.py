"""add fashion runway exhibit type

Revision ID: 21f898cc5b5e
Revises: b7e3d5a91c42
Create Date: 2026-10-10 23:16:49.291153

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '21f898cc5b5e'
down_revision: Union[str, Sequence[str], None] = 'b7e3d5a91c42'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # ALTER TYPE ... ADD VALUE can't safely run inside a transaction block
    # on every Postgres version, so run it in autocommit mode.
    with op.get_context().autocommit_block():
        op.execute("ALTER TYPE exhibittype ADD VALUE IF NOT EXISTS 'fashion_runway'")


def downgrade() -> None:
    """Downgrade schema."""
    # Postgres can't drop a single value from an enum type, so this is a
    # deliberate no-op. The extra value is harmless if left in place.
    pass