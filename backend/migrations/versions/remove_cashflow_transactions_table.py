"""Remove redundant cashflow_transactions table

Revision ID: remove_cashflow_transactions_table
Revises: add_missing_gst_fields
Create Date: 2025-08-16 09:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'remove_cashflow_txn'
down_revision = 'add_missing_gst_fields'
branch_labels = None
depends_on = None


def upgrade():
    # Drop the redundant cashflow_transactions table
    op.drop_table('cashflow_transactions')


def downgrade():
    # Recreate the cashflow_transactions table (if needed for rollback)
    op.create_table('cashflow_transactions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('transaction_date', sa.DateTime(), nullable=False),
        sa.Column('type', sa.String(length=10), nullable=False),
        sa.Column('description', sa.String(length=200), nullable=False),
        sa.Column('reference_number', sa.String(length=100), nullable=True),
        sa.Column('payment_method', sa.String(length=50), nullable=False),
        sa.Column('amount', sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column('account_head', sa.String(length=50), nullable=False),
        sa.Column('source_type', sa.String(length=20), nullable=True),
        sa.Column('source_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
