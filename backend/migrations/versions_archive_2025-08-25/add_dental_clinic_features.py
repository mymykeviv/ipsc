"""Add dental clinic features to database

Revision ID: add_dental_clinic_features_001
Revises: add_branding_enhancements_001
Create Date: 2024-01-20 13:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'add_dental_clinic_features_001'
down_revision = 'add_branding_enhancements_001'
branch_labels = None
depends_on = None


def upgrade():
    """Add dental clinic features to database"""
    
    # Add dental-specific columns to parties table for patient management
    op.add_column('parties', sa.Column('party_type', sa.String(20), nullable=True, default='customer'))
    op.add_column('parties', sa.Column('date_of_birth', sa.Date, nullable=True))
    op.add_column('parties', sa.Column('gender', sa.String(10), nullable=True))
    op.add_column('parties', sa.Column('emergency_contact', sa.String(100), nullable=True))
    op.add_column('parties', sa.Column('medical_history', sa.Text, nullable=True))
    op.add_column('parties', sa.Column('allergies', sa.Text, nullable=True))
    op.add_column('parties', sa.Column('insurance_info', postgresql.JSONB, nullable=True))
    op.add_column('parties', sa.Column('last_visit', sa.DateTime, nullable=True))
    
    # Add dental-specific columns to expenses table for treatments and appointments
    op.add_column('expenses', sa.Column('patient_id', sa.String(50), nullable=True))
    op.add_column('expenses', sa.Column('treatment_type', sa.String(100), nullable=True))
    op.add_column('expenses', sa.Column('treatment_date', sa.DateTime, nullable=True))
    op.add_column('expenses', sa.Column('next_appointment', sa.DateTime, nullable=True))
    op.add_column('expenses', sa.Column('dentist_id', sa.String(50), nullable=True))
    op.add_column('expenses', sa.Column('treatment_notes', sa.Text, nullable=True))
    op.add_column('expenses', sa.Column('follow_up_required', sa.Boolean, nullable=False, default=False))
    op.add_column('expenses', sa.Column('follow_up_date', sa.DateTime, nullable=True))
    op.add_column('expenses', sa.Column('appointment_time', sa.Time, nullable=True))
    op.add_column('expenses', sa.Column('appointment_date', sa.Date, nullable=True))
    op.add_column('expenses', sa.Column('duration', sa.Integer, nullable=True))  # Duration in minutes
    op.add_column('expenses', sa.Column('status', sa.String(20), nullable=True, default='scheduled'))
    op.add_column('expenses', sa.Column('expense_type', sa.String(50), nullable=True, default='general'))
    
    # Add dental-specific columns to products table for dental supplies
    op.add_column('products', sa.Column('category', sa.String(50), nullable=True))
    op.add_column('products', sa.Column('reorder_level', sa.Integer, nullable=True, default=10))
    op.add_column('products', sa.Column('last_restocked', sa.DateTime, nullable=True))
    op.add_column('products', sa.Column('expiry_date', sa.Date, nullable=True))
    op.add_column('products', sa.Column('supplier', sa.String(100), nullable=True))
    
    # Create dental-specific tables
    
    # Create dentists table
    op.create_table('dentists',
        sa.Column('id', sa.String(50), primary_key=True),
        sa.Column('tenant_id', sa.String(50), nullable=False),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('email', sa.String(100), nullable=True),
        sa.Column('phone', sa.String(20), nullable=True),
        sa.Column('specialization', sa.String(100), nullable=True),
        sa.Column('license_number', sa.String(50), nullable=True),
        sa.Column('is_active', sa.Boolean, nullable=False, default=True),
        sa.Column('created_at', sa.DateTime, nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime, nullable=False, server_default=sa.func.now(), onupdate=sa.func.now())
    )
    
    # Create treatment_types table
    op.create_table('treatment_types',
        sa.Column('id', sa.Integer, primary_key=True, autoincrement=True),
        sa.Column('tenant_id', sa.String(50), nullable=False),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('description', sa.Text, nullable=True),
        sa.Column('default_duration', sa.Integer, nullable=True),  # Duration in minutes
        sa.Column('default_price', sa.Numeric(10, 2), nullable=True),
        sa.Column('category', sa.String(50), nullable=True),  # preventive, restorative, cosmetic, etc.
        sa.Column('is_active', sa.Boolean, nullable=False, default=True),
        sa.Column('created_at', sa.DateTime, nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime, nullable=False, server_default=sa.func.now(), onupdate=sa.func.now())
    )
    
    # Create appointment_slots table
    op.create_table('appointment_slots',
        sa.Column('id', sa.Integer, primary_key=True, autoincrement=True),
        sa.Column('tenant_id', sa.String(50), nullable=False),
        sa.Column('dentist_id', sa.String(50), nullable=False),
        sa.Column('slot_date', sa.Date, nullable=False),
        sa.Column('start_time', sa.Time, nullable=False),
        sa.Column('end_time', sa.Time, nullable=False),
        sa.Column('is_available', sa.Boolean, nullable=False, default=True),
        sa.Column('appointment_id', sa.String(50), nullable=True),
        sa.Column('created_at', sa.DateTime, nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime, nullable=False, server_default=sa.func.now(), onupdate=sa.func.now())
    )
    
    # Create dental_analytics table
    op.create_table('dental_analytics',
        sa.Column('id', sa.Integer, primary_key=True, autoincrement=True),
        sa.Column('tenant_id', sa.String(50), nullable=False),
        sa.Column('analytics_date', sa.Date, nullable=False),
        sa.Column('total_patients', sa.Integer, nullable=False, default=0),
        sa.Column('new_patients', sa.Integer, nullable=False, default=0),
        sa.Column('treatments_performed', sa.Integer, nullable=False, default=0),
        sa.Column('appointments_scheduled', sa.Integer, nullable=False, default=0),
        sa.Column('appointments_completed', sa.Integer, nullable=False, default=0),
        sa.Column('appointments_cancelled', sa.Integer, nullable=False, default=0),
        sa.Column('revenue_generated', sa.Numeric(10, 2), nullable=False, default=0),
        sa.Column('supplies_ordered', sa.Integer, nullable=False, default=0),
        sa.Column('supplies_cost', sa.Numeric(10, 2), nullable=False, default=0),
        sa.Column('created_at', sa.DateTime, nullable=False, server_default=sa.func.now())
    )
    
    # Create indexes for performance
    op.create_index('idx_parties_party_type', 'parties', ['party_type'])
    op.create_index('idx_parties_patient_search', 'parties', ['name', 'phone', 'email'])
    op.create_index('idx_expenses_patient_id', 'expenses', ['patient_id'])
    op.create_index('idx_expenses_treatment_date', 'expenses', ['treatment_date'])
    op.create_index('idx_expenses_appointment_date', 'expenses', ['appointment_date'])
    op.create_index('idx_expenses_expense_type', 'expenses', ['expense_type'])
    op.create_index('idx_products_category', 'products', ['category'])
    op.create_index('idx_products_reorder_level', 'products', ['reorder_level'])
    op.create_index('idx_dentists_tenant_active', 'dentists', ['tenant_id', 'is_active'])
    op.create_index('idx_treatment_types_tenant_active', 'treatment_types', ['tenant_id', 'is_active'])
    op.create_index('idx_appointment_slots_tenant_date', 'appointment_slots', ['tenant_id', 'slot_date'])
    op.create_index('idx_dental_analytics_tenant_date', 'dental_analytics', ['tenant_id', 'analytics_date'])
    
    # Insert default treatment types for dental clinics
    op.execute("""
        INSERT INTO treatment_types (tenant_id, name, description, default_duration, default_price, category, is_active)
        VALUES 
        ('dental_clinic_abc', 'Dental Checkup', 'Regular dental examination and cleaning', 60, 100.00, 'preventive', true),
        ('dental_clinic_abc', 'Cavity Filling', 'Tooth cavity filling procedure', 90, 150.00, 'restorative', true),
        ('dental_clinic_abc', 'Root Canal', 'Root canal treatment', 120, 800.00, 'restorative', true),
        ('dental_clinic_abc', 'Tooth Extraction', 'Simple tooth extraction', 60, 200.00, 'surgical', true),
        ('dental_clinic_abc', 'Teeth Whitening', 'Professional teeth whitening', 90, 300.00, 'cosmetic', true),
        ('dental_clinic_abc', 'Dental Crown', 'Dental crown placement', 120, 1000.00, 'restorative', true),
        ('dental_clinic_abc', 'Dental Bridge', 'Dental bridge installation', 180, 2000.00, 'restorative', true),
        ('dental_clinic_abc', 'Dental Implant', 'Dental implant surgery', 240, 3000.00, 'surgical', true),
        ('dental_clinic_abc', 'Gum Treatment', 'Periodontal treatment', 90, 400.00, 'periodontal', true),
        ('dental_clinic_abc', 'Orthodontic Consultation', 'Braces consultation and fitting', 60, 150.00, 'orthodontic', true)
    """)
    
    # Insert default dentists for dental clinics
    op.execute("""
        INSERT INTO dentists (id, tenant_id, name, email, phone, specialization, license_number, is_active)
        VALUES 
        ('dentist_001', 'dental_clinic_abc', 'Dr. Sarah Johnson', 'sarah.johnson@dentalclinic.com', '+1-555-0101', 'General Dentistry', 'DENT-001-2024', true),
        ('dentist_002', 'dental_clinic_abc', 'Dr. Michael Chen', 'michael.chen@dentalclinic.com', '+1-555-0102', 'Orthodontics', 'DENT-002-2024', true),
        ('dentist_003', 'dental_clinic_abc', 'Dr. Emily Rodriguez', 'emily.rodriguez@dentalclinic.com', '+1-555-0103', 'Periodontics', 'DENT-003-2024', true)
    """)
    
    # Insert default dental supplies
    op.execute("""
        INSERT INTO products (tenant_id, name, description, category, unit, cost_price, selling_price, reorder_level, supplier, is_active)
        VALUES 
        ('dental_clinic_abc', 'Dental Floss', 'Professional dental floss', 'dental_supplies', 'box', 5.00, 8.00, 20, 'Dental Supply Co.', true),
        ('dental_clinic_abc', 'Toothpaste', 'Professional toothpaste', 'dental_supplies', 'tube', 3.00, 6.00, 30, 'Dental Supply Co.', true),
        ('dental_clinic_abc', 'Dental Anesthetic', 'Local anesthetic for procedures', 'dental_supplies', 'vial', 15.00, 25.00, 10, 'Medical Supply Inc.', true),
        ('dental_clinic_abc', 'Dental Cement', 'Temporary dental cement', 'dental_supplies', 'pack', 8.00, 15.00, 15, 'Dental Supply Co.', true),
        ('dental_clinic_abc', 'X-Ray Film', 'Dental X-ray film', 'dental_supplies', 'box', 20.00, 35.00, 8, 'Medical Supply Inc.', true),
        ('dental_clinic_abc', 'Dental Gloves', 'Latex-free dental gloves', 'dental_supplies', 'box', 12.00, 20.00, 25, 'Medical Supply Inc.', true),
        ('dental_clinic_abc', 'Mouthwash', 'Antiseptic mouthwash', 'dental_supplies', 'bottle', 4.00, 8.00, 20, 'Dental Supply Co.', true),
        ('dental_clinic_abc', 'Dental Mirror', 'Dental examination mirror', 'dental_supplies', 'piece', 25.00, 40.00, 5, 'Dental Supply Co.', true),
        ('dental_clinic_abc', 'Dental Drill Bits', 'High-speed drill bits', 'dental_supplies', 'set', 50.00, 80.00, 3, 'Dental Supply Co.', true),
        ('dental_clinic_abc', 'Dental Syringes', 'Disposable dental syringes', 'dental_supplies', 'box', 18.00, 30.00, 12, 'Medical Supply Inc.', true)
    """)
    
    # Update existing parties to have party_type
    op.execute("UPDATE parties SET party_type = 'customer' WHERE party_type IS NULL")
    
    # Update existing expenses to have expense_type
    op.execute("UPDATE expenses SET expense_type = 'general' WHERE expense_type IS NULL")
    
    # Update existing products to have category
    op.execute("UPDATE products SET category = 'general' WHERE category IS NULL")


def downgrade():
    """Remove dental clinic features from database"""
    
    # Drop dental-specific tables
    op.drop_table('dental_analytics')
    op.drop_table('appointment_slots')
    op.drop_table('treatment_types')
    op.drop_table('dentists')
    
    # Drop indexes
    op.drop_index('idx_dental_analytics_tenant_date', 'dental_analytics')
    op.drop_index('idx_appointment_slots_tenant_date', 'appointment_slots')
    op.drop_index('idx_treatment_types_tenant_active', 'treatment_types')
    op.drop_index('idx_dentists_tenant_active', 'dentists')
    op.drop_index('idx_products_reorder_level', 'products')
    op.drop_index('idx_products_category', 'products')
    op.drop_index('idx_expenses_expense_type', 'expenses')
    op.drop_index('idx_expenses_appointment_date', 'expenses')
    op.drop_index('idx_expenses_treatment_date', 'expenses')
    op.drop_index('idx_expenses_patient_id', 'expenses')
    op.drop_index('idx_parties_patient_search', 'parties')
    op.drop_index('idx_parties_party_type', 'parties')
    
    # Remove dental-specific columns from products table
    op.drop_column('products', 'supplier')
    op.drop_column('products', 'expiry_date')
    op.drop_column('products', 'last_restocked')
    op.drop_column('products', 'reorder_level')
    op.drop_column('products', 'category')
    
    # Remove dental-specific columns from expenses table
    op.drop_column('expenses', 'expense_type')
    op.drop_column('expenses', 'status')
    op.drop_column('expenses', 'duration')
    op.drop_column('expenses', 'appointment_date')
    op.drop_column('expenses', 'appointment_time')
    op.drop_column('expenses', 'follow_up_date')
    op.drop_column('expenses', 'follow_up_required')
    op.drop_column('expenses', 'treatment_notes')
    op.drop_column('expenses', 'dentist_id')
    op.drop_column('expenses', 'next_appointment')
    op.drop_column('expenses', 'treatment_date')
    op.drop_column('expenses', 'treatment_type')
    op.drop_column('expenses', 'patient_id')
    
    # Remove dental-specific columns from parties table
    op.drop_column('parties', 'last_visit')
    op.drop_column('parties', 'insurance_info')
    op.drop_column('parties', 'allergies')
    op.drop_column('parties', 'medical_history')
    op.drop_column('parties', 'emergency_contact')
    op.drop_column('parties', 'gender')
    op.drop_column('parties', 'date_of_birth')
    op.drop_column('parties', 'party_type')
