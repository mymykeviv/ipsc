"""Add multi-tenant support to all tables

Revision ID: 002
Revises: 001
Create Date: 2025-01-27 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '002'
down_revision = '001_enhance_invoice_model'
branch_labels = None
depends_on = None


def upgrade():
    # Create tenant tables
    op.create_table('tenants',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=200), nullable=False),
        sa.Column('slug', sa.String(length=50), nullable=False),
        sa.Column('domain', sa.String(length=100), nullable=True),
        sa.Column('organization_type', sa.String(length=50), nullable=False, default='business'),
        sa.Column('industry', sa.String(length=100), nullable=True),
        sa.Column('size', sa.String(length=50), nullable=True),
        sa.Column('contact_person', sa.String(length=100), nullable=True),
        sa.Column('contact_email', sa.String(length=100), nullable=True),
        sa.Column('contact_phone', sa.String(length=20), nullable=True),
        sa.Column('address_line1', sa.String(length=200), nullable=True),
        sa.Column('address_line2', sa.String(length=200), nullable=True),
        sa.Column('city', sa.String(length=100), nullable=True),
        sa.Column('state', sa.String(length=100), nullable=True),
        sa.Column('country', sa.String(length=100), nullable=True, default='India'),
        sa.Column('pincode', sa.String(length=10), nullable=True),
        sa.Column('gstin', sa.String(length=15), nullable=True),
        sa.Column('pan', sa.String(length=10), nullable=True),
        sa.Column('business_registration_number', sa.String(length=50), nullable=True),
        sa.Column('subscription_plan', sa.String(length=50), nullable=False, default='basic'),
        sa.Column('subscription_status', sa.String(length=20), nullable=False, default='active'),
        sa.Column('subscription_start_date', sa.DateTime(), nullable=True),
        sa.Column('subscription_end_date', sa.DateTime(), nullable=True),
        sa.Column('max_users', sa.Integer(), nullable=False, default=5),
        sa.Column('max_products', sa.Integer(), nullable=False, default=1000),
        sa.Column('max_transactions_per_month', sa.Integer(), nullable=False, default=10000),
        sa.Column('storage_limit_gb', sa.Integer(), nullable=False, default=10),
        sa.Column('is_active', sa.Boolean(), nullable=False, default=True),
        sa.Column('is_trial', sa.Boolean(), nullable=False, default=True),
        sa.Column('trial_end_date', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, default=sa.func.now(), onupdate=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('slug')
    )
    
    op.create_table('tenant_users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('tenant_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('role', sa.String(length=50), nullable=False, default='user'),
        sa.Column('permissions', sa.Text(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, default=True),
        sa.Column('is_primary_contact', sa.Boolean(), nullable=False, default=False),
        sa.Column('joined_at', sa.DateTime(), nullable=False, default=sa.func.now()),
        sa.Column('last_access_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('tenant_id', 'user_id', name='uq_tenant_user')
    )
    
    op.create_table('tenant_settings',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('tenant_id', sa.Integer(), nullable=False),
        sa.Column('category', sa.String(length=50), nullable=False),
        sa.Column('setting_key', sa.String(length=100), nullable=False),
        sa.Column('setting_value', sa.Text(), nullable=True),
        sa.Column('setting_type', sa.String(length=20), nullable=False, default='string'),
        sa.Column('description', sa.String(length=200), nullable=True),
        sa.Column('is_editable', sa.Boolean(), nullable=False, default=True),
        sa.Column('is_required', sa.Boolean(), nullable=False, default=False),
        sa.Column('created_at', sa.DateTime(), nullable=False, default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, default=sa.func.now(), onupdate=sa.func.now()),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('tenant_id', 'category', 'setting_key', name='uq_tenant_setting')
    )
    
    op.create_table('tenant_branding',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('tenant_id', sa.Integer(), nullable=False),
        sa.Column('logo_url', sa.String(length=500), nullable=True),
        sa.Column('logo_alt_text', sa.String(length=100), nullable=True),
        sa.Column('favicon_url', sa.String(length=500), nullable=True),
        sa.Column('primary_color', sa.String(length=7), nullable=False, default='#2c3e50'),
        sa.Column('secondary_color', sa.String(length=7), nullable=False, default='#3498db'),
        sa.Column('accent_color', sa.String(length=7), nullable=False, default='#e74c3c'),
        sa.Column('background_color', sa.String(length=7), nullable=False, default='#ffffff'),
        sa.Column('text_color', sa.String(length=7), nullable=False, default='#2c3e50'),
        sa.Column('primary_font', sa.String(length=50), nullable=False, default='Inter'),
        sa.Column('secondary_font', sa.String(length=50), nullable=False, default='Inter'),
        sa.Column('custom_css', sa.Text(), nullable=True),
        sa.Column('invoice_header_text', sa.String(length=100), nullable=False, default='TAX INVOICE'),
        sa.Column('invoice_footer_text', sa.String(length=200), nullable=False, default='Thank you for your business!'),
        sa.Column('invoice_terms_text', sa.String(length=200), nullable=False, default='Payment is due within the terms specified above.'),
        sa.Column('created_at', sa.DateTime(), nullable=False, default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, default=sa.func.now(), onupdate=sa.func.now()),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('tenant_id')
    )
    
    # Add tenant_id to existing tables
    op.add_column('users', sa.Column('tenant_id', sa.Integer(), nullable=True))
    op.add_column('company_settings', sa.Column('tenant_id', sa.Integer(), nullable=True))
    op.add_column('parties', sa.Column('tenant_id', sa.Integer(), nullable=True))
    op.add_column('products', sa.Column('tenant_id', sa.Integer(), nullable=True))
    op.add_column('stock_ledger_entries', sa.Column('tenant_id', sa.Integer(), nullable=True))
    op.add_column('invoices', sa.Column('tenant_id', sa.Integer(), nullable=True))
    op.add_column('invoice_items', sa.Column('tenant_id', sa.Integer(), nullable=True))
    op.add_column('payments', sa.Column('tenant_id', sa.Integer(), nullable=True))
    op.add_column('purchases', sa.Column('tenant_id', sa.Integer(), nullable=True))
    op.add_column('purchase_items', sa.Column('tenant_id', sa.Integer(), nullable=True))
    op.add_column('purchase_payments', sa.Column('tenant_id', sa.Integer(), nullable=True))
    op.add_column('expenses', sa.Column('tenant_id', sa.Integer(), nullable=True))
    
    # Create foreign key constraints
    op.create_foreign_key('fk_users_tenant', 'users', 'tenants', ['tenant_id'], ['id'])
    op.create_foreign_key('fk_company_settings_tenant', 'company_settings', 'tenants', ['tenant_id'], ['id'])
    op.create_foreign_key('fk_parties_tenant', 'parties', 'tenants', ['tenant_id'], ['id'])
    op.create_foreign_key('fk_products_tenant', 'products', 'tenants', ['tenant_id'], ['id'])
    op.create_foreign_key('fk_stock_ledger_tenant', 'stock_ledger_entries', 'tenants', ['tenant_id'], ['id'])
    op.create_foreign_key('fk_invoices_tenant', 'invoices', 'tenants', ['tenant_id'], ['id'])
    op.create_foreign_key('fk_invoice_items_tenant', 'invoice_items', 'tenants', ['tenant_id'], ['id'])
    op.create_foreign_key('fk_payments_tenant', 'payments', 'tenants', ['tenant_id'], ['id'])
    op.create_foreign_key('fk_purchases_tenant', 'purchases', 'tenants', ['tenant_id'], ['id'])
    op.create_foreign_key('fk_purchase_items_tenant', 'purchase_items', 'tenants', ['tenant_id'], ['id'])
    op.create_foreign_key('fk_purchase_payments_tenant', 'purchase_payments', 'tenants', ['tenant_id'], ['id'])
    op.create_foreign_key('fk_expenses_tenant', 'expenses', 'tenants', ['tenant_id'], ['id'])
    
    # Create indexes for tenant_id columns
    op.create_index('ix_users_tenant_id', 'users', ['tenant_id'])
    op.create_index('ix_company_settings_tenant_id', 'company_settings', ['tenant_id'])
    op.create_index('ix_parties_tenant_id', 'parties', ['tenant_id'])
    op.create_index('ix_products_tenant_id', 'products', ['tenant_id'])
    op.create_index('ix_stock_ledger_tenant_id', 'stock_ledger_entries', ['tenant_id'])
    op.create_index('ix_invoices_tenant_id', 'invoices', ['tenant_id'])
    op.create_index('ix_invoice_items_tenant_id', 'invoice_items', ['tenant_id'])
    op.create_index('ix_payments_tenant_id', 'payments', ['tenant_id'])
    op.create_index('ix_purchases_tenant_id', 'purchases', ['tenant_id'])
    op.create_index('ix_purchase_items_tenant_id', 'purchase_items', ['tenant_id'])
    op.create_index('ix_purchase_payments_tenant_id', 'purchase_payments', ['tenant_id'])
    op.create_index('ix_expenses_tenant_id', 'expenses', ['tenant_id'])


def downgrade():
    # Drop indexes
    op.drop_index('ix_expenses_tenant_id', 'expenses')
    op.drop_index('ix_purchase_payments_tenant_id', 'purchase_payments')
    op.drop_index('ix_purchase_items_tenant_id', 'purchase_items')
    op.drop_index('ix_purchases_tenant_id', 'purchases')
    op.drop_index('ix_payments_tenant_id', 'payments')
    op.drop_index('ix_invoice_items_tenant_id', 'invoice_items')
    op.drop_index('ix_invoices_tenant_id', 'invoices')
    op.drop_index('ix_stock_ledger_tenant_id', 'stock_ledger_entries')
    op.drop_index('ix_products_tenant_id', 'products')
    op.drop_index('ix_parties_tenant_id', 'parties')
    op.drop_index('ix_company_settings_tenant_id', 'company_settings')
    op.drop_index('ix_users_tenant_id', 'users')
    
    # Drop foreign key constraints
    op.drop_constraint('fk_expenses_tenant', 'expenses', type_='foreignkey')
    op.drop_constraint('fk_purchase_payments_tenant', 'purchase_payments', type_='foreignkey')
    op.drop_constraint('fk_purchase_items_tenant', 'purchase_items', type_='foreignkey')
    op.drop_constraint('fk_purchases_tenant', 'purchases', type_='foreignkey')
    op.drop_constraint('fk_payments_tenant', 'payments', type_='foreignkey')
    op.drop_constraint('fk_invoice_items_tenant', 'invoice_items', type_='foreignkey')
    op.drop_constraint('fk_invoices_tenant', 'invoices', type_='foreignkey')
    op.drop_constraint('fk_stock_ledger_tenant', 'stock_ledger_entries', type_='foreignkey')
    op.drop_constraint('fk_products_tenant', 'products', type_='foreignkey')
    op.drop_constraint('fk_parties_tenant', 'parties', type_='foreignkey')
    op.drop_constraint('fk_company_settings_tenant', 'company_settings', type_='foreignkey')
    op.drop_constraint('fk_users_tenant', 'users', type_='foreignkey')
    
    # Drop tenant_id columns
    op.drop_column('expenses', 'tenant_id')
    op.drop_column('purchase_payments', 'tenant_id')
    op.drop_column('purchase_items', 'tenant_id')
    op.drop_column('purchases', 'tenant_id')
    op.drop_column('payments', 'tenant_id')
    op.drop_column('invoice_items', 'tenant_id')
    op.drop_column('invoices', 'tenant_id')
    op.drop_column('stock_ledger_entries', 'tenant_id')
    op.drop_column('products', 'tenant_id')
    op.drop_column('parties', 'tenant_id')
    op.drop_column('company_settings', 'tenant_id')
    op.drop_column('users', 'tenant_id')
    
    # Drop tenant tables
    op.drop_table('tenant_branding')
    op.drop_table('tenant_settings')
    op.drop_table('tenant_users')
    op.drop_table('tenants')
