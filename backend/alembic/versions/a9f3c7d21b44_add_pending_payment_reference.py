"""add pending_payment_reference

Revision ID: a9f3c7d21b44
Revises: 55dcf94b01e9
Create Date: 2026-09-13 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'a9f3c7d21b44'
down_revision = '55dcf94b01e9'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        'attendee_details',
        sa.Column('pending_payment_reference', sa.String(), nullable=True)
    )
    op.create_unique_constraint(
        'uq_attendee_details_pending_payment_reference',
        'attendee_details',
        ['pending_payment_reference']
    )


def downgrade() -> None:
    op.drop_constraint(
        'uq_attendee_details_pending_payment_reference',
        'attendee_details',
        type_='unique'
    )
    op.drop_column('attendee_details', 'pending_payment_reference')