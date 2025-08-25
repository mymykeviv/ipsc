"""Add is_active column to parties table

Revision ID: add_is_active_to_parties
Revises: fix_parties_table_schema
Create Date: 2025-08-20 09:47:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'add_is_active_to_parties'
down_revision = 'fix_parties_table_schema'
branch_labels = None
depends_on = None


def upgrade():
    # Add is_active column to parties table (with SQLite compatibility)
    try:
        op.add_column('parties', sa.Column('is_active', sa.Boolean(), nullable=True))
    except Exception:
        pass  # Column might already exist
    
    # Update existing records with default value
    op.execute("UPDATE parties SET is_active = 1 WHERE is_active IS NULL")


def downgrade():
    # Remove is_active column (with SQLite compatibility)
    try:
        op.drop_column('parties', 'is_active')
    except Exception:
        pass  # Column might not exist
