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
    # Create all base tables
    op.create_table('company_settings',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('gstin', sa.String(length=15), nullable=True),
        sa.Column('state', sa.String(length=50), nullable=True),
        sa.Column('state_code', sa.String(length=2), nullable=True),
        sa.Column('invoice_series', sa.String(length=10), nullable=True),
        sa.Column('gst_enabled_by_default', sa.Boolean(), nullable=True),
        sa.Column('require_gstin_validation', sa.Boolean(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    
    op.create_table('users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('username', sa.String(length=50), nullable=False),
        sa.Column('password_hash', sa.String(length=255), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('role_id', sa.Integer(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('username')
    )
    
    op.create_table('parties',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('gstin', sa.String(length=15), nullable=True),
        sa.Column('gst_enabled', sa.Boolean(), nullable=True),
        sa.Column('contact_person', sa.String(length=100), nullable=True),
        sa.Column('contact_number', sa.String(length=20), nullable=True),
        sa.Column('email', sa.String(length=100), nullable=True),
        sa.Column('billing_address_line1', sa.String(length=200), nullable=True),
        sa.Column('billing_city', sa.String(length=50), nullable=True),
        sa.Column('billing_state', sa.String(length=50), nullable=True),
        sa.Column('billing_pincode', sa.String(length=10), nullable=True),
        sa.Column('is_customer', sa.Boolean(), nullable=True),
        sa.Column('is_vendor', sa.Boolean(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    
    op.create_table('products',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('item_type', sa.String(length=20), nullable=True),
        sa.Column('sales_price', sa.Numeric(precision=12, scale=2), nullable=True),
        sa.Column('purchase_price', sa.Numeric(precision=12, scale=2), nullable=True),
        sa.Column('stock', sa.Integer(), nullable=True),
        sa.Column('sku', sa.String(length=50), nullable=True),
        sa.Column('unit', sa.String(length=20), nullable=True),
        sa.Column('supplier', sa.String(length=100), nullable=True),
        sa.Column('category', sa.String(length=50), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('hsn', sa.String(length=10), nullable=True),
        sa.Column('gst_rate', sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    
    op.create_table('invoices',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('invoice_no', sa.String(length=50), nullable=False),
        sa.Column('date', sa.Date(), nullable=False),
        sa.Column('customer_id', sa.Integer(), nullable=True),
        sa.Column('due_date', sa.Date(), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=True),
        sa.Column('subtotal', sa.Numeric(precision=12, scale=2), nullable=True),
        sa.Column('cgst', sa.Numeric(precision=12, scale=2), nullable=True),
        sa.Column('sgst', sa.Numeric(precision=12, scale=2), nullable=True),
        sa.Column('igst', sa.Numeric(precision=12, scale=2), nullable=True),
        sa.Column('total', sa.Numeric(precision=12, scale=2), nullable=True),
        sa.Column('eway_bill_number', sa.String(length=50), nullable=True),
        sa.Column('notes', sa.String(length=500), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    
    op.create_table('invoice_items',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('invoice_id', sa.Integer(), nullable=True),
        sa.Column('product_id', sa.Integer(), nullable=True),
        sa.Column('description', sa.String(length=200), nullable=True),
        sa.Column('quantity', sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column('unit_price', sa.Numeric(precision=12, scale=2), nullable=True),
        sa.Column('cgst', sa.Numeric(precision=12, scale=2), nullable=True),
        sa.Column('sgst', sa.Numeric(precision=12, scale=2), nullable=True),
        sa.Column('igst', sa.Numeric(precision=12, scale=2), nullable=True),
        sa.Column('total', sa.Numeric(precision=12, scale=2), nullable=True),
        sa.Column('hsn_code', sa.String(length=100), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    
    op.create_table('purchases',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('purchase_no', sa.String(length=50), nullable=False),
        sa.Column('date', sa.Date(), nullable=False),
        sa.Column('vendor_id', sa.Integer(), nullable=True),
        sa.Column('due_date', sa.Date(), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=True),
        sa.Column('subtotal', sa.Numeric(precision=12, scale=2), nullable=True),
        sa.Column('cgst', sa.Numeric(precision=12, scale=2), nullable=True),
        sa.Column('sgst', sa.Numeric(precision=12, scale=2), nullable=True),
        sa.Column('igst', sa.Numeric(precision=12, scale=2), nullable=True),
        sa.Column('total', sa.Numeric(precision=12, scale=2), nullable=True),
        sa.Column('notes', sa.String(length=500), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    
    op.create_table('purchase_items',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('purchase_id', sa.Integer(), nullable=True),
        sa.Column('product_id', sa.Integer(), nullable=True),
        sa.Column('description', sa.String(length=200), nullable=True),
        sa.Column('quantity', sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column('unit_price', sa.Numeric(precision=12, scale=2), nullable=True),
        sa.Column('cgst', sa.Numeric(precision=12, scale=2), nullable=True),
        sa.Column('sgst', sa.Numeric(precision=12, scale=2), nullable=True),
        sa.Column('igst', sa.Numeric(precision=12, scale=2), nullable=True),
        sa.Column('total', sa.Numeric(precision=12, scale=2), nullable=True),
        sa.Column('hsn_code', sa.String(length=100), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    
    op.create_table('payments',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('invoice_id', sa.Integer(), nullable=True),
        sa.Column('amount', sa.Numeric(precision=12, scale=2), nullable=True),
        sa.Column('payment_date', sa.Date(), nullable=True),
        sa.Column('payment_method', sa.String(length=50), nullable=True),
        sa.Column('reference_number', sa.String(length=100), nullable=True),
        sa.Column('notes', sa.String(length=500), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    
    op.create_table('purchase_payments',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('purchase_id', sa.Integer(), nullable=True),
        sa.Column('amount', sa.Numeric(precision=12, scale=2), nullable=True),
        sa.Column('payment_date', sa.Date(), nullable=True),
        sa.Column('payment_method', sa.String(length=50), nullable=True),
        sa.Column('reference_number', sa.String(length=100), nullable=True),
        sa.Column('notes', sa.String(length=500), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    
    op.create_table('expenses',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('description', sa.String(length=200), nullable=False),
        sa.Column('amount', sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column('expense_date', sa.Date(), nullable=False),
        sa.Column('payment_method', sa.String(length=50), nullable=True),
        sa.Column('account_head', sa.String(length=100), nullable=True),
        sa.Column('reference_number', sa.String(length=100), nullable=True),
        sa.Column('vendor_id', sa.Integer(), nullable=True),
        sa.Column('gst_rate', sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column('notes', sa.String(length=500), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    
    op.create_table('stock_ledger_entries',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('product_id', sa.Integer(), nullable=True),
        sa.Column('entry_type', sa.String(length=20), nullable=True),
        sa.Column('qty', sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column('purchase_price', sa.Numeric(precision=12, scale=2), nullable=True),
        sa.Column('sales_price', sa.Numeric(precision=12, scale=2), nullable=True),
        sa.Column('date_of_receipt', sa.Date(), nullable=True),
        sa.Column('reference_bill_number', sa.String(length=100), nullable=True),
        sa.Column('notes', sa.String(length=500), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )


def downgrade():
    # Drop all tables in reverse order
    op.drop_table('stock_ledger_entries')
    op.drop_table('expenses')
    op.drop_table('purchase_payments')
    op.drop_table('payments')
    op.drop_table('purchase_items')
    op.drop_table('purchases')
    op.drop_table('invoice_items')
    op.drop_table('invoices')
    op.drop_table('products')
    op.drop_table('parties')
    op.drop_table('users')
    op.drop_table('company_settings')
