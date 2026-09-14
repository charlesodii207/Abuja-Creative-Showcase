"""add ondelete set null to admin fks

Revision ID: 7e99cac09635
Revises: a1c9f7d2b4e8
Create Date: 2026-09-14 09:46:06.420808

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '7e99cac09635'
down_revision: Union[str, Sequence[str], None] = 'a1c9f7d2b4e8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.drop_constraint('admins_created_by_fkey', 'admins', type_='foreignkey')
    op.create_foreign_key(
        'admins_created_by_fkey', 'admins', 'admins',
        ['created_by'], ['id'], ondelete='SET NULL'
    )
    op.drop_constraint('admin_logs_admin_id_fkey', 'admin_logs', type_='foreignkey')
    op.create_foreign_key(
        'admin_logs_admin_id_fkey', 'admin_logs', 'admins',
        ['admin_id'], ['id'], ondelete='SET NULL'
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_constraint('admin_logs_admin_id_fkey', 'admin_logs', type_='foreignkey')
    op.create_foreign_key(
        'admin_logs_admin_id_fkey', 'admin_logs', 'admins',
        ['admin_id'], ['id']
    )
    op.drop_constraint('admins_created_by_fkey', 'admins', type_='foreignkey')
    op.create_foreign_key(
        'admins_created_by_fkey', 'admins', 'admins',
        ['created_by'], ['id']
    )