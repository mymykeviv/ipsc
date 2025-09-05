"""Add reference_bill_number to purchases table

Revision ID: add_reference_bill_number
Revises: sqlite_compatibility
Create Date: 2025-01-21 14:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import text

# revision identifiers, used by Alembic.
revision = 'add_reference_bill_number'
down_revision = 'sqlite_compatibility'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Add reference_bill_number column to purchases table"""
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    
    # Check if purchases table exists
    tables = inspector.get_table_names()
    if 'purchases' in tables:
        # Check if reference_bill_number column already exists
        purchases_columns = {col['name'] for col in inspector.get_columns('purchases')}
        
        if 'reference_bill_number' not in purchases_columns:
            # Add the reference_bill_number column
            with op.batch_alter_table('purchases') as batch_op:
                batch_op.add_column(
                    sa.Column('reference_bill_number', sa.String(50), nullable=True)
                )
            print("Added reference_bill_number column to purchases table")
        else:
            print("reference_bill_number column already exists in purchases table")
    else:
        print("purchases table does not exist, skipping migration")


def downgrade() -> None:
    """Remove reference_bill_number column from purchases table"""
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    
    # Check if purchases table exists
    tables = inspector.get_table_names()
    if 'purchases' in tables:
        # Check if reference_bill_number column exists
        purchases_columns = {col['name'] for col in inspector.get_columns('purchases')}
        
        if 'reference_bill_number' in purchases_columns:
            # Remove the reference_bill_number column
            with op.batch_alter_table('purchases') as batch_op:
                batch_op.drop_column('reference_bill_number')
            print("Removed reference_bill_number column from purchases table")
        else:
            print("reference_bill_number column does not exist in purchases table")
    else:
        print("purchases table does not exist, skipping migration")