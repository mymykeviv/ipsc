"""Add invoice templates table

Revision ID: add_invoice_templates
Revises: add_purchase_order_management
Create Date: 2024-01-15 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import sqlite

# revision identifiers, used by Alembic.
revision = 'add_invoice_templates'
down_revision = 'add_purchase_order_management'
branch_labels = None
depends_on = None


def upgrade():
    # Create invoice_templates table (with SQLite compatibility)
    try:
        op.create_table('invoice_templates',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('description', sa.String(length=200), nullable=True),
        sa.Column('template_type', sa.String(length=20), nullable=False, default='professional'),
        sa.Column('primary_color', sa.String(length=7), nullable=False, default='#2c3e50'),
        sa.Column('secondary_color', sa.String(length=7), nullable=False, default='#3498db'),
        sa.Column('accent_color', sa.String(length=7), nullable=False, default='#e74c3c'),
        sa.Column('header_font', sa.String(length=50), nullable=False, default='Helvetica-Bold'),
        sa.Column('body_font', sa.String(length=50), nullable=False, default='Helvetica'),
        sa.Column('header_font_size', sa.Integer(), nullable=False, default=18),
        sa.Column('body_font_size', sa.Integer(), nullable=False, default=10),
        sa.Column('show_logo', sa.Boolean(), nullable=False, default=True),
        sa.Column('logo_position', sa.String(length=20), nullable=False, default='top-left'),
        sa.Column('show_company_details', sa.Boolean(), nullable=False, default=True),
        sa.Column('show_customer_details', sa.Boolean(), nullable=False, default=True),
        sa.Column('show_supplier_details', sa.Boolean(), nullable=False, default=True),
        sa.Column('show_terms', sa.Boolean(), nullable=False, default=True),
        sa.Column('show_notes', sa.Boolean(), nullable=False, default=True),
        sa.Column('show_footer', sa.Boolean(), nullable=False, default=True),
        sa.Column('header_text', sa.String(length=100), nullable=False, default='TAX INVOICE'),
        sa.Column('footer_text', sa.String(length=200), nullable=False, default='Thank you for your business!'),
        sa.Column('terms_text', sa.String(length=200), nullable=False, default='Payment is due within the terms specified above.'),
        sa.Column('is_active', sa.Boolean(), nullable=False, default=True),
        sa.Column('is_default', sa.Boolean(), nullable=False, default=False),
        sa.Column('created_at', sa.DateTime(), nullable=False, default=sa.func.current_timestamp()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, default=sa.func.current_timestamp(), onupdate=sa.func.current_timestamp()),
        sa.PrimaryKeyConstraint('id')
        )
    except Exception:
        pass  # Table might already exist

    # Create indexes (with SQLite compatibility)
    try:
        op.create_index(op.f('ix_invoice_templates_is_active'), 'invoice_templates', ['is_active'], unique=False)
    except Exception:
        pass  # Index might already exist
        
    try:
        op.create_index(op.f('ix_invoice_templates_is_default'), 'invoice_templates', ['is_default'], unique=False)
    except Exception:
        pass  # Index might already exist
        
    try:
        op.create_index(op.f('ix_invoice_templates_template_type'), 'invoice_templates', ['template_type'], unique=False)
    except Exception:
        pass  # Index might already exist

    # Insert default template (with SQLite compatibility)
    try:
        op.execute("""
        INSERT INTO invoice_templates (
            name, description, template_type, primary_color, secondary_color, accent_color,
            header_font, body_font, header_font_size, body_font_size,
            show_logo, logo_position, show_company_details, show_customer_details,
            show_supplier_details, show_terms, show_notes, show_footer,
            header_text, footer_text, terms_text, is_active, is_default,
            created_at, updated_at
        ) VALUES (
            'Default Professional',
            'Default professional invoice template with clean design',
            'professional',
            '#2c3e50',
            '#3498db',
            '#e74c3c',
            'Helvetica-Bold',
            'Helvetica',
            18,
            10,
            1,
            'top-left',
            1,
            1,
            1,
            1,
            1,
            1,
            'TAX INVOICE',
            'Thank you for your business!',
            'Payment is due within the terms specified above.',
            1,
            1,
            datetime('now'),
            datetime('now')
        )
        """)
    except Exception:
        pass  # Template might already exist


def downgrade():
    # Drop indexes
    op.drop_index(op.f('ix_invoice_templates_template_type'), table_name='invoice_templates')
    op.drop_index(op.f('ix_invoice_templates_is_default'), table_name='invoice_templates')
    op.drop_index(op.f('ix_invoice_templates_is_active'), table_name='invoice_templates')
    
    # Drop table
    op.drop_table('invoice_templates')
