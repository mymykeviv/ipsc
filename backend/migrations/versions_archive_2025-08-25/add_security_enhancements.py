"""Add security enhancements to database

Revision ID: add_security_enhancements_001
Revises: 002
Create Date: 2024-01-20 11:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'add_security_enhancements_001'
down_revision = '002'
branch_labels = None
depends_on = None


def upgrade():
    """Add security enhancements to database"""
    
    # Enhance audit_trail table with additional security fields
    op.add_column('audit_trail', sa.Column('ip_address', sa.String(45), nullable=True))
    op.add_column('audit_trail', sa.Column('user_agent', sa.String(500), nullable=True))
    op.add_column('audit_trail', sa.Column('session_id', sa.String(100), nullable=True))
    op.add_column('audit_trail', sa.Column('request_id', sa.String(100), nullable=True))
    op.add_column('audit_trail', sa.Column('response_status', sa.Integer, nullable=True))
    op.add_column('audit_trail', sa.Column('execution_time', sa.Float, nullable=True))
    
    # Create indexes for audit trail queries
    op.create_index('idx_audit_trail_tenant_timestamp', 'audit_trail', ['tenant_id', 'created_at'])
    op.create_index('idx_audit_trail_event_type', 'audit_trail', ['event_type', 'created_at'])
    op.create_index('idx_audit_trail_user_id', 'audit_trail', ['user_id', 'created_at'])
    op.create_index('idx_audit_trail_ip_address', 'audit_trail', ['ip_address', 'created_at'])
    
    # Create security_events table for real-time security monitoring
    op.create_table('security_events',
        sa.Column('id', sa.Integer, primary_key=True, autoincrement=True),
        sa.Column('tenant_id', sa.String(50), nullable=False),
        sa.Column('event_type', sa.String(100), nullable=False),
        sa.Column('severity', sa.String(20), nullable=False, default='INFO'),
        sa.Column('user_id', sa.String(50), nullable=True),
        sa.Column('ip_address', sa.String(45), nullable=True),
        sa.Column('user_agent', sa.String(500), nullable=True),
        sa.Column('details', postgresql.JSONB, nullable=True),
        sa.Column('created_at', sa.DateTime, nullable=False, server_default=sa.func.now()),
        sa.Column('processed', sa.Boolean, nullable=False, default=False)
    )
    
    # Create indexes for security events
    op.create_index('idx_security_events_tenant_timestamp', 'security_events', ['tenant_id', 'created_at'])
    op.create_index('idx_security_events_type_severity', 'security_events', ['event_type', 'severity'])
    op.create_index('idx_security_events_unprocessed', 'security_events', ['processed', 'created_at'])
    
    # Create rate_limiting_logs table for rate limiting monitoring
    op.create_table('rate_limiting_logs',
        sa.Column('id', sa.Integer, primary_key=True, autoincrement=True),
        sa.Column('tenant_id', sa.String(50), nullable=False),
        sa.Column('user_id', sa.String(50), nullable=True),
        sa.Column('action', sa.String(50), nullable=False),
        sa.Column('ip_address', sa.String(45), nullable=True),
        sa.Column('request_count', sa.Integer, nullable=False, default=1),
        sa.Column('limit_exceeded', sa.Boolean, nullable=False, default=False),
        sa.Column('window_start', sa.DateTime, nullable=False),
        sa.Column('window_end', sa.DateTime, nullable=False),
        sa.Column('created_at', sa.DateTime, nullable=False, server_default=sa.func.now())
    )
    
    # Create indexes for rate limiting logs
    op.create_index('idx_rate_limiting_tenant_action', 'rate_limiting_logs', ['tenant_id', 'action', 'window_start'])
    op.create_index('idx_rate_limiting_ip_address', 'rate_limiting_logs', ['ip_address', 'window_start'])
    op.create_index('idx_rate_limiting_exceeded', 'rate_limiting_logs', ['limit_exceeded', 'created_at'])
    
    # Create encrypted_data table for storing encrypted sensitive information
    op.create_table('encrypted_data',
        sa.Column('id', sa.Integer, primary_key=True, autoincrement=True),
        sa.Column('tenant_id', sa.String(50), nullable=False),
        sa.Column('data_type', sa.String(50), nullable=False),
        sa.Column('encrypted_value', sa.Text, nullable=False),
        sa.Column('encryption_key_id', sa.String(100), nullable=False),
        sa.Column('created_at', sa.DateTime, nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime, nullable=False, server_default=sa.func.now(), onupdate=sa.func.now())
    )
    
    # Create indexes for encrypted data
    op.create_index('idx_encrypted_data_tenant_type', 'encrypted_data', ['tenant_id', 'data_type'])
    op.create_index('idx_encrypted_data_key_id', 'encrypted_data', ['encryption_key_id'])
    
    # Create user_sessions table for session management
    op.create_table('user_sessions',
        sa.Column('id', sa.Integer, primary_key=True, autoincrement=True),
        sa.Column('tenant_id', sa.String(50), nullable=False),
        sa.Column('user_id', sa.String(50), nullable=False),
        sa.Column('session_id', sa.String(100), nullable=False, unique=True),
        sa.Column('token_hash', sa.String(255), nullable=False),
        sa.Column('ip_address', sa.String(45), nullable=True),
        sa.Column('user_agent', sa.String(500), nullable=True),
        sa.Column('is_active', sa.Boolean, nullable=False, default=True),
        sa.Column('last_activity', sa.DateTime, nullable=False, server_default=sa.func.now()),
        sa.Column('expires_at', sa.DateTime, nullable=False),
        sa.Column('created_at', sa.DateTime, nullable=False, server_default=sa.func.now())
    )
    
    # Create indexes for user sessions
    op.create_index('idx_user_sessions_tenant_user', 'user_sessions', ['tenant_id', 'user_id'])
    op.create_index('idx_user_sessions_session_id', 'user_sessions', ['session_id'])
    op.create_index('idx_user_sessions_active', 'user_sessions', ['is_active', 'expires_at'])
    op.create_index('idx_user_sessions_last_activity', 'user_sessions', ['last_activity'])
    
    # Create security_policies table for tenant-specific security policies
    op.create_table('security_policies',
        sa.Column('id', sa.Integer, primary_key=True, autoincrement=True),
        sa.Column('tenant_id', sa.String(50), nullable=False),
        sa.Column('policy_type', sa.String(50), nullable=False),
        sa.Column('policy_name', sa.String(100), nullable=False),
        sa.Column('policy_config', postgresql.JSONB, nullable=False),
        sa.Column('is_active', sa.Boolean, nullable=False, default=True),
        sa.Column('created_at', sa.DateTime, nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime, nullable=False, server_default=sa.func.now(), onupdate=sa.func.now())
    )
    
    # Create indexes for security policies
    op.create_index('idx_security_policies_tenant_type', 'security_policies', ['tenant_id', 'policy_type'])
    op.create_index('idx_security_policies_active', 'security_policies', ['is_active'])
    
    # Add security-related columns to users table
    op.add_column('users', sa.Column('last_login', sa.DateTime, nullable=True))
    op.add_column('users', sa.Column('login_attempts', sa.Integer, nullable=False, default=0))
    op.add_column('users', sa.Column('locked_until', sa.DateTime, nullable=True))
    op.add_column('users', sa.Column('password_changed_at', sa.DateTime, nullable=True))
    op.add_column('users', sa.Column('two_factor_enabled', sa.Boolean, nullable=False, default=False))
    op.add_column('users', sa.Column('two_factor_secret', sa.String(100), nullable=True))
    
    # Create indexes for user security
    op.create_index('idx_users_last_login', 'users', ['last_login'])
    op.create_index('idx_users_locked_until', 'users', ['locked_until'])
    op.create_index('idx_users_login_attempts', 'users', ['login_attempts'])
    
    # Add security-related columns to roles table
    op.add_column('roles', sa.Column('permissions', postgresql.JSONB, nullable=True))
    op.add_column('roles', sa.Column('security_level', sa.Integer, nullable=False, default=1))
    
    # Create database performance monitoring table
    op.create_table('database_performance_logs',
        sa.Column('id', sa.Integer, primary_key=True, autoincrement=True),
        sa.Column('tenant_id', sa.String(50), nullable=False),
        sa.Column('query_hash', sa.String(64), nullable=False),
        sa.Column('query_text', sa.Text, nullable=False),
        sa.Column('execution_time', sa.Float, nullable=False),
        sa.Column('rows_affected', sa.Integer, nullable=True),
        sa.Column('connection_id', sa.String(50), nullable=True),
        sa.Column('created_at', sa.DateTime, nullable=False, server_default=sa.func.now())
    )
    
    # Create indexes for database performance logs
    op.create_index('idx_db_perf_tenant_time', 'database_performance_logs', ['tenant_id', 'created_at'])
    op.create_index('idx_db_perf_slow_queries', 'database_performance_logs', ['execution_time', 'created_at'])
    op.create_index('idx_db_perf_query_hash', 'database_performance_logs', ['query_hash', 'created_at'])
    
    # Insert default security policies for existing tenants
    op.execute("""
        INSERT INTO security_policies (tenant_id, policy_type, policy_name, policy_config)
        SELECT 
            tenant_id,
            'rate_limiting',
            'Default Rate Limiting Policy',
            '{"api_calls_per_minute": 100, "login_attempts_per_minute": 5, "file_uploads_per_minute": 20}'
        FROM tenant_configs
        WHERE is_active = true
    """)
    
    op.execute("""
        INSERT INTO security_policies (tenant_id, policy_type, policy_name, policy_config)
        SELECT 
            tenant_id,
            'password_policy',
            'Default Password Policy',
            '{"min_length": 8, "require_uppercase": true, "require_lowercase": true, "require_numbers": true, "require_special_chars": true, "max_age_days": 90}'
        FROM tenant_configs
        WHERE is_active = true
    """)
    
    op.execute("""
        INSERT INTO security_policies (tenant_id, policy_type, policy_name, policy_config)
        SELECT 
            tenant_id,
            'session_policy',
            'Default Session Policy',
            '{"session_timeout_minutes": 60, "max_concurrent_sessions": 3, "inactive_timeout_minutes": 30}'
        FROM tenant_configs
        WHERE is_active = true
    """)


def downgrade():
    """Remove security enhancements from database"""
    
    # Drop security policies
    op.drop_table('security_policies')
    
    # Drop database performance logs
    op.drop_table('database_performance_logs')
    
    # Drop user sessions
    op.drop_table('user_sessions')
    
    # Drop encrypted data
    op.drop_table('encrypted_data')
    
    # Drop rate limiting logs
    op.drop_table('rate_limiting_logs')
    
    # Drop security events
    op.drop_table('security_events')
    
    # Remove security columns from users table
    op.drop_column('users', 'two_factor_secret')
    op.drop_column('users', 'two_factor_enabled')
    op.drop_column('users', 'password_changed_at')
    op.drop_column('users', 'locked_until')
    op.drop_column('users', 'login_attempts')
    op.drop_column('users', 'last_login')
    
    # Remove security columns from roles table
    op.drop_column('roles', 'security_level')
    op.drop_column('roles', 'permissions')
    
    # Remove enhanced columns from audit_trail table
    op.drop_column('audit_trail', 'execution_time')
    op.drop_column('audit_trail', 'response_status')
    op.drop_column('audit_trail', 'request_id')
    op.drop_column('audit_trail', 'session_id')
    op.drop_column('audit_trail', 'user_agent')
    op.drop_column('audit_trail', 'ip_address')
    
    # Drop audit trail indexes
    op.drop_index('idx_audit_trail_ip_address', 'audit_trail')
    op.drop_index('idx_audit_trail_user_id', 'audit_trail')
    op.drop_index('idx_audit_trail_event_type', 'audit_trail')
    op.drop_index('idx_audit_trail_tenant_timestamp', 'audit_trail')
