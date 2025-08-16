"""Add advanced invoice features

Revision ID: add_advanced_invoice_features
Revises: add_gst_toggle_system
Create Date: 2024-01-15 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'add_advanced_invoice_features'
down_revision = 'add_gst_toggle_system'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add exchange_rate column to invoices table
    op.add_column('invoices', sa.Column('exchange_rate', sa.Numeric(10, 4), nullable=False, server_default='1.0'))
    
    # Create recurring_invoice_templates table
    op.create_table('recurring_invoice_templates',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('customer_id', sa.Integer(), nullable=False),
        sa.Column('supplier_id', sa.Integer(), nullable=False),
        sa.Column('recurrence_type', sa.String(length=20), nullable=False),
        sa.Column('recurrence_interval', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('start_date', sa.DateTime(), nullable=False),
        sa.Column('end_date', sa.DateTime(), nullable=True),
        sa.Column('next_generation_date', sa.DateTime(), nullable=False),
        sa.Column('currency', sa.String(length=3), nullable=False, server_default='INR'),
        sa.Column('exchange_rate', sa.Numeric(10, 4), nullable=False, server_default='1.0'),
        sa.Column('terms', sa.String(length=20), nullable=False, server_default='Due on Receipt'),
        sa.Column('place_of_supply', sa.String(length=100), nullable=False),
        sa.Column('place_of_supply_state_code', sa.String(length=10), nullable=False),
        sa.Column('bill_to_address', sa.String(length=200), nullable=False),
        sa.Column('ship_to_address', sa.String(length=200), nullable=False),
        sa.Column('notes', sa.String(length=200), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['customer_id'], ['parties.id'], ),
        sa.ForeignKeyConstraint(['supplier_id'], ['parties.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create recurring_invoice_template_items table
    op.create_table('recurring_invoice_template_items',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('template_id', sa.Integer(), nullable=False),
        sa.Column('product_id', sa.Integer(), nullable=False),
        sa.Column('description', sa.String(length=200), nullable=False),
        sa.Column('hsn_code', sa.String(length=10), nullable=True),
        sa.Column('qty', sa.Float(), nullable=False),
        sa.Column('rate', sa.Numeric(12, 2), nullable=False),
        sa.Column('discount', sa.Numeric(12, 2), nullable=False, server_default='0'),
        sa.Column('discount_type', sa.String(length=20), nullable=False, server_default='Percentage'),
        sa.Column('gst_rate', sa.Float(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['product_id'], ['products.id'], ),
        sa.ForeignKeyConstraint(['template_id'], ['recurring_invoice_templates.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create recurring_invoices table
    op.create_table('recurring_invoices',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('template_id', sa.Integer(), nullable=False),
        sa.Column('invoice_id', sa.Integer(), nullable=False),
        sa.Column('generation_date', sa.DateTime(), nullable=False),
        sa.Column('due_date', sa.DateTime(), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='Generated'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['invoice_id'], ['invoices.id'], ),
        sa.ForeignKeyConstraint(['template_id'], ['recurring_invoice_templates.id'], ),
        sa.PrimaryKeyConstraint('id')
    )


def downgrade() -> None:
    # Drop recurring_invoices table
    op.drop_table('recurring_invoices')
    
    # Drop recurring_invoice_template_items table
    op.drop_table('recurring_invoice_template_items')
    
    # Drop recurring_invoice_templates table
    op.drop_table('recurring_invoice_templates')
    
    # Drop exchange_rate column from invoices table
    op.drop_column('invoices', 'exchange_rate')
