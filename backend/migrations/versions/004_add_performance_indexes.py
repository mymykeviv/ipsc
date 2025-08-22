"""Add performance indexes for query optimization

Revision ID: 004
Revises: 003
Create Date: 2024-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '004'
down_revision = '003'
branch_labels = None
depends_on = None


def upgrade():
    """Add performance indexes for query optimization."""
    
    # Invoice indexes
    op.create_index('ix_invoices_tenant_id', 'invoices', ['tenant_id'])
    op.create_index('ix_invoices_invoice_date', 'invoices', ['invoice_date'])
    op.create_index('ix_invoices_status', 'invoices', ['status'])
    op.create_index('ix_invoices_party_id', 'invoices', ['party_id'])
    op.create_index('ix_invoices_tenant_date', 'invoices', ['tenant_id', 'invoice_date'])
    op.create_index('ix_invoices_tenant_status', 'invoices', ['tenant_id', 'status'])
    op.create_index('ix_invoices_number_tenant', 'invoices', ['invoice_number', 'tenant_id'])
    
    # Purchase indexes
    op.create_index('ix_purchases_tenant_id', 'purchases', ['tenant_id'])
    op.create_index('ix_purchases_purchase_date', 'purchases', ['purchase_date'])
    op.create_index('ix_purchases_status', 'purchases', ['status'])
    op.create_index('ix_purchases_supplier_id', 'purchases', ['supplier_id'])
    op.create_index('ix_purchases_tenant_date', 'purchases', ['tenant_id', 'purchase_date'])
    op.create_index('ix_purchases_tenant_status', 'purchases', ['tenant_id', 'status'])
    op.create_index('ix_purchases_number_tenant', 'purchases', ['purchase_number', 'tenant_id'])
    
    # Product indexes
    op.create_index('ix_products_tenant_id', 'products', ['tenant_id'])
    op.create_index('ix_products_sku', 'products', ['sku'])
    op.create_index('ix_products_name', 'products', ['name'])
    op.create_index('ix_products_category', 'products', ['category'])
    op.create_index('ix_products_tenant_sku', 'products', ['tenant_id', 'sku'])
    op.create_index('ix_products_tenant_category', 'products', ['tenant_id', 'category'])
    
    # Party indexes
    op.create_index('ix_parties_tenant_id', 'parties', ['tenant_id'])
    op.create_index('ix_parties_party_type', 'parties', ['party_type'])
    op.create_index('ix_parties_name', 'parties', ['name'])
    op.create_index('ix_parties_email', 'parties', ['email'])
    op.create_index('ix_parties_tenant_type', 'parties', ['tenant_id', 'party_type'])
    op.create_index('ix_parties_tenant_name', 'parties', ['tenant_id', 'name'])
    
    # Payment indexes
    op.create_index('ix_payments_tenant_id', 'payments', ['tenant_id'])
    op.create_index('ix_payments_payment_date', 'payments', ['payment_date'])
    op.create_index('ix_payments_payment_method', 'payments', ['payment_method'])
    op.create_index('ix_payments_invoice_id', 'payments', ['invoice_id'])
    op.create_index('ix_payments_purchase_id', 'payments', ['purchase_id'])
    op.create_index('ix_payments_tenant_date', 'payments', ['tenant_id', 'payment_date'])
    
    # Invoice Item indexes
    op.create_index('ix_invoice_items_invoice_id', 'invoice_items', ['invoice_id'])
    op.create_index('ix_invoice_items_product_id', 'invoice_items', ['product_id'])
    op.create_index('ix_invoice_items_tenant_id', 'invoice_items', ['tenant_id'])
    
    # Purchase Item indexes
    op.create_index('ix_purchase_items_purchase_id', 'purchase_items', ['purchase_id'])
    op.create_index('ix_purchase_items_product_id', 'purchase_items', ['product_id'])
    op.create_index('ix_purchase_items_tenant_id', 'purchase_items', ['tenant_id'])
    
    # User indexes
    op.create_index('ix_users_tenant_id', 'users', ['tenant_id'])
    op.create_index('ix_users_email', 'users', ['email'])
    op.create_index('ix_users_tenant_email', 'users', ['tenant_id', 'email'])
    
    # Company Settings indexes
    op.create_index('ix_company_settings_tenant_id', 'company_settings', ['tenant_id'])
    
    # Audit Trail indexes
    op.create_index('ix_audit_trail_tenant_id', 'audit_trail', ['tenant_id'])
    op.create_index('ix_audit_trail_timestamp', 'audit_trail', ['timestamp'])
    op.create_index('ix_audit_trail_user_id', 'audit_trail', ['user_id'])
    op.create_index('ix_audit_trail_action', 'audit_trail', ['action'])
    op.create_index('ix_audit_trail_tenant_timestamp', 'audit_trail', ['tenant_id', 'timestamp'])
    
    # Tenant indexes
    op.create_index('ix_tenants_domain', 'tenants', ['domain'])
    op.create_index('ix_tenants_status', 'tenants', ['status'])
    
    # Tenant User indexes
    op.create_index('ix_tenant_users_tenant_id', 'tenant_users', ['tenant_id'])
    op.create_index('ix_tenant_users_user_id', 'tenant_users', ['user_id'])
    op.create_index('ix_tenant_users_role', 'tenant_users', ['role'])
    op.create_index('ix_tenant_users_tenant_user', 'tenant_users', ['tenant_id', 'user_id'])
    
    # Dental Clinic indexes
    op.create_index('ix_patients_tenant_id', 'patients', ['tenant_id'])
    op.create_index('ix_patients_patient_id', 'patients', ['patient_id'])
    op.create_index('ix_patients_name', 'patients', ['first_name', 'last_name'])
    op.create_index('ix_patients_phone', 'patients', ['phone'])
    op.create_index('ix_patients_tenant_patient_id', 'patients', ['tenant_id', 'patient_id'])
    
    op.create_index('ix_appointments_tenant_id', 'appointments', ['tenant_id'])
    op.create_index('ix_appointments_patient_id', 'appointments', ['patient_id'])
    op.create_index('ix_appointments_appointment_date', 'appointments', ['appointment_date'])
    op.create_index('ix_appointments_status', 'appointments', ['status'])
    op.create_index('ix_appointments_tenant_date', 'appointments', ['tenant_id', 'appointment_date'])
    
    op.create_index('ix_treatments_tenant_id', 'treatments', ['tenant_id'])
    op.create_index('ix_treatments_patient_id', 'treatments', ['patient_id'])
    op.create_index('ix_treatments_treatment_date', 'treatments', ['treatment_date'])
    op.create_index('ix_treatments_tenant_patient', 'treatments', ['tenant_id', 'patient_id'])
    
    # Manufacturing indexes
    op.create_index('ix_bill_of_materials_tenant_id', 'bill_of_materials', ['tenant_id'])
    op.create_index('ix_bill_of_materials_bom_id', 'bill_of_materials', ['bom_id'])
    op.create_index('ix_bill_of_materials_product_id', 'bill_of_materials', ['product_id'])
    op.create_index('ix_bill_of_materials_status', 'bill_of_materials', ['status'])
    op.create_index('ix_bill_of_materials_tenant_bom_id', 'bill_of_materials', ['tenant_id', 'bom_id'])
    
    op.create_index('ix_production_orders_tenant_id', 'production_orders', ['tenant_id'])
    op.create_index('ix_production_orders_order_number', 'production_orders', ['order_number'])
    op.create_index('ix_production_orders_bom_id', 'production_orders', ['bom_id'])
    op.create_index('ix_production_orders_status', 'production_orders', ['status'])
    op.create_index('ix_production_orders_start_date', 'production_orders', ['start_date'])
    op.create_index('ix_production_orders_tenant_order', 'production_orders', ['tenant_id', 'order_number'])


def downgrade():
    """Remove performance indexes."""
    
    # Invoice indexes
    op.drop_index('ix_invoices_tenant_id', table_name='invoices')
    op.drop_index('ix_invoices_invoice_date', table_name='invoices')
    op.drop_index('ix_invoices_status', table_name='invoices')
    op.drop_index('ix_invoices_party_id', table_name='invoices')
    op.drop_index('ix_invoices_tenant_date', table_name='invoices')
    op.drop_index('ix_invoices_tenant_status', table_name='invoices')
    op.drop_index('ix_invoices_number_tenant', table_name='invoices')
    
    # Purchase indexes
    op.drop_index('ix_purchases_tenant_id', table_name='purchases')
    op.drop_index('ix_purchases_purchase_date', table_name='purchases')
    op.drop_index('ix_purchases_status', table_name='purchases')
    op.drop_index('ix_purchases_supplier_id', table_name='purchases')
    op.drop_index('ix_purchases_tenant_date', table_name='purchases')
    op.drop_index('ix_purchases_tenant_status', table_name='purchases')
    op.drop_index('ix_purchases_number_tenant', table_name='purchases')
    
    # Product indexes
    op.drop_index('ix_products_tenant_id', table_name='products')
    op.drop_index('ix_products_sku', table_name='products')
    op.drop_index('ix_products_name', table_name='products')
    op.drop_index('ix_products_category', table_name='products')
    op.drop_index('ix_products_tenant_sku', table_name='products')
    op.drop_index('ix_products_tenant_category', table_name='products')
    
    # Party indexes
    op.drop_index('ix_parties_tenant_id', table_name='parties')
    op.drop_index('ix_parties_party_type', table_name='parties')
    op.drop_index('ix_parties_name', table_name='parties')
    op.drop_index('ix_parties_email', table_name='parties')
    op.drop_index('ix_parties_tenant_type', table_name='parties')
    op.drop_index('ix_parties_tenant_name', table_name='parties')
    
    # Payment indexes
    op.drop_index('ix_payments_tenant_id', table_name='payments')
    op.drop_index('ix_payments_payment_date', table_name='payments')
    op.drop_index('ix_payments_payment_method', table_name='payments')
    op.drop_index('ix_payments_invoice_id', table_name='payments')
    op.drop_index('ix_payments_purchase_id', table_name='payments')
    op.drop_index('ix_payments_tenant_date', table_name='payments')
    
    # Invoice Item indexes
    op.drop_index('ix_invoice_items_invoice_id', table_name='invoice_items')
    op.drop_index('ix_invoice_items_product_id', table_name='invoice_items')
    op.drop_index('ix_invoice_items_tenant_id', table_name='invoice_items')
    
    # Purchase Item indexes
    op.drop_index('ix_purchase_items_purchase_id', table_name='purchase_items')
    op.drop_index('ix_purchase_items_product_id', table_name='purchase_items')
    op.drop_index('ix_purchase_items_tenant_id', table_name='purchase_items')
    
    # User indexes
    op.drop_index('ix_users_tenant_id', table_name='users')
    op.drop_index('ix_users_email', table_name='users')
    op.drop_index('ix_users_tenant_email', table_name='users')
    
    # Company Settings indexes
    op.drop_index('ix_company_settings_tenant_id', table_name='company_settings')
    
    # Audit Trail indexes
    op.drop_index('ix_audit_trail_tenant_id', table_name='audit_trail')
    op.drop_index('ix_audit_trail_timestamp', table_name='audit_trail')
    op.drop_index('ix_audit_trail_user_id', table_name='audit_trail')
    op.drop_index('ix_audit_trail_action', table_name='audit_trail')
    op.drop_index('ix_audit_trail_tenant_timestamp', table_name='audit_trail')
    
    # Tenant indexes
    op.drop_index('ix_tenants_domain', table_name='tenants')
    op.drop_index('ix_tenants_status', table_name='tenants')
    
    # Tenant User indexes
    op.drop_index('ix_tenant_users_tenant_id', table_name='tenant_users')
    op.drop_index('ix_tenant_users_user_id', table_name='tenant_users')
    op.drop_index('ix_tenant_users_role', table_name='tenant_users')
    op.drop_index('ix_tenant_users_tenant_user', table_name='tenant_users')
    
    # Dental Clinic indexes
    op.drop_index('ix_patients_tenant_id', table_name='patients')
    op.drop_index('ix_patients_patient_id', table_name='patients')
    op.drop_index('ix_patients_name', table_name='patients')
    op.drop_index('ix_patients_phone', table_name='patients')
    op.drop_index('ix_patients_tenant_patient_id', table_name='patients')
    
    op.drop_index('ix_appointments_tenant_id', table_name='appointments')
    op.drop_index('ix_appointments_patient_id', table_name='appointments')
    op.drop_index('ix_appointments_appointment_date', table_name='appointments')
    op.drop_index('ix_appointments_status', table_name='appointments')
    op.drop_index('ix_appointments_tenant_date', table_name='appointments')
    
    op.drop_index('ix_treatments_tenant_id', table_name='treatments')
    op.drop_index('ix_treatments_patient_id', table_name='treatments')
    op.drop_index('ix_treatments_treatment_date', table_name='treatments')
    op.drop_index('ix_treatments_tenant_patient', table_name='treatments')
    
    # Manufacturing indexes
    op.drop_index('ix_bill_of_materials_tenant_id', table_name='bill_of_materials')
    op.drop_index('ix_bill_of_materials_bom_id', table_name='bill_of_materials')
    op.drop_index('ix_bill_of_materials_product_id', table_name='bill_of_materials')
    op.drop_index('ix_bill_of_materials_status', table_name='bill_of_materials')
    op.drop_index('ix_bill_of_materials_tenant_bom_id', table_name='bill_of_materials')
    
    op.drop_index('ix_production_orders_tenant_id', table_name='production_orders')
    op.drop_index('ix_production_orders_order_number', table_name='production_orders')
    op.drop_index('ix_production_orders_bom_id', table_name='production_orders')
    op.drop_index('ix_production_orders_status', table_name='production_orders')
    op.drop_index('ix_production_orders_start_date', table_name='production_orders')
    op.drop_index('ix_production_orders_tenant_order', table_name='production_orders')
