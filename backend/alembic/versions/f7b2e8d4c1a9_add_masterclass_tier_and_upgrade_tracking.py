"""add masterclass ticket tier and upgrade tracking fields

Revision ID: f7b2e8d4c1a9
Revises: a1f4c9e2b7d3
Create Date: 2026-09-12 22:45:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f7b2e8d4c1a9'
down_revision: Union[str, Sequence[str], None] = 'a1f4c9e2b7d3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""

    # Masterclass becomes its own ticket tier (general -> vip -> masterclass),
    # rather than a separate boolean add-on.
    op.execute("ALTER TYPE tickettype ADD VALUE IF NOT EXISTS 'masterclass'")

    # Tracks an in-progress ticket upgrade payment separately from the
    # original ticket purchase, so /payments/verify can tell the two
    # apart and only flips ticket_type once the upgrade is actually paid.
    op.add_column(
        'attendee_details',
        sa.Column('pending_upgrade_ticket_type', sa.Enum('general', 'vip', 'masterclass', name='tickettype', create_type=False), nullable=True),
    )
    op.add_column(
        'attendee_details',
        sa.Column('pending_upgrade_reference', sa.String(), nullable=True),
    )
    op.create_unique_constraint(
        'uq_attendee_details_pending_upgrade_reference',
        'attendee_details',
        ['pending_upgrade_reference'],
    )


def downgrade() -> None:
    """Downgrade schema."""

    op.drop_constraint(
        'uq_attendee_details_pending_upgrade_reference', 'attendee_details', type_='unique'
    )
    op.drop_column('attendee_details', 'pending_upgrade_reference')
    op.drop_column('attendee_details', 'pending_upgrade_ticket_type')

    # Note: as with 'awaiting_payment' in the previous migration, Postgres
    # does not support removing a single value from an enum type, so the
    # 'masterclass' value on tickettype is not removed here.
