"""Initial schema

Revision ID: 001_initial_schema
Revises: 
Create Date: 2025-08-16 08:30:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '001_initial_schema'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # This migration represents the initial database state
    # All tables are already created, so this is a no-op
    pass


def downgrade():
    # This migration represents the initial database state
    # All tables are already created, so this is a no-op
    pass
