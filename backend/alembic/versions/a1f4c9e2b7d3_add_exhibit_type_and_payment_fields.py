"""add exhibit type and payment tracking fields

Revision ID: a1f4c9e2b7d3
Revises: 93c839890c58
Create Date: 2026-09-12 22:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1f4c9e2b7d3'
down_revision: Union[str, Sequence[str], None] = '93c839890c58'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""

    # --- New enum values on existing types ---
    # Postgres requires ADD VALUE to run outside the transaction that
    # then uses it — safe here since nothing in this migration reads
    # the new value back.
    op.execute("ALTER TYPE registrantstatus ADD VALUE IF NOT EXISTS 'awaiting_payment'")

    # --- New enum type for exhibit_type ---
    op.execute("CREATE TYPE exhibittype AS ENUM ('booth', 'auction')")

    # --- exhibitor_details: exhibit_type replaces wants_auction as the
    # either/or choice between buying a booth or auctioning an item ---
    op.add_column(
        'exhibitor_details',
        sa.Column('exhibit_type', sa.Enum('booth', 'auction', name='exhibittype', create_type=False), nullable=True),
    )

    # --- Payment tracking columns ---
    op.add_column('attendee_details', sa.Column('amount_kobo', sa.Integer(), nullable=True))
    op.add_column('attendee_details', sa.Column('paystack_reference', sa.String(), nullable=True))
    op.create_unique_constraint(
        'uq_attendee_details_paystack_reference', 'attendee_details', ['paystack_reference']
    )

    op.add_column('exhibitor_details', sa.Column('amount_kobo', sa.Integer(), nullable=True))
    op.add_column('exhibitor_details', sa.Column('paystack_reference', sa.String(), nullable=True))
    op.create_unique_constraint(
        'uq_exhibitor_details_paystack_reference', 'exhibitor_details', ['paystack_reference']
    )

    op.add_column('pitcher_details', sa.Column('is_paid', sa.Boolean(), nullable=True))
    op.add_column('pitcher_details', sa.Column('amount_kobo', sa.Integer(), nullable=True))
    op.add_column('pitcher_details', sa.Column('paystack_reference', sa.String(), nullable=True))
    op.create_unique_constraint(
        'uq_pitcher_details_paystack_reference', 'pitcher_details', ['paystack_reference']
    )


def downgrade() -> None:
    """Downgrade schema."""

    op.drop_constraint('uq_pitcher_details_paystack_reference', 'pitcher_details', type_='unique')
    op.drop_column('pitcher_details', 'paystack_reference')
    op.drop_column('pitcher_details', 'amount_kobo')
    op.drop_column('pitcher_details', 'is_paid')

    op.drop_constraint('uq_exhibitor_details_paystack_reference', 'exhibitor_details', type_='unique')
    op.drop_column('exhibitor_details', 'paystack_reference')
    op.drop_column('exhibitor_details', 'amount_kobo')

    op.drop_constraint('uq_attendee_details_paystack_reference', 'attendee_details', type_='unique')
    op.drop_column('attendee_details', 'paystack_reference')
    op.drop_column('attendee_details', 'amount_kobo')

    op.drop_column('exhibitor_details', 'exhibit_type')
    op.execute("DROP TYPE exhibittype")

    # Note: Postgres does not support removing a value from an enum type
    # directly. Downgrading past the 'awaiting_payment' status value would
    # require recreating the registrantstatus type from scratch — not
    # done here since it's destructive and rarely actually needed.
