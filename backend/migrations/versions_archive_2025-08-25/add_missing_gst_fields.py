"""Add missing GST fields to Purchase and PurchaseItem tables

Revision ID: add_missing_gst_fields
Revises: add_purchase_order_management
Create Date: 2025-08-16 08:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'add_missing_gst_fields'
down_revision = 'add_purchase_order_management'
branch_labels = None
depends_on = None


def upgrade():
    # Add missing GST fields to purchases table
    op.add_column('purchases', sa.Column('utgst', sa.Numeric(12, 2), nullable=False, server_default='0'))
    op.add_column('purchases', sa.Column('cess', sa.Numeric(12, 2), nullable=False, server_default='0'))
    op.add_column('purchases', sa.Column('round_off', sa.Numeric(12, 2), nullable=False, server_default='0'))
    
    # Add missing GST fields to purchase_items table
    op.add_column('purchase_items', sa.Column('utgst', sa.Numeric(12, 2), nullable=False, server_default='0'))
    op.add_column('purchase_items', sa.Column('cess', sa.Numeric(12, 2), nullable=False, server_default='0'))


def downgrade():
    # Remove GST fields from purchase_items table
    op.drop_column('purchase_items', 'cess')
    op.drop_column('purchase_items', 'utgst')
    
    # Remove GST fields from purchases table
    op.drop_column('purchases', 'round_off')
    op.drop_column('purchases', 'cess')
    op.drop_column('purchases', 'utgst')
