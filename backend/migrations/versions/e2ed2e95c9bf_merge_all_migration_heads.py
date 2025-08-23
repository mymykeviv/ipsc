"""merge_all_migration_heads

Revision ID: e2ed2e95c9bf
Revises: 004, 4edced70000b
Create Date: 2025-08-23 09:51:49.604676

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'e2ed2e95c9bf'
down_revision = ('004', '4edced70000b')
branch_labels = None
depends_on = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
