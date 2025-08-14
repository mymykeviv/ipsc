"""Make gst_rate nullable in products table

Revision ID: make_gst_rate_nullable
Revises: add_product_item_type
Create Date: 2025-08-14 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'make_gst_rate_nullable'
down_revision = 'add_product_item_type'
branch_labels = None
depends_on = None


def upgrade():
    # Make gst_rate nullable in products table
    op.alter_column('products', 'gst_rate',
                    existing_type=sa.Float(),
                    nullable=True)


def downgrade():
    # Make gst_rate not nullable in products table
    op.alter_column('products', 'gst_rate',
                    existing_type=sa.Float(),
                    nullable=False)
