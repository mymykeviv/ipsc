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
    # Add nullable address/contact fields to company_settings if they don't already exist
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    table = 'company_settings'

    columns = {
        'address_line1': sa.String(length=200),
        'address_line2': sa.String(length=200),
        'city': sa.String(length=100),
        'pincode': sa.String(length=10),
        'phone': sa.String(length=20),
        'email': sa.String(length=100),
    }

    existing_cols = {col['name'] for col in inspector.get_columns(table)}
    with op.batch_alter_table(table) as batch_op:
        for col_name, col_type in columns.items():
            if col_name not in existing_cols:
                batch_op.add_column(sa.Column(col_name, col_type, nullable=True))


def downgrade() -> None:
    # Remove the address/contact fields from company_settings if they exist
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    table = 'company_settings'

    ordered = ['email', 'phone', 'pincode', 'city', 'address_line2', 'address_line1']

    existing_cols = {col['name'] for col in inspector.get_columns(table)}
    with op.batch_alter_table(table) as batch_op:
        for col_name in ordered:
            if col_name in existing_cols:
                batch_op.drop_column(col_name)
