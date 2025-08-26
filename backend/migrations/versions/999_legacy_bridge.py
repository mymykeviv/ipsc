"""legacy bridge for historical revision 999

Revision ID: 999
Revises: 
Create Date: 2025-08-26 12:15:00.000000

This migration intentionally performs no schema changes. It exists only to
bridge legacy databases that were stamped with revision '999' so that
"alembic upgrade head" can proceed to the new baseline.
"""
from alembic import op  # noqa: F401
import sqlalchemy as sa  # noqa: F401

# revision identifiers, used by Alembic.
revision = '999'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # No-op: this is just a placeholder to allow upgrades from legacy DBs
    pass


def downgrade() -> None:
    # No-op: nothing to downgrade; this is a bridge only
    pass
