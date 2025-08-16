"""Add purchase order management

Revision ID: add_purchase_order_management
Revises: add_advanced_invoice_features
Create Date: 2024-01-15 11:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'add_purchase_order_management'
down_revision = '001_enhance_invoice_model'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create purchase_orders table
    op.create_table('purchase_orders',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('vendor_id', sa.Integer(), nullable=False),
        sa.Column('po_number', sa.String(length=16), nullable=False),
        sa.Column('date', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('expected_delivery_date', sa.DateTime(), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='Draft'),
        sa.Column('currency', sa.String(length=3), nullable=False, server_default='INR'),
        sa.Column('exchange_rate', sa.Numeric(10, 4), nullable=False, server_default='1.0'),
        sa.Column('terms', sa.String(length=20), nullable=False, server_default='Net 30'),
        sa.Column('place_of_supply', sa.String(length=100), nullable=False),
        sa.Column('place_of_supply_state_code', sa.String(length=10), nullable=False),
        sa.Column('reverse_charge', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('ship_from_address', sa.String(length=200), nullable=False),
        sa.Column('ship_to_address', sa.String(length=200), nullable=False),
        sa.Column('subtotal', sa.Numeric(12, 2), nullable=False, server_default='0'),
        sa.Column('total_discount', sa.Numeric(12, 2), nullable=False, server_default='0'),
        sa.Column('cgst', sa.Numeric(12, 2), nullable=False, server_default='0'),
        sa.Column('sgst', sa.Numeric(12, 2), nullable=False, server_default='0'),
        sa.Column('igst', sa.Numeric(12, 2), nullable=False, server_default='0'),
        sa.Column('utgst', sa.Numeric(12, 2), nullable=False, server_default='0'),
        sa.Column('cess', sa.Numeric(12, 2), nullable=False, server_default='0'),
        sa.Column('round_off', sa.Numeric(12, 2), nullable=False, server_default='0'),
        sa.Column('grand_total', sa.Numeric(12, 2), nullable=False, server_default='0'),
        sa.Column('approved_by', sa.Integer(), nullable=True),
        sa.Column('approved_at', sa.DateTime(), nullable=True),
        sa.Column('sent_at', sa.DateTime(), nullable=True),
        sa.Column('received_at', sa.DateTime(), nullable=True),
        sa.Column('closed_at', sa.DateTime(), nullable=True),
        sa.Column('notes', sa.String(length=200), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['approved_by'], ['users.id'], ),
        sa.ForeignKeyConstraint(['vendor_id'], ['parties.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('po_number')
    )
    
    # Create purchase_order_items table
    op.create_table('purchase_order_items',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('purchase_order_id', sa.Integer(), nullable=False),
        sa.Column('product_id', sa.Integer(), nullable=False),
        sa.Column('description', sa.String(length=200), nullable=False),
        sa.Column('hsn_code', sa.String(length=10), nullable=True),
        sa.Column('qty', sa.Float(), nullable=False),
        sa.Column('expected_rate', sa.Numeric(12, 2), nullable=False),
        sa.Column('discount', sa.Numeric(12, 2), nullable=False, server_default='0'),
        sa.Column('discount_type', sa.String(length=20), nullable=False, server_default='Percentage'),
        sa.Column('gst_rate', sa.Float(), nullable=False),
        sa.Column('amount', sa.Numeric(12, 2), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['product_id'], ['products.id'], ),
        sa.ForeignKeyConstraint(['purchase_order_id'], ['purchase_orders.id'], ),
        sa.PrimaryKeyConstraint('id')
    )


def downgrade() -> None:
    # Drop purchase_order_items table
    op.drop_table('purchase_order_items')
    
    # Drop purchase_orders table
    op.drop_table('purchase_orders')
