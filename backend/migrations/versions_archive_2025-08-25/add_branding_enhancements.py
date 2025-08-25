"""Add branding enhancements to database

Revision ID: add_branding_enhancements_001
Revises: add_security_enhancements_001
Create Date: 2024-01-20 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'add_branding_enhancements_001'
down_revision = 'add_security_enhancements_001'
branch_labels = None
depends_on = None


def upgrade():
    """Add branding enhancements to database"""
    
    # Create branding_assets table for storing logos and other branding assets
    op.create_table('branding_assets',
        sa.Column('id', sa.Integer, primary_key=True, autoincrement=True),
        sa.Column('tenant_id', sa.String(50), nullable=False),
        sa.Column('asset_type', sa.String(50), nullable=False),  # logo, favicon, watermark, etc.
        sa.Column('file_name', sa.String(255), nullable=False),
        sa.Column('file_path', sa.String(500), nullable=False),
        sa.Column('file_size', sa.Integer, nullable=True),
        sa.Column('mime_type', sa.String(100), nullable=True),
        sa.Column('is_active', sa.Boolean, nullable=False, default=True),
        sa.Column('created_at', sa.DateTime, nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime, nullable=False, server_default=sa.func.now(), onupdate=sa.func.now())
    )
    
    # Create indexes for branding assets
    op.create_index('idx_branding_assets_tenant_type', 'branding_assets', ['tenant_id', 'asset_type'])
    op.create_index('idx_branding_assets_active', 'branding_assets', ['is_active'])
    
    # Create branding_templates table for custom templates
    op.create_table('branding_templates',
        sa.Column('id', sa.Integer, primary_key=True, autoincrement=True),
        sa.Column('tenant_id', sa.String(50), nullable=False),
        sa.Column('template_name', sa.String(100), nullable=False),
        sa.Column('template_type', sa.String(50), nullable=False),  # invoice, report, email, etc.
        sa.Column('template_config', postgresql.JSONB, nullable=False),
        sa.Column('is_default', sa.Boolean, nullable=False, default=False),
        sa.Column('is_active', sa.Boolean, nullable=False, default=True),
        sa.Column('created_at', sa.DateTime, nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime, nullable=False, server_default=sa.func.now(), onupdate=sa.func.now())
    )
    
    # Create indexes for branding templates
    op.create_index('idx_branding_templates_tenant_type', 'branding_templates', ['tenant_id', 'template_type'])
    op.create_index('idx_branding_templates_default', 'branding_templates', ['is_default', 'is_active'])
    
    # Create branding_preferences table for tenant-specific branding preferences
    op.create_table('branding_preferences',
        sa.Column('id', sa.Integer, primary_key=True, autoincrement=True),
        sa.Column('tenant_id', sa.String(50), nullable=False, unique=True),
        sa.Column('primary_color', sa.String(7), nullable=True),  # Hex color code
        sa.Column('secondary_color', sa.String(7), nullable=True),
        sa.Column('accent_color', sa.String(7), nullable=True),
        sa.Column('font_family', sa.String(100), nullable=True),
        sa.Column('font_size', sa.Integer, nullable=True),
        sa.Column('header_style', sa.String(50), nullable=True),
        sa.Column('footer_text', sa.String(500), nullable=True),
        sa.Column('custom_css', sa.Text, nullable=True),
        sa.Column('watermark_enabled', sa.Boolean, nullable=False, default=False),
        sa.Column('watermark_text', sa.String(200), nullable=True),
        sa.Column('watermark_position', sa.String(50), nullable=True),
        sa.Column('qr_code_enabled', sa.Boolean, nullable=False, default=True),
        sa.Column('qr_code_position', sa.String(50), nullable=True),
        sa.Column('created_at', sa.DateTime, nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime, nullable=False, server_default=sa.func.now(), onupdate=sa.func.now())
    )
    
    # Create indexes for branding preferences
    op.create_index('idx_branding_preferences_tenant', 'branding_preferences', ['tenant_id'])
    
    # Create branded_documents table for tracking generated branded documents
    op.create_table('branded_documents',
        sa.Column('id', sa.Integer, primary_key=True, autoincrement=True),
        sa.Column('tenant_id', sa.String(50), nullable=False),
        sa.Column('document_type', sa.String(50), nullable=False),  # invoice, report, etc.
        sa.Column('document_id', sa.Integer, nullable=False),  # Reference to original document
        sa.Column('branded_file_path', sa.String(500), nullable=False),
        sa.Column('branding_config_used', postgresql.JSONB, nullable=True),
        sa.Column('generated_by', sa.String(50), nullable=True),
        sa.Column('file_size', sa.Integer, nullable=True),
        sa.Column('created_at', sa.DateTime, nullable=False, server_default=sa.func.now())
    )
    
    # Create indexes for branded documents
    op.create_index('idx_branded_documents_tenant_type', 'branded_documents', ['tenant_id', 'document_type'])
    op.create_index('idx_branded_documents_created', 'branded_documents', ['created_at'])
    
    # Create branding_analytics table for tracking branding usage
    op.create_table('branding_analytics',
        sa.Column('id', sa.Integer, primary_key=True, autoincrement=True),
        sa.Column('tenant_id', sa.String(50), nullable=False),
        sa.Column('event_type', sa.String(50), nullable=False),  # template_applied, document_generated, etc.
        sa.Column('event_data', postgresql.JSONB, nullable=True),
        sa.Column('user_id', sa.String(50), nullable=True),
        sa.Column('ip_address', sa.String(45), nullable=True),
        sa.Column('created_at', sa.DateTime, nullable=False, server_default=sa.func.now())
    )
    
    # Create indexes for branding analytics
    op.create_index('idx_branding_analytics_tenant_event', 'branding_analytics', ['tenant_id', 'event_type'])
    op.create_index('idx_branding_analytics_created', 'branding_analytics', ['created_at'])
    
    # Add branding-related columns to existing tables
    
    # Add branding columns to company_settings table
    op.add_column('company_settings', sa.Column('logo_url', sa.String(500), nullable=True))
    op.add_column('company_settings', sa.Column('favicon_url', sa.String(500), nullable=True))
    op.add_column('company_settings', sa.Column('primary_color', sa.String(7), nullable=True))
    op.add_column('company_settings', sa.Column('secondary_color', sa.String(7), nullable=True))
    op.add_column('company_settings', sa.Column('accent_color', sa.String(7), nullable=True))
    op.add_column('company_settings', sa.Column('custom_css', sa.Text, nullable=True))
    
    # Add branding columns to invoice_templates table
    op.add_column('invoice_templates', sa.Column('tenant_id', sa.String(50), nullable=True))
    op.add_column('invoice_templates', sa.Column('branding_config', postgresql.JSONB, nullable=True))
    op.add_column('invoice_templates', sa.Column('custom_header', sa.Text, nullable=True))
    op.add_column('invoice_templates', sa.Column('custom_footer', sa.Text, nullable=True))
    
    # Create indexes for new columns
    op.create_index('idx_invoice_templates_tenant', 'invoice_templates', ['tenant_id'])
    
    # Insert default branding preferences for existing tenants
    op.execute("""
        INSERT INTO branding_preferences (tenant_id, primary_color, secondary_color, accent_color, font_family, font_size, header_style, footer_text)
        SELECT 
            tenant_id,
            '#2E86AB',
            '#A23B72',
            '#F18F01',
            'Helvetica',
            12,
            'modern',
            'Thank you for your business'
        FROM tenant_configs
        WHERE is_active = true
    """)
    
    # Insert default branding templates for each tenant
    op.execute("""
        INSERT INTO branding_templates (tenant_id, template_name, template_type, template_config, is_default, is_active)
        SELECT 
            tenant_id,
            'Default Invoice Template',
            'invoice',
            '{"header_style": "modern", "show_logo": true, "show_company_details": true, "show_customer_details": true, "show_terms": true, "show_footer": true}',
            true,
            true
        FROM tenant_configs
        WHERE is_active = true
    """)
    
    op.execute("""
        INSERT INTO branding_templates (tenant_id, template_name, template_type, template_config, is_default, is_active)
        SELECT 
            tenant_id,
            'Default Report Template',
            'report',
            '{"header_style": "professional", "show_logo": true, "show_company_details": true, "show_footer": true}',
            true,
            true
        FROM tenant_configs
        WHERE is_active = true
    """)


def downgrade():
    """Remove branding enhancements from database"""
    
    # Drop branding analytics table
    op.drop_table('branding_analytics')
    
    # Drop branded documents table
    op.drop_table('branded_documents')
    
    # Drop branding preferences table
    op.drop_table('branding_preferences')
    
    # Drop branding templates table
    op.drop_table('branding_templates')
    
    # Drop branding assets table
    op.drop_table('branding_assets')
    
    # Remove branding columns from invoice_templates table
    op.drop_column('invoice_templates', 'custom_footer')
    op.drop_column('invoice_templates', 'custom_header')
    op.drop_column('invoice_templates', 'branding_config')
    op.drop_column('invoice_templates', 'tenant_id')
    
    # Remove branding columns from company_settings table
    op.drop_column('company_settings', 'custom_css')
    op.drop_column('company_settings', 'accent_color')
    op.drop_column('company_settings', 'secondary_color')
    op.drop_column('company_settings', 'primary_color')
    op.drop_column('company_settings', 'favicon_url')
    op.drop_column('company_settings', 'logo_url')
    
    # Drop indexes
    op.drop_index('idx_invoice_templates_tenant', 'invoice_templates')
