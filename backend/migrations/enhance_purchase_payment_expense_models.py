"""Enhance Purchase, Payment, and Expense Models

Revision ID: enhance_purchase_payment_expense
Revises: add_payment_management
Create Date: 2024-01-15 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'enhance_purchase_payment_expense'
down_revision = 'add_payment_management'
branch_labels = None
depends_on = None


def upgrade():
    # Add new columns to purchases table
    op.add_column('purchases', sa.Column('purchase_no', sa.String(length=16), nullable=True))
    op.add_column('purchases', sa.Column('due_date', sa.DateTime(), nullable=True))
    op.add_column('purchases', sa.Column('terms', sa.String(length=20), nullable=True))
    op.add_column('purchases', sa.Column('place_of_supply', sa.String(length=100), nullable=True))
    op.add_column('purchases', sa.Column('place_of_supply_state_code', sa.String(length=10), nullable=True))
    op.add_column('purchases', sa.Column('eway_bill_number', sa.String(length=50), nullable=True))
    op.add_column('purchases', sa.Column('reverse_charge', sa.Boolean(), nullable=True))
    op.add_column('purchases', sa.Column('export_supply', sa.Boolean(), nullable=True))
    op.add_column('purchases', sa.Column('bill_from_address', sa.String(length=200), nullable=True))
    op.add_column('purchases', sa.Column('ship_from_address', sa.String(length=200), nullable=True))
    op.add_column('purchases', sa.Column('total_discount', sa.Numeric(precision=12, scale=2), nullable=True))
    op.add_column('purchases', sa.Column('cgst', sa.Numeric(precision=12, scale=2), nullable=True))
    op.add_column('purchases', sa.Column('sgst', sa.Numeric(precision=12, scale=2), nullable=True))
    op.add_column('purchases', sa.Column('igst', sa.Numeric(precision=12, scale=2), nullable=True))
    op.add_column('purchases', sa.Column('grand_total', sa.Numeric(precision=12, scale=2), nullable=True))
    op.add_column('purchases', sa.Column('paid_amount', sa.Numeric(precision=12, scale=2), nullable=True))
    op.add_column('purchases', sa.Column('balance_amount', sa.Numeric(precision=12, scale=2), nullable=True))
    op.add_column('purchases', sa.Column('notes', sa.String(length=200), nullable=True))
    op.add_column('purchases', sa.Column('status', sa.String(length=20), nullable=True))
    op.add_column('purchases', sa.Column('created_at', sa.DateTime(), nullable=True))
    op.add_column('purchases', sa.Column('updated_at', sa.DateTime(), nullable=True))
    
    # Add new columns to purchase_items table
    op.add_column('purchase_items', sa.Column('description', sa.String(length=200), nullable=True))
    op.add_column('purchase_items', sa.Column('hsn_code', sa.String(length=100), nullable=True))
    op.add_column('purchase_items', sa.Column('discount', sa.Numeric(precision=12, scale=2), nullable=True))
    op.add_column('purchase_items', sa.Column('discount_type', sa.String(length=20), nullable=True))
    op.add_column('purchase_items', sa.Column('taxable_value', sa.Numeric(precision=12, scale=2), nullable=True))
    op.add_column('purchase_items', sa.Column('gst_rate', sa.Float(), nullable=True))
    op.add_column('purchase_items', sa.Column('cgst', sa.Numeric(precision=12, scale=2), nullable=True))
    op.add_column('purchase_items', sa.Column('sgst', sa.Numeric(precision=12, scale=2), nullable=True))
    op.add_column('purchase_items', sa.Column('igst', sa.Numeric(precision=12, scale=2), nullable=True))
    
    # Add account_head column to payments table
    op.add_column('payments', sa.Column('account_head', sa.String(length=50), nullable=True))
    
    # Create purchase_payments table
    op.create_table('purchase_payments',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('purchase_id', sa.Integer(), nullable=False),
        sa.Column('payment_date', sa.DateTime(), nullable=False),
        sa.Column('payment_amount', sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column('payment_method', sa.String(length=50), nullable=False),
        sa.Column('account_head', sa.String(length=50), nullable=False),
        sa.Column('reference_number', sa.String(length=100), nullable=True),
        sa.Column('notes', sa.String(length=200), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['purchase_id'], ['purchases.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create expenses table
    op.create_table('expenses',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('expense_date', sa.DateTime(), nullable=False),
        sa.Column('expense_type', sa.String(length=100), nullable=False),
        sa.Column('category', sa.String(length=100), nullable=False),
        sa.Column('subcategory', sa.String(length=100), nullable=True),
        sa.Column('description', sa.String(length=200), nullable=False),
        sa.Column('amount', sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column('payment_method', sa.String(length=50), nullable=False),
        sa.Column('account_head', sa.String(length=50), nullable=False),
        sa.Column('reference_number', sa.String(length=100), nullable=True),
        sa.Column('vendor_id', sa.Integer(), nullable=True),
        sa.Column('gst_amount', sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column('gst_rate', sa.Float(), nullable=False),
        sa.Column('total_amount', sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column('notes', sa.String(length=500), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['vendor_id'], ['parties.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Set default values for existing records
    op.execute("UPDATE purchases SET purchase_no = CONCAT('PUR-', LPAD(id::text, 5, '0')) WHERE purchase_no IS NULL")
    op.execute("UPDATE purchases SET due_date = date WHERE due_date IS NULL")
    op.execute("UPDATE purchases SET terms = 'Due on Receipt' WHERE terms IS NULL")
    op.execute("UPDATE purchases SET place_of_supply = 'Karnataka' WHERE place_of_supply IS NULL")
    op.execute("UPDATE purchases SET place_of_supply_state_code = '29' WHERE place_of_supply_state_code IS NULL")
    op.execute("UPDATE purchases SET reverse_charge = false WHERE reverse_charge IS NULL")
    op.execute("UPDATE purchases SET export_supply = false WHERE export_supply IS NULL")
    op.execute("UPDATE purchases SET bill_from_address = 'Vendor Address' WHERE bill_from_address IS NULL")
    op.execute("UPDATE purchases SET ship_from_address = 'Vendor Address' WHERE ship_from_address IS NULL")
    op.execute("UPDATE purchases SET total_discount = 0 WHERE total_discount IS NULL")
    op.execute("UPDATE purchases SET cgst = 0 WHERE cgst IS NULL")
    op.execute("UPDATE purchases SET sgst = 0 WHERE sgst IS NULL")
    op.execute("UPDATE purchases SET igst = 0 WHERE igst IS NULL")
    op.execute("UPDATE purchases SET grand_total = total WHERE grand_total IS NULL")
    op.execute("UPDATE purchases SET paid_amount = 0 WHERE paid_amount IS NULL")
    op.execute("UPDATE purchases SET balance_amount = total WHERE balance_amount IS NULL")
    op.execute("UPDATE purchases SET status = 'Draft' WHERE status IS NULL")
    op.execute("UPDATE purchases SET created_at = NOW() WHERE created_at IS NULL")
    op.execute("UPDATE purchases SET updated_at = NOW() WHERE updated_at IS NULL")
    
    # Set default values for purchase_items
    op.execute("UPDATE purchase_items SET description = 'Product' WHERE description IS NULL")
    op.execute("UPDATE purchase_items SET discount = 0 WHERE discount IS NULL")
    op.execute("UPDATE purchase_items SET discount_type = 'Percentage' WHERE discount_type IS NULL")
    op.execute("UPDATE purchase_items SET taxable_value = amount WHERE taxable_value IS NULL")
    op.execute("UPDATE purchase_items SET gst_rate = 0 WHERE gst_rate IS NULL")
    op.execute("UPDATE purchase_items SET cgst = 0 WHERE cgst IS NULL")
    op.execute("UPDATE purchase_items SET sgst = 0 WHERE sgst IS NULL")
    op.execute("UPDATE purchase_items SET igst = 0 WHERE igst IS NULL")
    
    # Set default values for payments
    op.execute("UPDATE payments SET account_head = 'Cash' WHERE account_head IS NULL")
    
    # Make columns not nullable after setting defaults
    op.alter_column('purchases', 'purchase_no', nullable=False)
    op.alter_column('purchases', 'due_date', nullable=False)
    op.alter_column('purchases', 'terms', nullable=False)
    op.alter_column('purchases', 'place_of_supply', nullable=False)
    op.alter_column('purchases', 'place_of_supply_state_code', nullable=False)
    op.alter_column('purchases', 'reverse_charge', nullable=False)
    op.alter_column('purchases', 'export_supply', nullable=False)
    op.alter_column('purchases', 'bill_from_address', nullable=False)
    op.alter_column('purchases', 'ship_from_address', nullable=False)
    op.alter_column('purchases', 'total_discount', nullable=False)
    op.alter_column('purchases', 'cgst', nullable=False)
    op.alter_column('purchases', 'sgst', nullable=False)
    op.alter_column('purchases', 'igst', nullable=False)
    op.alter_column('purchases', 'grand_total', nullable=False)
    op.alter_column('purchases', 'paid_amount', nullable=False)
    op.alter_column('purchases', 'balance_amount', nullable=False)
    op.alter_column('purchases', 'status', nullable=False)
    op.alter_column('purchases', 'created_at', nullable=False)
    op.alter_column('purchases', 'updated_at', nullable=False)
    
    op.alter_column('purchase_items', 'description', nullable=False)
    op.alter_column('purchase_items', 'discount', nullable=False)
    op.alter_column('purchase_items', 'discount_type', nullable=False)
    op.alter_column('purchase_items', 'taxable_value', nullable=False)
    op.alter_column('purchase_items', 'gst_rate', nullable=False)
    op.alter_column('purchase_items', 'cgst', nullable=False)
    op.alter_column('purchase_items', 'sgst', nullable=False)
    op.alter_column('purchase_items', 'igst', nullable=False)
    
    op.alter_column('payments', 'account_head', nullable=False)
    
    # Create unique constraint on purchase_no
    op.create_unique_constraint('uq_purchases_purchase_no', 'purchases', ['purchase_no'])


def downgrade():
    # Drop unique constraint
    op.drop_constraint('uq_purchases_purchase_no', 'purchases', type_='unique')
    
    # Drop tables
    op.drop_table('expenses')
    op.drop_table('purchase_payments')
    
    # Drop columns from payments
    op.drop_column('payments', 'account_head')
    
    # Drop columns from purchase_items
    op.drop_column('purchase_items', 'igst')
    op.drop_column('purchase_items', 'sgst')
    op.drop_column('purchase_items', 'cgst')
    op.drop_column('purchase_items', 'gst_rate')
    op.drop_column('purchase_items', 'taxable_value')
    op.drop_column('purchase_items', 'discount_type')
    op.drop_column('purchase_items', 'discount')
    op.drop_column('purchase_items', 'hsn_code')
    op.drop_column('purchase_items', 'description')
    
    # Drop columns from purchases
    op.drop_column('purchases', 'updated_at')
    op.drop_column('purchases', 'created_at')
    op.drop_column('purchases', 'status')
    op.drop_column('purchases', 'notes')
    op.drop_column('purchases', 'balance_amount')
    op.drop_column('purchases', 'paid_amount')
    op.drop_column('purchases', 'grand_total')
    op.drop_column('purchases', 'igst')
    op.drop_column('purchases', 'sgst')
    op.drop_column('purchases', 'cgst')
    op.drop_column('purchases', 'total_discount')
    op.drop_column('purchases', 'ship_from_address')
    op.drop_column('purchases', 'bill_from_address')
    op.drop_column('purchases', 'export_supply')
    op.drop_column('purchases', 'reverse_charge')
    op.drop_column('purchases', 'eway_bill_number')
    op.drop_column('purchases', 'place_of_supply_state_code')
    op.drop_column('purchases', 'place_of_supply')
    op.drop_column('purchases', 'terms')
    op.drop_column('purchases', 'due_date')
    op.drop_column('purchases', 'purchase_no')
