"""Add domain-specific models for dental and manufacturing

Revision ID: 003
Revises: 002
Create Date: 2025-01-27 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '003'
down_revision = '002'
branch_labels = None
depends_on = None


def upgrade():
    # Create dental clinic models
    op.create_table('patients',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('tenant_id', sa.Integer(), nullable=True),
        sa.Column('patient_id', sa.String(length=20), nullable=False),
        sa.Column('first_name', sa.String(length=100), nullable=False),
        sa.Column('last_name', sa.String(length=100), nullable=False),
        sa.Column('date_of_birth', sa.Date(), nullable=False),
        sa.Column('gender', sa.String(length=10), nullable=False),
        sa.Column('phone', sa.String(length=20), nullable=False),
        sa.Column('email', sa.String(length=100), nullable=True),
        sa.Column('emergency_contact', sa.String(length=100), nullable=True),
        sa.Column('emergency_phone', sa.String(length=20), nullable=True),
        sa.Column('address_line1', sa.String(length=200), nullable=False),
        sa.Column('address_line2', sa.String(length=200), nullable=True),
        sa.Column('city', sa.String(length=100), nullable=False),
        sa.Column('state', sa.String(length=100), nullable=False),
        sa.Column('pincode', sa.String(length=10), nullable=False),
        sa.Column('blood_group', sa.String(length=5), nullable=True),
        sa.Column('allergies', sa.Text(), nullable=True),
        sa.Column('medical_conditions', sa.Text(), nullable=True),
        sa.Column('current_medications', sa.Text(), nullable=True),
        sa.Column('dental_insurance', sa.String(length=100), nullable=True),
        sa.Column('insurance_number', sa.String(length=50), nullable=True),
        sa.Column('insurance_provider', sa.String(length=100), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, default=True),
        sa.Column('registration_date', sa.DateTime(), nullable=False, default=sa.func.now()),
        sa.Column('last_visit_date', sa.DateTime(), nullable=True),
        sa.Column('occupation', sa.String(length=100), nullable=True),
        sa.Column('referred_by', sa.String(length=100), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, default=sa.func.now(), onupdate=sa.func.now()),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('patient_id', 'tenant_id', name='uq_patient_id_tenant')
    )
    
    op.create_table('appointments',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('tenant_id', sa.Integer(), nullable=True),
        sa.Column('appointment_id', sa.String(length=20), nullable=False),
        sa.Column('patient_id', sa.Integer(), nullable=False),
        sa.Column('doctor_id', sa.Integer(), nullable=True),
        sa.Column('appointment_date', sa.Date(), nullable=False),
        sa.Column('start_time', sa.DateTime(), nullable=False),
        sa.Column('end_time', sa.DateTime(), nullable=False),
        sa.Column('duration_minutes', sa.Integer(), nullable=False, default=30),
        sa.Column('appointment_type', sa.String(length=50), nullable=False),
        sa.Column('treatment_type', sa.String(length=100), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=False, default='Scheduled'),
        sa.Column('confirmation_status', sa.String(length=20), nullable=False, default='Pending'),
        sa.Column('patient_notes', sa.Text(), nullable=True),
        sa.Column('doctor_notes', sa.Text(), nullable=True),
        sa.Column('internal_notes', sa.Text(), nullable=True),
        sa.Column('reminder_sent', sa.Boolean(), nullable=False, default=False),
        sa.Column('reminder_date', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, default=sa.func.now(), onupdate=sa.func.now()),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ),
        sa.ForeignKeyConstraint(['patient_id'], ['patients.id'], ),
        sa.ForeignKeyConstraint(['doctor_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('appointment_id', 'tenant_id', name='uq_appointment_id_tenant')
    )
    
    op.create_table('treatments',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('tenant_id', sa.Integer(), nullable=True),
        sa.Column('treatment_id', sa.String(length=20), nullable=False),
        sa.Column('patient_id', sa.Integer(), nullable=False),
        sa.Column('appointment_id', sa.Integer(), nullable=True),
        sa.Column('doctor_id', sa.Integer(), nullable=True),
        sa.Column('treatment_type', sa.String(length=100), nullable=False),
        sa.Column('treatment_category', sa.String(length=50), nullable=False),
        sa.Column('tooth_numbers', sa.String(length=100), nullable=True),
        sa.Column('diagnosis', sa.Text(), nullable=False),
        sa.Column('treatment_plan', sa.Text(), nullable=False),
        sa.Column('procedure_notes', sa.Text(), nullable=True),
        sa.Column('post_treatment_instructions', sa.Text(), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=False, default='Planned'),
        sa.Column('treatment_date', sa.DateTime(), nullable=True),
        sa.Column('completion_date', sa.DateTime(), nullable=True),
        sa.Column('follow_up_required', sa.Boolean(), nullable=False, default=False),
        sa.Column('follow_up_date', sa.DateTime(), nullable=True),
        sa.Column('follow_up_notes', sa.Text(), nullable=True),
        sa.Column('estimated_cost', sa.Numeric(precision=10, scale=2), nullable=False, default=0),
        sa.Column('actual_cost', sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column('insurance_coverage', sa.Numeric(precision=10, scale=2), nullable=False, default=0),
        sa.Column('patient_share', sa.Numeric(precision=10, scale=2), nullable=False, default=0),
        sa.Column('created_at', sa.DateTime(), nullable=False, default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, default=sa.func.now(), onupdate=sa.func.now()),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ),
        sa.ForeignKeyConstraint(['patient_id'], ['patients.id'], ),
        sa.ForeignKeyConstraint(['appointment_id'], ['appointments.id'], ),
        sa.ForeignKeyConstraint(['doctor_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('treatment_id', 'tenant_id', name='uq_treatment_id_tenant')
    )
    
    op.create_table('treatment_items',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('tenant_id', sa.Integer(), nullable=True),
        sa.Column('treatment_id', sa.Integer(), nullable=False),
        sa.Column('item_name', sa.String(length=200), nullable=False),
        sa.Column('item_description', sa.Text(), nullable=True),
        sa.Column('procedure_code', sa.String(length=20), nullable=True),
        sa.Column('tooth_number', sa.String(length=10), nullable=True),
        sa.Column('surface', sa.String(length=50), nullable=True),
        sa.Column('unit_cost', sa.Numeric(precision=10, scale=2), nullable=False, default=0),
        sa.Column('quantity', sa.Integer(), nullable=False, default=1),
        sa.Column('total_cost', sa.Numeric(precision=10, scale=2), nullable=False, default=0),
        sa.Column('status', sa.String(length=20), nullable=False, default='Planned'),
        sa.Column('completion_date', sa.DateTime(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, default=sa.func.now(), onupdate=sa.func.now()),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ),
        sa.ForeignKeyConstraint(['treatment_id'], ['treatments.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    op.create_table('medical_history',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('tenant_id', sa.Integer(), nullable=True),
        sa.Column('patient_id', sa.Integer(), nullable=False),
        sa.Column('record_date', sa.DateTime(), nullable=False),
        sa.Column('record_type', sa.String(length=50), nullable=False),
        sa.Column('condition', sa.String(length=200), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('severity', sa.String(length=20), nullable=True),
        sa.Column('treatment_received', sa.Text(), nullable=True),
        sa.Column('medications', sa.Text(), nullable=True),
        sa.Column('outcome', sa.String(length=100), nullable=True),
        sa.Column('onset_date', sa.Date(), nullable=True),
        sa.Column('resolution_date', sa.Date(), nullable=True),
        sa.Column('provider_name', sa.String(length=100), nullable=True),
        sa.Column('provider_type', sa.String(length=50), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, default=sa.func.now(), onupdate=sa.func.now()),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ),
        sa.ForeignKeyConstraint(['patient_id'], ['patients.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    op.create_table('dental_supplies',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('tenant_id', sa.Integer(), nullable=True),
        sa.Column('name', sa.String(length=200), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('category', sa.String(length=100), nullable=False),
        sa.Column('subcategory', sa.String(length=100), nullable=True),
        sa.Column('sku', sa.String(length=50), nullable=True),
        sa.Column('brand', sa.String(length=100), nullable=True),
        sa.Column('model', sa.String(length=100), nullable=True),
        sa.Column('size', sa.String(length=50), nullable=True),
        sa.Column('current_stock', sa.Integer(), nullable=False, default=0),
        sa.Column('minimum_stock', sa.Integer(), nullable=False, default=0),
        sa.Column('maximum_stock', sa.Integer(), nullable=False, default=1000),
        sa.Column('unit', sa.String(length=20), nullable=False, default='Pieces'),
        sa.Column('unit_cost', sa.Numeric(precision=10, scale=2), nullable=False, default=0),
        sa.Column('selling_price', sa.Numeric(precision=10, scale=2), nullable=False, default=0),
        sa.Column('supplier_name', sa.String(length=100), nullable=True),
        sa.Column('supplier_contact', sa.String(length=100), nullable=True),
        sa.Column('supplier_phone', sa.String(length=20), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, default=True),
        sa.Column('is_sterile', sa.Boolean(), nullable=False, default=False),
        sa.Column('requires_refrigeration', sa.Boolean(), nullable=False, default=False),
        sa.Column('expiry_date', sa.Date(), nullable=True),
        sa.Column('lot_number', sa.String(length=50), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, default=sa.func.now(), onupdate=sa.func.now()),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    op.create_table('treatment_supply_usage',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('tenant_id', sa.Integer(), nullable=True),
        sa.Column('treatment_id', sa.Integer(), nullable=False),
        sa.Column('supply_id', sa.Integer(), nullable=False),
        sa.Column('quantity_used', sa.Integer(), nullable=False, default=1),
        sa.Column('unit_cost', sa.Numeric(precision=10, scale=2), nullable=False, default=0),
        sa.Column('total_cost', sa.Numeric(precision=10, scale=2), nullable=False, default=0),
        sa.Column('usage_date', sa.DateTime(), nullable=False),
        sa.Column('used_by', sa.Integer(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, default=sa.func.now()),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ),
        sa.ForeignKeyConstraint(['treatment_id'], ['treatments.id'], ),
        sa.ForeignKeyConstraint(['supply_id'], ['dental_supplies.id'], ),
        sa.ForeignKeyConstraint(['used_by'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create manufacturing models
    op.create_table('bill_of_materials',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('tenant_id', sa.Integer(), nullable=True),
        sa.Column('bom_id', sa.String(length=20), nullable=False),
        sa.Column('name', sa.String(length=200), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('version', sa.String(length=20), nullable=False, default='1.0'),
        sa.Column('product_id', sa.Integer(), nullable=False),
        sa.Column('product_quantity', sa.Float(), nullable=False, default=1.0),
        sa.Column('product_unit', sa.String(length=20), nullable=False, default='Pieces'),
        sa.Column('bom_type', sa.String(length=50), nullable=False, default='Production'),
        sa.Column('revision_number', sa.Integer(), nullable=False, default=1),
        sa.Column('effective_date', sa.Date(), nullable=False),
        sa.Column('expiry_date', sa.Date(), nullable=True),
        sa.Column('total_cost', sa.Numeric(precision=12, scale=2), nullable=False, default=0),
        sa.Column('labor_cost', sa.Numeric(precision=12, scale=2), nullable=False, default=0),
        sa.Column('overhead_cost', sa.Numeric(precision=12, scale=2), nullable=False, default=0),
        sa.Column('status', sa.String(length=20), nullable=False, default='Draft'),
        sa.Column('is_active', sa.Boolean(), nullable=False, default=True),
        sa.Column('approved_by', sa.Integer(), nullable=True),
        sa.Column('approved_date', sa.DateTime(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, default=sa.func.now(), onupdate=sa.func.now()),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ),
        sa.ForeignKeyConstraint(['product_id'], ['products.id'], ),
        sa.ForeignKeyConstraint(['approved_by'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('bom_id', 'tenant_id', name='uq_bom_id_tenant')
    )
    
    op.create_table('bom_components',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('tenant_id', sa.Integer(), nullable=True),
        sa.Column('bom_id', sa.Integer(), nullable=False),
        sa.Column('component_product_id', sa.Integer(), nullable=False),
        sa.Column('quantity_required', sa.Float(), nullable=False, default=1.0),
        sa.Column('quantity_unit', sa.String(length=20), nullable=False, default='Pieces'),
        sa.Column('scrap_factor', sa.Float(), nullable=False, default=0.0),
        sa.Column('total_quantity', sa.Float(), nullable=False, default=1.0),
        sa.Column('unit_cost', sa.Numeric(precision=12, scale=2), nullable=False, default=0),
        sa.Column('total_cost', sa.Numeric(precision=12, scale=2), nullable=False, default=0),
        sa.Column('component_type', sa.String(length=50), nullable=False, default='Raw Material'),
        sa.Column('position', sa.String(length=50), nullable=True),
        sa.Column('operation_sequence', sa.Integer(), nullable=False, default=1),
        sa.Column('is_critical', sa.Boolean(), nullable=False, default=False),
        sa.Column('is_optional', sa.Boolean(), nullable=False, default=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, default=sa.func.now(), onupdate=sa.func.now()),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ),
        sa.ForeignKeyConstraint(['bom_id'], ['bill_of_materials.id'], ),
        sa.ForeignKeyConstraint(['component_product_id'], ['products.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    op.create_table('production_orders',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('tenant_id', sa.Integer(), nullable=True),
        sa.Column('production_order_id', sa.String(length=20), nullable=False),
        sa.Column('bom_id', sa.Integer(), nullable=False),
        sa.Column('product_id', sa.Integer(), nullable=False),
        sa.Column('quantity_to_produce', sa.Float(), nullable=False, default=1.0),
        sa.Column('quantity_produced', sa.Float(), nullable=False, default=0.0),
        sa.Column('quantity_unit', sa.String(length=20), nullable=False, default='Pieces'),
        sa.Column('planned_start_date', sa.Date(), nullable=False),
        sa.Column('planned_end_date', sa.Date(), nullable=False),
        sa.Column('actual_start_date', sa.DateTime(), nullable=True),
        sa.Column('actual_end_date', sa.DateTime(), nullable=True),
        sa.Column('priority', sa.String(length=20), nullable=False, default='Normal'),
        sa.Column('status', sa.String(length=20), nullable=False, default='Planned'),
        sa.Column('estimated_cost', sa.Numeric(precision=12, scale=2), nullable=False, default=0),
        sa.Column('actual_cost', sa.Numeric(precision=12, scale=2), nullable=False, default=0),
        sa.Column('labor_cost', sa.Numeric(precision=12, scale=2), nullable=False, default=0),
        sa.Column('material_cost', sa.Numeric(precision=12, scale=2), nullable=False, default=0),
        sa.Column('overhead_cost', sa.Numeric(precision=12, scale=2), nullable=False, default=0),
        sa.Column('quality_check_required', sa.Boolean(), nullable=False, default=True),
        sa.Column('quality_check_completed', sa.Boolean(), nullable=False, default=False),
        sa.Column('quality_check_date', sa.DateTime(), nullable=True),
        sa.Column('quality_check_by', sa.Integer(), nullable=True),
        sa.Column('assigned_to', sa.Integer(), nullable=True),
        sa.Column('supervisor', sa.Integer(), nullable=True),
        sa.Column('production_notes', sa.Text(), nullable=True),
        sa.Column('quality_notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, default=sa.func.now(), onupdate=sa.func.now()),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ),
        sa.ForeignKeyConstraint(['bom_id'], ['bill_of_materials.id'], ),
        sa.ForeignKeyConstraint(['product_id'], ['products.id'], ),
        sa.ForeignKeyConstraint(['quality_check_by'], ['users.id'], ),
        sa.ForeignKeyConstraint(['assigned_to'], ['users.id'], ),
        sa.ForeignKeyConstraint(['supervisor'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('production_order_id', 'tenant_id', name='uq_production_order_id_tenant')
    )
    
    op.create_table('production_steps',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('tenant_id', sa.Integer(), nullable=True),
        sa.Column('production_order_id', sa.Integer(), nullable=False),
        sa.Column('step_name', sa.String(length=200), nullable=False),
        sa.Column('step_description', sa.Text(), nullable=True),
        sa.Column('sequence_number', sa.Integer(), nullable=False, default=1),
        sa.Column('estimated_duration_minutes', sa.Integer(), nullable=False, default=30),
        sa.Column('actual_duration_minutes', sa.Integer(), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=False, default='Pending'),
        sa.Column('start_time', sa.DateTime(), nullable=True),
        sa.Column('end_time', sa.DateTime(), nullable=True),
        sa.Column('assigned_to', sa.Integer(), nullable=True),
        sa.Column('quality_check_required', sa.Boolean(), nullable=False, default=False),
        sa.Column('quality_check_passed', sa.Boolean(), nullable=True),
        sa.Column('quality_notes', sa.Text(), nullable=True),
        sa.Column('step_notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, default=sa.func.now(), onupdate=sa.func.now()),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ),
        sa.ForeignKeyConstraint(['production_order_id'], ['production_orders.id'], ),
        sa.ForeignKeyConstraint(['assigned_to'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    op.create_table('material_consumption',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('tenant_id', sa.Integer(), nullable=True),
        sa.Column('production_order_id', sa.Integer(), nullable=False),
        sa.Column('product_id', sa.Integer(), nullable=False),
        sa.Column('quantity_planned', sa.Float(), nullable=False, default=0.0),
        sa.Column('quantity_consumed', sa.Float(), nullable=False, default=0.0),
        sa.Column('quantity_unit', sa.String(length=20), nullable=False, default='Pieces'),
        sa.Column('unit_cost', sa.Numeric(precision=12, scale=2), nullable=False, default=0),
        sa.Column('total_cost', sa.Numeric(precision=12, scale=2), nullable=False, default=0),
        sa.Column('consumption_date', sa.DateTime(), nullable=False),
        sa.Column('consumed_by', sa.Integer(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, default=sa.func.now()),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ),
        sa.ForeignKeyConstraint(['production_order_id'], ['production_orders.id'], ),
        sa.ForeignKeyConstraint(['product_id'], ['products.id'], ),
        sa.ForeignKeyConstraint(['consumed_by'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    op.create_table('work_centers',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('tenant_id', sa.Integer(), nullable=True),
        sa.Column('work_center_id', sa.String(length=20), nullable=False),
        sa.Column('name', sa.String(length=200), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('location', sa.String(length=100), nullable=True),
        sa.Column('capacity_per_hour', sa.Float(), nullable=False, default=1.0),
        sa.Column('capacity_unit', sa.String(length=20), nullable=False, default='Pieces'),
        sa.Column('equipment_list', sa.Text(), nullable=True),
        sa.Column('required_skills', sa.Text(), nullable=True),
        sa.Column('hourly_rate', sa.Numeric(precision=10, scale=2), nullable=False, default=0),
        sa.Column('setup_cost', sa.Numeric(precision=10, scale=2), nullable=False, default=0),
        sa.Column('is_active', sa.Boolean(), nullable=False, default=True),
        sa.Column('is_available', sa.Boolean(), nullable=False, default=True),
        sa.Column('last_maintenance_date', sa.Date(), nullable=True),
        sa.Column('next_maintenance_date', sa.Date(), nullable=True),
        sa.Column('maintenance_notes', sa.Text(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, default=sa.func.now(), onupdate=sa.func.now()),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('work_center_id', 'tenant_id', name='uq_work_center_id_tenant')
    )
    
    op.create_table('quality_control',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('tenant_id', sa.Integer(), nullable=True),
        sa.Column('production_order_id', sa.Integer(), nullable=False),
        sa.Column('inspection_date', sa.DateTime(), nullable=False),
        sa.Column('inspector_id', sa.Integer(), nullable=False),
        sa.Column('inspection_type', sa.String(length=50), nullable=False),
        sa.Column('quantity_inspected', sa.Float(), nullable=False, default=0.0),
        sa.Column('quantity_passed', sa.Float(), nullable=False, default=0.0),
        sa.Column('quantity_failed', sa.Float(), nullable=False, default=0.0),
        sa.Column('pass_rate', sa.Float(), nullable=False, default=100.0),
        sa.Column('defect_rate', sa.Float(), nullable=False, default=0.0),
        sa.Column('defect_types', sa.Text(), nullable=True),
        sa.Column('defect_notes', sa.Text(), nullable=True),
        sa.Column('corrective_action_required', sa.Boolean(), nullable=False, default=False),
        sa.Column('corrective_action', sa.Text(), nullable=True),
        sa.Column('action_taken_by', sa.Integer(), nullable=True),
        sa.Column('action_taken_date', sa.DateTime(), nullable=True),
        sa.Column('overall_result', sa.String(length=20), nullable=False, default='Pass'),
        sa.Column('inspection_notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, default=sa.func.now(), onupdate=sa.func.now()),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ),
        sa.ForeignKeyConstraint(['production_order_id'], ['production_orders.id'], ),
        sa.ForeignKeyConstraint(['inspector_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['action_taken_by'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes for performance
    op.create_index('ix_patients_tenant_id', 'patients', ['tenant_id'])
    op.create_index('ix_patients_patient_id', 'patients', ['patient_id'])
    op.create_index('ix_appointments_tenant_id', 'appointments', ['tenant_id'])
    op.create_index('ix_appointments_patient_id', 'appointments', ['patient_id'])
    op.create_index('ix_appointments_appointment_date', 'appointments', ['appointment_date'])
    op.create_index('ix_treatments_tenant_id', 'treatments', ['tenant_id'])
    op.create_index('ix_treatments_patient_id', 'treatments', ['patient_id'])
    op.create_index('ix_bill_of_materials_tenant_id', 'bill_of_materials', ['tenant_id'])
    op.create_index('ix_bill_of_materials_product_id', 'bill_of_materials', ['product_id'])
    op.create_index('ix_production_orders_tenant_id', 'production_orders', ['tenant_id'])
    op.create_index('ix_production_orders_bom_id', 'production_orders', ['bom_id'])
    op.create_index('ix_production_orders_status', 'production_orders', ['status'])


def downgrade():
    # Drop indexes
    op.drop_index('ix_production_orders_status', 'production_orders')
    op.drop_index('ix_production_orders_bom_id', 'production_orders')
    op.drop_index('ix_production_orders_tenant_id', 'production_orders')
    op.drop_index('ix_bill_of_materials_product_id', 'bill_of_materials')
    op.drop_index('ix_bill_of_materials_tenant_id', 'bill_of_materials')
    op.drop_index('ix_treatments_patient_id', 'treatments')
    op.drop_index('ix_treatments_tenant_id', 'treatments')
    op.drop_index('ix_appointments_appointment_date', 'appointments')
    op.drop_index('ix_appointments_patient_id', 'appointments')
    op.drop_index('ix_appointments_tenant_id', 'appointments')
    op.drop_index('ix_patients_patient_id', 'patients')
    op.drop_index('ix_patients_tenant_id', 'patients')
    
    # Drop manufacturing tables
    op.drop_table('quality_control')
    op.drop_table('work_centers')
    op.drop_table('material_consumption')
    op.drop_table('production_steps')
    op.drop_table('production_orders')
    op.drop_table('bom_components')
    op.drop_table('bill_of_materials')
    
    # Drop dental tables
    op.drop_table('treatment_supply_usage')
    op.drop_table('dental_supplies')
    op.drop_table('medical_history')
    op.drop_table('treatment_items')
    op.drop_table('treatments')
    op.drop_table('appointments')
    op.drop_table('patients')
