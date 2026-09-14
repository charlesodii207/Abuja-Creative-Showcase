"""exhibitor/attendee/pitcher constraint cleanup

Revision ID: a1c9f7d2b4e8
Revises: fc6b393f54e5
Create Date: 2026-09-14 02:10:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'a1c9f7d2b4e8'
down_revision: Union[str, Sequence[str], None] = 'fc6b393f54e5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_unique_constraint(None, 'attendee_details', ['pending_upgrade_reference'])
    op.create_unique_constraint(None, 'attendee_details', ['paystack_reference'])
    op.alter_column('exhibitor_details', 'exhibit_type',
               existing_type=postgresql.ENUM('booth', 'auction', name='exhibittype'),
               nullable=False)
    op.create_unique_constraint(None, 'exhibitor_details', ['paystack_reference'])
    op.drop_column('exhibitor_details', 'wants_auction')
    op.create_unique_constraint(None, 'pitcher_details', ['paystack_reference'])


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_constraint(None, 'pitcher_details', type_='unique')
    op.add_column('exhibitor_details', sa.Column('wants_auction', sa.BOOLEAN(), autoincrement=False, nullable=True))
    op.drop_constraint(None, 'exhibitor_details', type_='unique')
    op.alter_column('exhibitor_details', 'exhibit_type',
               existing_type=postgresql.ENUM('booth', 'auction', name='exhibittype'),
               nullable=True)
    op.drop_constraint(None, 'attendee_details', type_='unique')
    op.drop_constraint(None, 'attendee_details', type_='unique')