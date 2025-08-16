"""Add GST Toggle System

Revision ID: 0018
Revises: 0017
Create Date: 2024-01-15 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import sqlite

# revision identifiers, used by Alembic.
revision = '0018'
down_revision = '0017'
branch_labels = None
depends_on = None


def upgrade():
    # Add GST system settings to company_settings table
    op.add_column('company_settings', sa.Column('gst_enabled_by_default', sa.Boolean(), nullable=False, server_default='1'))
    op.add_column('company_settings', sa.Column('require_gstin_validation', sa.Boolean(), nullable=False, server_default='1'))
    
    # Add GST enabled field to parties table
    op.add_column('parties', sa.Column('gst_enabled', sa.Boolean(), nullable=False, server_default='1'))


def downgrade():
    # Remove GST system settings from company_settings table
    op.drop_column('company_settings', 'gst_enabled_by_default')
    op.drop_column('company_settings', 'require_gstin_validation')
    
    # Remove GST enabled field from parties table
    op.drop_column('parties', 'gst_enabled')
