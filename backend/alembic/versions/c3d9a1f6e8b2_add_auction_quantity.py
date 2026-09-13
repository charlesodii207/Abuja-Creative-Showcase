"""add auction quantity to exhibitor details

Revision ID: c3d9a1f6e8b2
Revises: f7b2e8d4c1a9
Create Date: 2026-09-13 00:15:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c3d9a1f6e8b2'
down_revision: Union[str, Sequence[str], None] = 'f7b2e8d4c1a9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('exhibitor_details', sa.Column('auction_quantity', sa.Integer(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('exhibitor_details', 'auction_quantity')