"""add vvip ticket tier

Revision ID: c3d9a5e7b2f1
Revises: c4d81f2a96e3
Create Date: 2026-10-23 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = 'c3d9a5e7b2f1'
down_revision: Union[str, Sequence[str], None] = 'c4d81f2a96e3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""

    # New top ticket tier. This one statement covers every column that uses
    # the tickettype enum (attendee_details.ticket_type and
    # attendee_details.pending_upgrade_ticket_type).
    op.execute("ALTER TYPE tickettype ADD VALUE IF NOT EXISTS 'vvip'")


def downgrade() -> None:
    """Downgrade schema."""

    # Postgres cannot remove a single value from an enum type, so 'vvip'
    # stays on tickettype (same as the 'masterclass' migration).
    pass
