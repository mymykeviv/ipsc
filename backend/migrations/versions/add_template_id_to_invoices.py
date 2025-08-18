"""Add template_id to invoices table

Revision ID: add_template_id_to_invoices
Revises: merge_heads
Create Date: 2024-08-18 11:30:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'add_template_id_to_invoices'
down_revision = 'merge_heads'
branch_labels = None
depends_on = None

def upgrade():
    # Add template_id column to invoices table
    op.add_column('invoices', sa.Column('template_id', sa.Integer(), nullable=True))
    op.create_foreign_key('fk_invoices_template_id', 'invoices', 'invoice_templates', ['template_id'], ['id'])

def downgrade():
    # Remove foreign key constraint and column
    op.drop_constraint('fk_invoices_template_id', 'invoices', type_='foreignkey')
    op.drop_column('invoices', 'template_id')
