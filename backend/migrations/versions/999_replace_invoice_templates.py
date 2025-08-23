"""Replace old invoice templates with new GST invoice templates

Revision ID: 999
Revises: aa6fe1a15eaf
Create Date: 2024-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '999'
down_revision = 'aa6fe1a15eaf'
branch_labels = None
depends_on = None


def upgrade():
    # Drop the old invoice_templates table
    op.drop_table('invoice_templates')
    
    # Create the new gst_invoice_templates table
    op.create_table('gst_invoice_templates',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('tenant_id', sa.Integer(), nullable=True),
        sa.Column('template_id', sa.String(length=50), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('description', sa.String(length=500), nullable=True),
        sa.Column('requires_gst', sa.Boolean(), nullable=False),
        sa.Column('requires_hsn', sa.Boolean(), nullable=False),
        sa.Column('title', sa.String(length=50), nullable=False),
        sa.Column('template_config', sa.Text(), nullable=False),
        sa.Column('paper_sizes', sa.String(length=50), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('is_default', sa.Boolean(), nullable=False),
        sa.Column('sort_order', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('template_id')
    )


def downgrade():
    # Drop the new gst_invoice_templates table
    op.drop_table('gst_invoice_templates')
    
    # Recreate the old invoice_templates table
    op.create_table('invoice_templates',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('tenant_id', sa.Integer(), nullable=True),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('description', sa.String(length=200), nullable=True),
        sa.Column('template_type', sa.String(length=20), nullable=False),
        sa.Column('primary_color', sa.String(length=7), nullable=False),
        sa.Column('secondary_color', sa.String(length=7), nullable=False),
        sa.Column('accent_color', sa.String(length=7), nullable=False),
        sa.Column('header_font', sa.String(length=50), nullable=False),
        sa.Column('body_font', sa.String(length=50), nullable=False),
        sa.Column('header_font_size', sa.Integer(), nullable=False),
        sa.Column('body_font_size', sa.Integer(), nullable=False),
        sa.Column('show_logo', sa.Boolean(), nullable=False),
        sa.Column('logo_position', sa.String(length=20), nullable=False),
        sa.Column('show_company_details', sa.Boolean(), nullable=False),
        sa.Column('show_customer_details', sa.Boolean(), nullable=False),
        sa.Column('show_supplier_details', sa.Boolean(), nullable=False),
        sa.Column('show_terms', sa.Boolean(), nullable=False),
        sa.Column('show_notes', sa.Boolean(), nullable=False),
        sa.Column('show_footer', sa.Boolean(), nullable=False),
        sa.Column('header_text', sa.String(length=100), nullable=False),
        sa.Column('footer_text', sa.String(length=200), nullable=False),
        sa.Column('terms_text', sa.String(length=200), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('is_default', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
