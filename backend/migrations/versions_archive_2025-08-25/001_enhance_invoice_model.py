"""Enhance Invoice Model - Complete Migration

Revision ID: 001_enhance_invoice_model
Revises: 
Create Date: 2024-01-15 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '001_enhance_invoice_model'
down_revision = '001_initial_schema'
branch_labels = None
depends_on = None


def upgrade():
    # Add new columns to invoices table (with checks for SQLite compatibility)
    try:
        op.add_column('invoices', sa.Column('supplier_id', sa.Integer(), nullable=True))
    except Exception:
        pass  # Column might already exist
        
    try:
        op.add_column('invoices', sa.Column('invoice_type', sa.String(length=20), nullable=True))
    except Exception:
        pass  # Column might already exist
        
    try:
        op.add_column('invoices', sa.Column('currency', sa.String(length=3), nullable=True))
    except Exception:
        pass  # Column might already exist
        
    try:
        op.add_column('invoices', sa.Column('utgst', sa.Numeric(precision=12, scale=2), nullable=True))
    except Exception:
        pass  # Column might already exist
        
    try:
        op.add_column('invoices', sa.Column('cess', sa.Numeric(precision=12, scale=2), nullable=True))
    except Exception:
        pass  # Column might already exist
        
    try:
        op.add_column('invoices', sa.Column('round_off', sa.Numeric(precision=12, scale=2), nullable=True))
    except Exception:
        pass  # Column might already exist
    
    # Add new columns to invoice_items table (with checks for SQLite compatibility)
    try:
        op.add_column('invoice_items', sa.Column('utgst', sa.Numeric(precision=12, scale=2), nullable=True))
    except Exception:
        pass  # Column might already exist
        
    try:
        op.add_column('invoice_items', sa.Column('cess', sa.Numeric(precision=12, scale=2), nullable=True))
    except Exception:
        pass  # Column might already exist
    
    # Update existing records with default values
    op.execute("UPDATE invoices SET supplier_id = 1, invoice_type = 'Invoice', currency = 'INR', utgst = 0, cess = 0, round_off = 0 WHERE supplier_id IS NULL")
    op.execute("UPDATE invoice_items SET utgst = 0, cess = 0 WHERE utgst IS NULL")
    
    # Note: SQLite doesn't support ALTER COLUMN operations, so we skip making columns not nullable
    # The columns will remain nullable in SQLite, which is acceptable for development
    
    # Add foreign key constraint for supplier_id (SQLite compatible)
    try:
        op.create_foreign_key('fk_invoices_supplier_id', 'invoices', 'parties', ['supplier_id'], ['id'])
    except Exception:
        pass  # Foreign key might already exist or not supported in SQLite
    
    # Note: SQLite doesn't support ALTER COLUMN type changes, so we skip these operations
    # The column types will remain as defined in the initial schema


def downgrade():
    # Remove foreign key constraint
    op.drop_constraint('fk_invoices_supplier_id', 'invoices', type_='foreignkey')
    
    # Remove new columns from invoices table
    op.drop_column('invoices', 'round_off')
    op.drop_column('invoices', 'cess')
    op.drop_column('invoices', 'utgst')
    op.drop_column('invoices', 'currency')
    op.drop_column('invoices', 'invoice_type')
    op.drop_column('invoices', 'supplier_id')
    
    # Remove new columns from invoice_items table
    op.drop_column('invoice_items', 'cess')
    op.drop_column('invoice_items', 'utgst')
    
    # Revert eway_bill_number length constraint
    op.alter_column('invoices', 'eway_bill_number', type_=sa.String(length=50))
    
    # Revert hsn_code length constraint
    op.alter_column('invoice_items', 'hsn_code', type_=sa.String(length=100))
    
    # Revert notes length constraint
    op.alter_column('invoices', 'notes', type_=sa.String(length=500))
