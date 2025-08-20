"""Add template_id to invoices table

Revision ID: add_template_id_to_invoices
Revises: merge_heads
Create Date: 2024-08-18 11:30:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'add_template_id_to_invoices'
down_revision = 'merge_heads'
branch_labels = None
depends_on = None

def upgrade():
    # Add template_id column to invoices table (with SQLite compatibility)
    try:
        op.add_column('invoices', sa.Column('template_id', sa.Integer(), nullable=True))
    except Exception:
        pass  # Column might already exist
    
    # Note: SQLite doesn't support adding foreign key constraints after table creation
    # The foreign key relationship will be handled at the application level

def downgrade():
    # Remove column (with SQLite compatibility)
    try:
        op.drop_column('invoices', 'template_id')
    except Exception:
        pass  # Column might not exist
