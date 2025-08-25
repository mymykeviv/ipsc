"""Fix company_settings schema by adding missing gst_enabled_by_default column

Revision ID: fix_company_settings_schema
Revises: add_missing_gst_fields
Create Date: 2025-08-21 10:45:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'fix_company_settings_schema'
down_revision = 'add_missing_gst_fields'
branch_labels = None
depends_on = None


def upgrade():
    # Add missing gst_enabled_by_default column to company_settings table
    op.add_column('company_settings', sa.Column('gst_enabled_by_default', sa.Boolean(), nullable=True, server_default='true'))
    
    # Add missing require_gstin_validation column if it doesn't exist
    try:
        op.add_column('company_settings', sa.Column('require_gstin_validation', sa.Boolean(), nullable=True, server_default='false'))
    except Exception:
        # Column might already exist, ignore error
        pass


def downgrade():
    # Remove the columns we added
    try:
        op.drop_column('company_settings', 'require_gstin_validation')
    except Exception:
        pass
    
    try:
        op.drop_column('company_settings', 'gst_enabled_by_default')
    except Exception:
        pass
