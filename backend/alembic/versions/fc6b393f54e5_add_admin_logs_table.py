"""add admin_logs table

Revision ID: fc6b393f54e5
Revises: a9f3c7d21b44
Create Date: 2026-09-14 01:49:22.337057

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'fc6b393f54e5'
down_revision: Union[str, Sequence[str], None] = 'a9f3c7d21b44'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table('admin_logs',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('admin_id', sa.UUID(), nullable=True),
    sa.Column('admin_name', sa.String(), nullable=True),
    sa.Column('action', sa.String(), nullable=False),
    sa.Column('target_type', sa.String(), nullable=True),
    sa.Column('target_reference', sa.String(), nullable=True),
    sa.Column('detail', sa.Text(), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.ForeignKeyConstraint(['admin_id'], ['admins.id'], ),
    sa.PrimaryKeyConstraint('id')
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table('admin_logs')