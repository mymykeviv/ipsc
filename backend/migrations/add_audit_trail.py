"""Add audit trail table

Revision ID: add_audit_trail
Revises: add_payment_management
Create Date: 2024-01-15 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_audit_trail'
down_revision = 'add_payment_management'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table('audit_trail',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('action', sa.String(length=50), nullable=False),
        sa.Column('table_name', sa.String(length=50), nullable=False),
        sa.Column('record_id', sa.Integer(), nullable=True),
        sa.Column('old_values', sa.Text(), nullable=True),
        sa.Column('new_values', sa.Text(), nullable=True),
        sa.Column('ip_address', sa.String(length=45), nullable=True),
        sa.Column('user_agent', sa.String(length=500), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create index for better performance
    op.create_index('idx_audit_trail_user_id', 'audit_trail', ['user_id'])
    op.create_index('idx_audit_trail_table_name', 'audit_trail', ['table_name'])
    op.create_index('idx_audit_trail_created_at', 'audit_trail', ['created_at'])


def downgrade() -> None:
    op.drop_index('idx_audit_trail_created_at', table_name='audit_trail')
    op.drop_index('idx_audit_trail_table_name', table_name='audit_trail')
    op.drop_index('idx_audit_trail_user_id', table_name='audit_trail')
    op.drop_table('audit_trail')
