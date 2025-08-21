"""Merge all migration heads

Revision ID: 4edced70000b
Revises: add_is_active_to_parties, add_manufacturing_features_001, fix_company_settings_schema
Create Date: 2025-08-21 20:18:09.195033

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '4edced70000b'
down_revision = ('add_is_active_to_parties', 'add_manufacturing_features_001', 'fix_company_settings_schema')
branch_labels = None
depends_on = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
