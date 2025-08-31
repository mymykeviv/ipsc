"""SQLite compatibility update for existing migrations

Revision ID: sqlite_compatibility
Revises: 9f2a1c3d4e56
Create Date: 2025-01-21 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import text

# revision identifiers, used by Alembic.
revision = 'sqlite_compatibility'
down_revision = '9f2a1c3d4e56'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Ensure SQLite compatibility for all existing tables and constraints"""
    bind = op.get_bind()
    
    # Check if we're using SQLite
    if 'sqlite' in str(bind.engine.url):
        # Enable foreign key constraints for SQLite
        op.execute(text("PRAGMA foreign_keys=ON"))
        
        # Ensure all tables have proper SQLite-compatible constraints
        inspector = sa.inspect(bind)
        
        # Check if parties table has is_active column, add if missing
        parties_columns = {col['name'] for col in inspector.get_columns('parties')}
        if 'is_active' not in parties_columns:
            with op.batch_alter_table('parties') as batch_op:
                batch_op.add_column(sa.Column('is_active', sa.Boolean(), nullable=True, default=True))
            
            # Update existing records to have is_active = True by default
            op.execute(text("UPDATE parties SET is_active = 1 WHERE is_active IS NULL"))
        
        # Ensure proper indexes exist for performance
        try:
            # Add index on parties.is_active for soft delete filtering
            op.create_index('idx_parties_is_active', 'parties', ['is_active'])
        except Exception:
            pass  # Index might already exist
        
        try:
            # Add composite index for tenant-based queries
            op.create_index('idx_parties_tenant_active', 'parties', ['tenant_id', 'is_active'])
        except Exception:
            pass  # Index might already exist
        
        # Ensure all foreign key relationships are properly defined
        # This is handled by SQLAlchemy models, but we ensure constraints are enabled
        op.execute(text("PRAGMA foreign_key_check"))


def downgrade() -> None:
    """Revert SQLite compatibility changes"""
    bind = op.get_bind()
    
    if 'sqlite' in str(bind.engine.url):
        # Remove indexes if they exist
        try:
            op.drop_index('idx_parties_tenant_active')
        except Exception:
            pass
        
        try:
            op.drop_index('idx_parties_is_active')
        except Exception:
            pass