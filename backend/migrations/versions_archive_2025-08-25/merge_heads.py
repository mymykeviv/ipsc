"""Merge heads

Revision ID: merge_heads
Revises: add_invoice_templates, remove_cashflow_txn
Create Date: 2024-01-15 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'merge_heads'
down_revision = ('add_invoice_templates', 'remove_cashflow_txn')
branch_labels = None
depends_on = None


def upgrade():
    pass


def downgrade():
    pass
