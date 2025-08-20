"""Add tenant support to existing tables

Revision ID: add_tenant_support_001
Revises: 001_enhance_invoice_model
Create Date: 2024-01-20 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'add_tenant_support_001'
down_revision = '001_enhance_invoice_model'
branch_labels = None
depends_on = None


def upgrade():
    """Add tenant support to existing tables"""
    
    # Create tenant_configs table
    op.create_table('tenant_configs',
        sa.Column('tenant_id', sa.String(50), primary_key=True),
        sa.Column('database_url', sa.String(255), nullable=False),
        sa.Column('domain', sa.String(20), nullable=False, default='default'),
        sa.Column('branding_config', postgresql.JSONB, nullable=True),
        sa.Column('features', postgresql.JSONB, nullable=True),
        sa.Column('gst_number', sa.String(15), nullable=True),
        sa.Column('contact_info', postgresql.JSONB, nullable=True),
        sa.Column('is_active', sa.Boolean, nullable=False, default=True),
        sa.Column('created_at', sa.DateTime, nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime, nullable=False, server_default=sa.func.now(), onupdate=sa.func.now())
    )
    
    # Add tenant_id column to existing tables (nullable for backward compatibility)
    tables_to_update = [
        'users',
        'roles',
        'company_settings',
        'parties',
        'products',
        'stock_ledger',
        'invoices',
        'invoice_items',
        'payments',
        'purchases',
        'purchase_items',
        'purchase_payments',
        'expenses',
        'audit_trail',
        'recurring_invoice_templates',
        'recurring_invoice_template_items',
        'recurring_invoices',
        'purchase_orders',
        'purchase_order_items',
        'invoice_templates'
    ]
    
    for table_name in tables_to_update:
        try:
            op.add_column(table_name, sa.Column('tenant_id', sa.String(50), nullable=True))
            # Create index on tenant_id for performance
            op.create_index(f'idx_{table_name}_tenant_id', table_name, ['tenant_id'])
        except Exception as e:
            # Column might already exist, skip
            print(f"Warning: Could not add tenant_id to {table_name}: {e}")
    
    # Create composite indexes for common query patterns
    try:
        # Invoice queries
        op.create_index('idx_invoices_tenant_customer_date', 'invoices', ['tenant_id', 'customer_id', 'date'])
        op.create_index('idx_invoices_tenant_status_date', 'invoices', ['tenant_id', 'status', 'date'])
        
        # Purchase queries
        op.create_index('idx_purchases_tenant_vendor_date', 'purchases', ['tenant_id', 'vendor_id', 'date'])
        op.create_index('idx_purchases_tenant_status_date', 'purchases', ['tenant_id', 'status', 'date'])
        
        # Product queries
        op.create_index('idx_products_tenant_active', 'products', ['tenant_id', 'is_active'])
        op.create_index('idx_products_tenant_category', 'products', ['tenant_id', 'category'])
        
        # Party queries
        op.create_index('idx_parties_tenant_type_active', 'parties', ['tenant_id', 'type', 'is_active'])
        
        # Payment queries
        op.create_index('idx_payments_tenant_invoice_date', 'payments', ['tenant_id', 'invoice_id', 'payment_date'])
        
        # Expense queries
        op.create_index('idx_expenses_tenant_category_date', 'expenses', ['tenant_id', 'category', 'expense_date'])
        
        # Stock ledger queries
        op.create_index('idx_stock_ledger_tenant_product_date', 'stock_ledger', ['tenant_id', 'product_id', 'created_at'])
        
    except Exception as e:
        print(f"Warning: Could not create composite indexes: {e}")
    
    # Insert default tenant configuration for backward compatibility
    op.execute("""
        INSERT INTO tenant_configs (tenant_id, database_url, domain, branding_config, features, is_active)
        VALUES (
            'default',
            'postgresql+psycopg://postgres:postgres@localhost:5432/profitpath',
            'default',
            '{"company_name": "Default Company", "primary_color": "#2E86AB"}',
            '["basic_features"]',
            true
        )
    """)
    
    # Update existing records to use default tenant
    for table_name in tables_to_update:
        try:
            op.execute(f"UPDATE {table_name} SET tenant_id = 'default' WHERE tenant_id IS NULL")
        except Exception as e:
            print(f"Warning: Could not update {table_name} with default tenant: {e}")


def downgrade():
    """Remove tenant support from tables"""
    
    # Drop composite indexes
    try:
        op.drop_index('idx_invoices_tenant_customer_date', 'invoices')
        op.drop_index('idx_invoices_tenant_status_date', 'invoices')
        op.drop_index('idx_purchases_tenant_vendor_date', 'purchases')
        op.drop_index('idx_purchases_tenant_status_date', 'purchases')
        op.drop_index('idx_products_tenant_active', 'products')
        op.drop_index('idx_products_tenant_category', 'products')
        op.drop_index('idx_parties_tenant_type_active', 'parties')
        op.drop_index('idx_payments_tenant_invoice_date', 'payments')
        op.drop_index('idx_expenses_tenant_category_date', 'expenses')
        op.drop_index('idx_stock_ledger_tenant_product_date', 'stock_ledger')
    except Exception as e:
        print(f"Warning: Could not drop composite indexes: {e}")
    
    # Drop tenant_id columns from tables
    tables_to_update = [
        'users',
        'roles',
        'company_settings',
        'parties',
        'products',
        'stock_ledger',
        'invoices',
        'invoice_items',
        'payments',
        'purchases',
        'purchase_items',
        'purchase_payments',
        'expenses',
        'audit_trail',
        'recurring_invoice_templates',
        'recurring_invoice_template_items',
        'recurring_invoices',
        'purchase_orders',
        'purchase_order_items',
        'invoice_templates'
    ]
    
    for table_name in tables_to_update:
        try:
            op.drop_index(f'idx_{table_name}_tenant_id', table_name)
            op.drop_column(table_name, 'tenant_id')
        except Exception as e:
            print(f"Warning: Could not remove tenant_id from {table_name}: {e}")
    
    # Drop tenant_configs table
    op.drop_table('tenant_configs')
