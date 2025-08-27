"""add company settings address/contact fields

Revision ID: 9f2a1c3d4e56
Revises: 8aa1efb69f09
Create Date: 2025-08-26 22:18:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '9f2a1c3d4e56'
down_revision = '8aa1efb69f09'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add nullable address/contact fields to company_settings
    with op.batch_alter_table('company_settings') as batch_op:
        batch_op.add_column(sa.Column('address_line1', sa.String(length=200), nullable=True))
        batch_op.add_column(sa.Column('address_line2', sa.String(length=200), nullable=True))
        batch_op.add_column(sa.Column('city', sa.String(length=100), nullable=True))
        batch_op.add_column(sa.Column('pincode', sa.String(length=10), nullable=True))
        batch_op.add_column(sa.Column('phone', sa.String(length=20), nullable=True))
        batch_op.add_column(sa.Column('email', sa.String(length=100), nullable=True))


def downgrade() -> None:
    # Remove the address/contact fields from company_settings
    with op.batch_alter_table('company_settings') as batch_op:
        batch_op.drop_column('email')
        batch_op.drop_column('phone')
        batch_op.drop_column('pincode')
        batch_op.drop_column('city')
        batch_op.drop_column('address_line2')
        batch_op.drop_column('address_line1')
