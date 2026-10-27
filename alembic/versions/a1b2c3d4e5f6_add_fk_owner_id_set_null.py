"""add_fk_owner_id_set_null

Revision ID: a1b2c3d4e5f6
Revises: 238ead142d0a
Create Date: 2026-10-24 23:13:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = '238ead142d0a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add FK constraints on owner_id with ON DELETE SET NULL."""

    # tickets.owner_id → users.id (SET NULL on user delete)
    op.create_foreign_key(
        'fk_tickets_owner_id_users',
        'tickets', 'users',
        ['owner_id'], ['id'],
        ondelete='SET NULL'
    )

    # documents.owner_id → users.id (SET NULL on user delete)
    op.create_foreign_key(
        'fk_documents_owner_id_users',
        'documents', 'users',
        ['owner_id'], ['id'],
        ondelete='SET NULL'
    )


def downgrade() -> None:
    """Remove FK constraints."""
    op.drop_constraint('fk_documents_owner_id_users', 'documents', type_='foreignkey')
    op.drop_constraint('fk_tickets_owner_id_users', 'tickets', type_='foreignkey')

