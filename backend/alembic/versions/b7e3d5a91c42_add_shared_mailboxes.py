"""add shared mailboxes, email threading and mail sync state

Revision ID: b7e3d5a91c42
Revises: 4775dbc3c1a4
Create Date: 2026-10-09 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'b7e3d5a91c42'
down_revision: Union[str, Sequence[str], None] = '4775dbc3c1a4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""

    # --- Mailbox grants on admins (nobody gets any automatically) ---
    op.add_column('admins', sa.Column(
        'mailboxes_read', postgresql.ARRAY(sa.String()), nullable=False, server_default='{}'))
    op.add_column('admins', sa.Column(
        'mailboxes_send', postgresql.ARRAY(sa.String()), nullable=False, server_default='{}'))

    # --- Threads ---
    op.add_column('contact_threads', sa.Column('mailbox', sa.String(), nullable=True))
    op.add_column('contact_threads', sa.Column(
        'channel', sa.String(), nullable=False, server_default='form'))
    op.create_index(op.f('ix_contact_threads_mailbox'), 'contact_threads', ['mailbox'], unique=False)

    # --- Messages ---
    op.add_column('contact_messages', sa.Column('mailbox', sa.String(), nullable=True))
    op.add_column('contact_messages', sa.Column('direction', sa.String(), nullable=True))
    op.add_column('contact_messages', sa.Column('message_id', sa.String(), nullable=True))
    op.add_column('contact_messages', sa.Column('in_reply_to', sa.String(), nullable=True))
    op.add_column('contact_messages', sa.Column('references_header', sa.Text(), nullable=True))
    op.add_column('contact_messages', sa.Column('to_addresses', sa.Text(), nullable=True))
    op.add_column('contact_messages', sa.Column('cc_addresses', sa.Text(), nullable=True))
    op.add_column('contact_messages', sa.Column('body_html', sa.Text(), nullable=True))
    op.add_column('contact_messages', sa.Column('imap_uid', sa.BigInteger(), nullable=True))
    op.create_index(op.f('ix_contact_messages_mailbox'), 'contact_messages', ['mailbox'], unique=False)
    op.create_unique_constraint(
        'uq_contact_messages_mailbox_message_id', 'contact_messages', ['mailbox', 'message_id'])

    # --- Sync bookkeeping (one row per mailbox) ---
    op.create_table(
        'mail_sync_state',
        sa.Column('mailbox', sa.String(), nullable=False),
        sa.Column('uidvalidity', sa.BigInteger(), nullable=True),
        sa.Column('last_uid', sa.BigInteger(), nullable=False, server_default='0'),
        sa.Column('last_synced_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('last_error', sa.Text(), nullable=True),
        sa.PrimaryKeyConstraint('mailbox'),
    )

    # --- Backfill: everything that exists today came through the website form -> info ---
    op.execute("UPDATE contact_threads SET mailbox = 'info' WHERE mailbox IS NULL")
    op.execute(
        "UPDATE contact_messages SET mailbox = 'info', "
        "direction = CASE WHEN sender_type = 'visitor' THEN 'inbound' ELSE 'outbound' END "
        "WHERE mailbox IS NULL"
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table('mail_sync_state')

    op.drop_constraint('uq_contact_messages_mailbox_message_id', 'contact_messages', type_='unique')
    op.drop_index(op.f('ix_contact_messages_mailbox'), table_name='contact_messages')
    for col in ('imap_uid', 'body_html', 'cc_addresses', 'to_addresses', 'references_header',
                'in_reply_to', 'message_id', 'direction', 'mailbox'):
        op.drop_column('contact_messages', col)

    op.drop_index(op.f('ix_contact_threads_mailbox'), table_name='contact_threads')
    op.drop_column('contact_threads', 'channel')
    op.drop_column('contact_threads', 'mailbox')

    op.drop_column('admins', 'mailboxes_send')
    op.drop_column('admins', 'mailboxes_read')