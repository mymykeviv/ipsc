"""Add manufacturing features to database

Revision ID: add_manufacturing_features_001
Revises: add_dental_clinic_features_001
Create Date: 2024-01-20 14:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'add_manufacturing_features_001'
down_revision = 'add_dental_clinic_features_001'
branch_labels = None
depends_on = None


def upgrade():
    """Add manufacturing features to database"""
    
    # Add manufacturing-specific columns to products table for BOM management
    op.add_column('products', sa.Column('bom_version', sa.String(20), nullable=True))
    op.add_column('products', sa.Column('bom_product_id', sa.String(50), nullable=True))
    op.add_column('products', sa.Column('bom_components', sa.Text, nullable=True))  # JSON string
    op.add_column('products', sa.Column('bom_total_cost', sa.Numeric(10, 2), nullable=True))
    op.add_column('products', sa.Column('bom_labor_cost', sa.Numeric(10, 2), nullable=True))
    op.add_column('products', sa.Column('bom_overhead_cost', sa.Numeric(10, 2), nullable=True))
    
    # Add manufacturing-specific columns to purchases table for production tracking
    op.add_column('purchases', sa.Column('purchase_type', sa.String(50), nullable=True, default='purchase'))
    op.add_column('purchases', sa.Column('bom_id', sa.String(50), nullable=True))
    op.add_column('purchases', sa.Column('priority', sa.String(20), nullable=True, default='normal'))
    op.add_column('purchases', sa.Column('start_date', sa.DateTime, nullable=True))
    op.add_column('purchases', sa.Column('completion_date', sa.DateTime, nullable=True))
    op.add_column('purchases', sa.Column('completion_percentage', sa.Integer, nullable=True, default=0))
    op.add_column('purchases', sa.Column('quality_check_passed', sa.Boolean, nullable=True, default=False))
    op.add_column('purchases', sa.Column('estimated_cost', sa.Numeric(10, 2), nullable=True))
    op.add_column('purchases', sa.Column('actual_cost', sa.Numeric(10, 2), nullable=True))
    
    # Create manufacturing-specific tables
    
    # Create work_centers table
    op.create_table('work_centers',
        sa.Column('id', sa.String(50), primary_key=True),
        sa.Column('tenant_id', sa.String(50), nullable=False),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('description', sa.Text, nullable=True),
        sa.Column('capacity_per_hour', sa.Numeric(10, 2), nullable=True),
        sa.Column('hourly_rate', sa.Numeric(10, 2), nullable=True),
        sa.Column('is_active', sa.Boolean, nullable=False, default=True),
        sa.Column('created_at', sa.DateTime, nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime, nullable=False, server_default=sa.func.now(), onupdate=sa.func.now())
    )
    
    # Create production_routes table
    op.create_table('production_routes',
        sa.Column('id', sa.Integer, primary_key=True, autoincrement=True),
        sa.Column('tenant_id', sa.String(50), nullable=False),
        sa.Column('product_id', sa.String(50), nullable=False),
        sa.Column('route_name', sa.String(100), nullable=False),
        sa.Column('route_version', sa.String(20), nullable=False),
        sa.Column('work_center_id', sa.String(50), nullable=False),
        sa.Column('sequence_number', sa.Integer, nullable=False),
        sa.Column('operation_name', sa.String(100), nullable=False),
        sa.Column('setup_time', sa.Integer, nullable=True),  # Minutes
        sa.Column('run_time_per_unit', sa.Numeric(10, 2), nullable=True),  # Minutes per unit
        sa.Column('is_active', sa.Boolean, nullable=False, default=True),
        sa.Column('created_at', sa.DateTime, nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime, nullable=False, server_default=sa.func.now(), onupdate=sa.func.now())
    )
    
    # Create quality_checks table
    op.create_table('quality_checks',
        sa.Column('id', sa.Integer, primary_key=True, autoincrement=True),
        sa.Column('tenant_id', sa.String(50), nullable=False),
        sa.Column('production_order_id', sa.String(50), nullable=False),
        sa.Column('check_type', sa.String(50), nullable=False),  # incoming, in_process, final
        sa.Column('check_date', sa.DateTime, nullable=False),
        sa.Column('inspector_id', sa.String(50), nullable=True),
        sa.Column('passed', sa.Boolean, nullable=False),
        sa.Column('notes', sa.Text, nullable=True),
        sa.Column('created_at', sa.DateTime, nullable=False, server_default=sa.func.now())
    )
    
    # Create manufacturing_analytics table
    op.create_table('manufacturing_analytics',
        sa.Column('id', sa.Integer, primary_key=True, autoincrement=True),
        sa.Column('tenant_id', sa.String(50), nullable=False),
        sa.Column('analytics_date', sa.Date, nullable=False),
        sa.Column('total_orders', sa.Integer, nullable=False, default=0),
        sa.Column('completed_orders', sa.Integer, nullable=False, default=0),
        sa.Column('pending_orders', sa.Integer, nullable=False, default=0),
        sa.Column('overdue_orders', sa.Integer, nullable=False, default=0),
        sa.Column('total_production_value', sa.Numeric(10, 2), nullable=False, default=0),
        sa.Column('average_completion_time', sa.Numeric(10, 2), nullable=True),  # Days
        sa.Column('quality_pass_rate', sa.Numeric(5, 2), nullable=True),  # Percentage
        sa.Column('material_utilization', sa.Numeric(5, 2), nullable=True),  # Percentage
        sa.Column('created_at', sa.DateTime, nullable=False, server_default=sa.func.now())
    )
    
    # Create indexes for performance
    op.create_index('idx_products_bom_product', 'products', ['bom_product_id'])
    op.create_index('idx_products_bom_version', 'products', ['bom_version'])
    op.create_index('idx_purchases_purchase_type', 'purchases', ['purchase_type'])
    op.create_index('idx_purchases_bom_id', 'purchases', ['bom_id'])
    op.create_index('idx_purchases_status_due_date', 'purchases', ['status', 'due_date'])
    op.create_index('idx_purchases_completion_date', 'purchases', ['completion_date'])
    op.create_index('idx_work_centers_tenant_active', 'work_centers', ['tenant_id', 'is_active'])
    op.create_index('idx_production_routes_tenant_product', 'production_routes', ['tenant_id', 'product_id'])
    op.create_index('idx_quality_checks_order_date', 'quality_checks', ['production_order_id', 'check_date'])
    op.create_index('idx_manufacturing_analytics_tenant_date', 'manufacturing_analytics', ['tenant_id', 'analytics_date'])
    
    # Insert default work centers for manufacturing
    op.execute("""
        INSERT INTO work_centers (id, tenant_id, name, description, capacity_per_hour, hourly_rate, is_active)
        VALUES 
        ('wc_001', 'manufacturing_xyz', 'Assembly Line 1', 'Main assembly line for product assembly', 10.00, 25.00, true),
        ('wc_002', 'manufacturing_xyz', 'Machining Center', 'CNC machining center for precision parts', 5.00, 35.00, true),
        ('wc_003', 'manufacturing_xyz', 'Quality Control', 'Quality inspection and testing station', 20.00, 30.00, true),
        ('wc_004', 'manufacturing_xyz', 'Packaging Station', 'Final packaging and labeling station', 15.00, 20.00, true)
    """)
    
    # Insert default production routes
    op.execute("""
        INSERT INTO production_routes (tenant_id, product_id, route_name, route_version, work_center_id, sequence_number, operation_name, setup_time, run_time_per_unit, is_active)
        VALUES 
        ('manufacturing_xyz', 'product_001', 'Standard Assembly Route', '1.0', 'wc_001', 1, 'Component Assembly', 30, 5.00, true),
        ('manufacturing_xyz', 'product_001', 'Standard Assembly Route', '1.0', 'wc_002', 2, 'Precision Machining', 45, 8.00, true),
        ('manufacturing_xyz', 'product_001', 'Standard Assembly Route', '1.0', 'wc_003', 3, 'Quality Inspection', 15, 2.00, true),
        ('manufacturing_xyz', 'product_001', 'Standard Assembly Route', '1.0', 'wc_004', 4, 'Final Packaging', 20, 3.00, true)
    """)
    
    # Insert default BOMs for manufacturing
    op.execute("""
        INSERT INTO products (tenant_id, name, description, category, sku, bom_version, bom_product_id, bom_components, bom_total_cost, bom_labor_cost, bom_overhead_cost, is_active)
        VALUES 
        ('manufacturing_xyz', 'Product A BOM v1.0', 'Bill of Materials for Product A', 'bom', 'BOM-PROD-A-1.0', '1.0', 'product_001', 
         '[{"product_id": "material_001", "quantity": 2, "unit": "pcs", "cost_per_unit": 5.00}, {"product_id": "material_002", "quantity": 1, "unit": "pcs", "cost_per_unit": 10.00}]', 
         20.00, 15.00, 5.00, true),
        ('manufacturing_xyz', 'Product B BOM v1.0', 'Bill of Materials for Product B', 'bom', 'BOM-PROD-B-1.0', '1.0', 'product_002', 
         '[{"product_id": "material_003", "quantity": 3, "unit": "pcs", "cost_per_unit": 8.00}, {"product_id": "material_004", "quantity": 2, "unit": "pcs", "cost_per_unit": 12.00}]', 
         48.00, 20.00, 8.00, true)
    """)
    
    # Insert default raw materials
    op.execute("""
        INSERT INTO products (tenant_id, name, description, category, unit, cost_price, selling_price, reorder_level, supplier, is_active)
        VALUES 
        ('manufacturing_xyz', 'Steel Plate', 'High-grade steel plate for manufacturing', 'raw_material', 'kg', 2.50, 3.50, 100, 'Steel Supplier Co.', true),
        ('manufacturing_xyz', 'Aluminum Bar', 'Precision aluminum bar stock', 'raw_material', 'm', 15.00, 20.00, 50, 'Aluminum Supplier Inc.', true),
        ('manufacturing_xyz', 'Electronic Component A', 'Microcontroller unit', 'component', 'pcs', 8.00, 12.00, 200, 'Electronics Supply Co.', true),
        ('manufacturing_xyz', 'Electronic Component B', 'Power supply module', 'component', 'pcs', 25.00, 35.00, 100, 'Electronics Supply Co.', true),
        ('manufacturing_xyz', 'Fastener Set', 'Assorted fasteners and screws', 'component', 'set', 3.00, 5.00, 500, 'Hardware Supply Ltd.', true),
        ('manufacturing_xyz', 'Plastic Housing', 'Injection molded plastic housing', 'component', 'pcs', 4.00, 6.00, 300, 'Plastic Molding Co.', true)
    """)
    
    # Update existing purchases to have purchase_type
    op.execute("UPDATE purchases SET purchase_type = 'purchase' WHERE purchase_type IS NULL")
    
    # Update existing products to have category
    op.execute("UPDATE products SET category = 'finished_good' WHERE category IS NULL AND bom_product_id IS NULL")


def downgrade():
    """Remove manufacturing features from database"""
    
    # Drop manufacturing-specific tables
    op.drop_table('manufacturing_analytics')
    op.drop_table('quality_checks')
    op.drop_table('production_routes')
    op.drop_table('work_centers')
    
    # Drop indexes
    op.drop_index('idx_manufacturing_analytics_tenant_date', 'manufacturing_analytics')
    op.drop_index('idx_quality_checks_order_date', 'quality_checks')
    op.drop_index('idx_production_routes_tenant_product', 'production_routes')
    op.drop_index('idx_work_centers_tenant_active', 'work_centers')
    op.drop_index('idx_purchases_completion_date', 'purchases')
    op.drop_index('idx_purchases_status_due_date', 'purchases')
    op.drop_index('idx_purchases_bom_id', 'purchases')
    op.drop_index('idx_purchases_purchase_type', 'purchases')
    op.drop_index('idx_products_bom_version', 'products')
    op.drop_index('idx_products_bom_product', 'products')
    
    # Remove manufacturing-specific columns from purchases table
    op.drop_column('purchases', 'actual_cost')
    op.drop_column('purchases', 'estimated_cost')
    op.drop_column('purchases', 'quality_check_passed')
    op.drop_column('purchases', 'completion_percentage')
    op.drop_column('purchases', 'completion_date')
    op.drop_column('purchases', 'start_date')
    op.drop_column('purchases', 'priority')
    op.drop_column('purchases', 'bom_id')
    op.drop_column('purchases', 'purchase_type')
    
    # Remove manufacturing-specific columns from products table
    op.drop_column('products', 'bom_overhead_cost')
    op.drop_column('products', 'bom_labor_cost')
    op.drop_column('products', 'bom_total_cost')
    op.drop_column('products', 'bom_components')
    op.drop_column('products', 'bom_product_id')
    op.drop_column('products', 'bom_version')
