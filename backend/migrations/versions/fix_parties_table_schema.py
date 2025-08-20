"""Fix parties table schema to match current model

Revision ID: fix_parties_table_schema
Revises: add_template_id_to_invoices
Create Date: 2025-08-20 09:45:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'fix_parties_table_schema'
down_revision = 'add_template_id_to_invoices'
branch_labels = None
depends_on = None


def upgrade():
    # Add missing columns to parties table (with SQLite compatibility)
    try:
        op.add_column('parties', sa.Column('type', sa.String(length=10), nullable=True))
    except Exception:
        pass  # Column might already exist
        
    try:
        op.add_column('parties', sa.Column('gst_registration_status', sa.String(length=20), nullable=True))
    except Exception:
        pass  # Column might already exist
        
    try:
        op.add_column('parties', sa.Column('billing_address_line2', sa.String(length=200), nullable=True))
    except Exception:
        pass  # Column might already exist
        
    try:
        op.add_column('parties', sa.Column('billing_country', sa.String(length=100), nullable=True))
    except Exception:
        pass  # Column might already exist
        
    try:
        op.add_column('parties', sa.Column('shipping_address_line1', sa.String(length=200), nullable=True))
    except Exception:
        pass  # Column might already exist
        
    try:
        op.add_column('parties', sa.Column('shipping_address_line2', sa.String(length=200), nullable=True))
    except Exception:
        pass  # Column might already exist
        
    try:
        op.add_column('parties', sa.Column('shipping_city', sa.String(length=100), nullable=True))
    except Exception:
        pass  # Column might already exist
        
    try:
        op.add_column('parties', sa.Column('shipping_state', sa.String(length=100), nullable=True))
    except Exception:
        pass  # Column might already exist
        
    try:
        op.add_column('parties', sa.Column('shipping_country', sa.String(length=100), nullable=True))
    except Exception:
        pass  # Column might already exist
        
    try:
        op.add_column('parties', sa.Column('shipping_pincode', sa.String(length=10), nullable=True))
    except Exception:
        pass  # Column might already exist
        
    try:
        op.add_column('parties', sa.Column('notes', sa.String(length=500), nullable=True))
    except Exception:
        pass  # Column might already exist
    
    
    # Update existing records with default values
    op.execute("UPDATE parties SET type = 'customer' WHERE type IS NULL")
    op.execute("UPDATE parties SET gst_registration_status = 'GST not registered' WHERE gst_registration_status IS NULL")
    op.execute("UPDATE parties SET billing_country = 'India' WHERE billing_country IS NULL")

    
    # Note: SQLite doesn't support ALTER COLUMN operations, so we can't make columns not nullable
    # The application will handle the validation


def downgrade():
    # Remove added columns (with SQLite compatibility)
    try:
        op.drop_column('parties', 'notes')
    except Exception:
        pass
        
    try:
        op.drop_column('parties', 'shipping_pincode')
    except Exception:
        pass
        
    try:
        op.drop_column('parties', 'shipping_country')
    except Exception:
        pass
        
    try:
        op.drop_column('parties', 'shipping_state')
    except Exception:
        pass
        
    try:
        op.drop_column('parties', 'shipping_city')
    except Exception:
        pass
        
    try:
        op.drop_column('parties', 'shipping_address_line2')
    except Exception:
        pass
        
    try:
        op.drop_column('parties', 'shipping_address_line1')
    except Exception:
        pass
        
    try:
        op.drop_column('parties', 'billing_country')
    except Exception:
        pass
        
    try:
        op.drop_column('parties', 'billing_address_line2')
    except Exception:
        pass
        
    try:
        op.drop_column('parties', 'gst_registration_status')
    except Exception:
        pass
        
    try:
        op.drop_column('parties', 'type')
    except Exception:
        pass
        

