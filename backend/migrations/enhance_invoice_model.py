"""Enhance Invoice Model

Revision ID: enhance_invoice_model
Revises: add_invoice_enhancements
Create Date: 2024-01-15 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'enhance_invoice_model'
down_revision = 'add_invoice_enhancements'
branch_labels = None
depends_on = None


def upgrade():
    # Add new columns to invoices table
    op.add_column('invoices', sa.Column('supplier_id', sa.Integer(), nullable=True))
    op.add_column('invoices', sa.Column('invoice_type', sa.String(length=20), nullable=True))
    op.add_column('invoices', sa.Column('currency', sa.String(length=3), nullable=True))
    op.add_column('invoices', sa.Column('utgst', sa.Numeric(precision=12, scale=2), nullable=True))
    op.add_column('invoices', sa.Column('cess', sa.Numeric(precision=12, scale=2), nullable=True))
    op.add_column('invoices', sa.Column('round_off', sa.Numeric(precision=12, scale=2), nullable=True))
    
    # Add new columns to invoice_items table
    op.add_column('invoice_items', sa.Column('utgst', sa.Numeric(precision=12, scale=2), nullable=True))
    op.add_column('invoice_items', sa.Column('cess', sa.Numeric(precision=12, scale=2), nullable=True))
    
    # Update existing records with default values
    op.execute("UPDATE invoices SET supplier_id = 1, invoice_type = 'Invoice', currency = 'INR', utgst = 0, cess = 0, round_off = 0 WHERE supplier_id IS NULL")
    op.execute("UPDATE invoice_items SET utgst = 0, cess = 0 WHERE utgst IS NULL")
    
    # Make columns not nullable after setting default values
    op.alter_column('invoices', 'supplier_id', nullable=False)
    op.alter_column('invoices', 'invoice_type', nullable=False)
    op.alter_column('invoices', 'currency', nullable=False)
    op.alter_column('invoices', 'utgst', nullable=False)
    op.alter_column('invoices', 'cess', nullable=False)
    op.alter_column('invoices', 'round_off', nullable=False)
    op.alter_column('invoice_items', 'utgst', nullable=False)
    op.alter_column('invoice_items', 'cess', nullable=False)
    
    # Add foreign key constraint for supplier_id
    op.create_foreign_key('fk_invoices_supplier_id', 'invoices', 'parties', ['supplier_id'], ['id'])
    
    # Update eway_bill_number length constraint
    op.alter_column('invoices', 'eway_bill_number', type_=sa.String(length=15))
    
    # Update hsn_code length constraint in invoice_items
    op.alter_column('invoice_items', 'hsn_code', type_=sa.String(length=10))


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
