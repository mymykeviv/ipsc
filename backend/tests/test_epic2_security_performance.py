"""
Epic 2 Tests: Database Performance & Security
Comprehensive tests for security features, database optimization, and performance monitoring
"""

import pytest
import asyncio
from unittest.mock import Mock, patch, AsyncMock
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession
import time
from datetime import datetime, timedelta

from app.main import create_app
from app.security_manager import SecurityManager, security_manager
from app.database_optimizer import DatabaseOptimizer, database_optimizer
from app.tenant_config import TenantConfigManager, tenant_config_manager


class TestSecurityManager:
    """Test security manager functionality"""
    
    @pytest.fixture
    def security_mgr(self):
        """Create a test security manager"""
        return SecurityManager()
    
    def test_encryption_key_generation(self, security_mgr):
        """Test encryption key generation"""
        # Test that encryption keys are initialized
        assert hasattr(security_mgr, 'master_key')
        assert hasattr(security_mgr, 'cipher_suite')
        assert security_mgr.master_key is not None
    
    @pytest.mark.asyncio
    async def test_tenant_key_generation(self, security_mgr):
        """Test tenant-specific key generation"""
        tenant_id = "test_tenant"
        key = await security_mgr.generate_tenant_key(tenant_id)
        
        assert key is not None
        assert tenant_id in security_mgr.encryption_keys
        assert len(key) > 0
    
    @pytest.mark.asyncio
    async def test_data_encryption_decryption(self, security_mgr):
        """Test data encryption and decryption"""
        tenant_id = "test_tenant"
        test_data = "sensitive information"
        
        # Generate key and encrypt data
        await security_mgr.generate_tenant_key(tenant_id)
        encrypted_data = security_mgr.encrypt_sensitive_data(test_data, tenant_id)
        
        # Verify data is encrypted
        assert encrypted_data != test_data
        assert len(encrypted_data) > len(test_data)
        
        # Decrypt data
        decrypted_data = security_mgr.decrypt_sensitive_data(encrypted_data, tenant_id)
        
        # Verify decryption
        assert decrypted_data == test_data
    
    @pytest.mark.asyncio
    async def test_rate_limiting(self, security_mgr):
        """Test rate limiting functionality"""
        tenant_id = "test_tenant"
        user_id = "test_user"
        action = "api_call"
        
        # Test rate limit check
        for i in range(5):  # Should allow 5 requests
            result = await security_mgr.check_rate_limit(tenant_id, user_id, action)
            assert result is True
        
        # Test rate limit exceeded
        result = await security_mgr.check_rate_limit(tenant_id, user_id, action)
        assert result is False  # Should be rate limited
    
    @pytest.mark.asyncio
    async def test_security_event_logging(self, security_mgr):
        """Test security event logging"""
        tenant_id = "test_tenant"
        user_id = "test_user"
        event_type = "LOGIN_ATTEMPT"
        
        # Log security event
        await security_mgr.log_security_event(
            event_type, tenant_id, user_id, 
            {"ip_address": "192.168.1.1"}, "INFO"
        )
        
        # Verify event was logged
        assert len(security_mgr.security_events) > 0
        event = security_mgr.security_events[-1]
        assert event['event_type'] == event_type
        assert event['tenant_id'] == tenant_id
        assert event['user_id'] == user_id
        assert event['severity'] == "INFO"
    
    def test_input_sanitization(self, security_mgr):
        """Test input sanitization"""
        # Test SQL injection prevention
        malicious_input = "'; DROP TABLE users; --"
        sanitized = security_mgr._sanitize_string(malicious_input)
        assert "DROP TABLE" not in sanitized
        assert ";" not in sanitized
        
        # Test XSS prevention
        xss_input = "<script>alert('xss')</script>"
        sanitized = security_mgr._sanitize_string(xss_input)
        assert "<script>" not in sanitized
        assert ">" not in sanitized
    
    @pytest.mark.asyncio
    async def test_token_generation_validation(self, security_mgr):
        """Test JWT token generation and validation"""
        tenant_id = "test_tenant"
        user_id = "test_user"
        
        # Generate token
        token = await security_mgr.generate_secure_token(tenant_id, user_id, 3600)
        assert token is not None
        
        # Validate token
        payload = await security_mgr.validate_token(token, tenant_id)
        assert payload is not None
        assert payload['tenant_id'] == tenant_id
        assert payload['user_id'] == user_id
    
    @pytest.mark.asyncio
    async def test_security_metrics(self, security_mgr):
        """Test security metrics collection"""
        tenant_id = "test_tenant"
        
        # Log some test events
        await security_mgr.log_security_event("LOGIN_ATTEMPT", tenant_id, "user1", {}, "INFO")
        await security_mgr.log_security_event("RATE_LIMIT_EXCEEDED", tenant_id, "user2", {}, "WARNING")
        await security_mgr.log_security_event("UNAUTHORIZED_ACCESS", tenant_id, "user3", {}, "ERROR")
        
        # Get metrics
        metrics = await security_mgr.get_security_metrics(tenant_id)
        
        assert metrics['total_events_24h'] >= 3
        assert metrics['warning_events'] >= 1
        assert metrics['error_events'] >= 1
        assert metrics['rate_limit_violations'] >= 1
        assert metrics['unauthorized_access'] >= 1


class TestDatabaseOptimizer:
    """Test database optimizer functionality"""
    
    @pytest.fixture
    def db_optimizer(self):
        """Create a test database optimizer"""
        return DatabaseOptimizer()
    
    @pytest.mark.asyncio
    async def test_optimal_pool_size_calculation(self, db_optimizer):
        """Test optimal pool size calculation"""
        # Mock tenant config
        with patch('app.database_optimizer.tenant_config_manager.get_tenant_config') as mock_get_config:
            mock_config = Mock()
            mock_config.domain = 'dental'
            mock_get_config.return_value = mock_config
            
            pool_size = await db_optimizer._calculate_optimal_pool_size('dental_tenant')
            assert pool_size == 8  # Base 5 + 3 for dental
            
            mock_config.domain = 'manufacturing'
            pool_size = await db_optimizer._calculate_optimal_pool_size('manufacturing_tenant')
            assert pool_size == 10  # Base 5 + 5 for manufacturing
    
    @pytest.mark.asyncio
    async def test_database_optimization(self, db_optimizer):
        """Test database optimization process"""
        tenant_id = "test_tenant"
        database_url = "postgresql://test:test@localhost:5432/test_db"
        
        # Mock the optimization process
        with patch.object(db_optimizer, '_create_optimized_engine') as mock_create_engine:
            with patch.object(db_optimizer, '_run_database_optimizations') as mock_optimize:
                with patch.object(db_optimizer, '_setup_database_monitoring') as mock_monitor:
                    
                    mock_engine = AsyncMock()
                    mock_create_engine.return_value = mock_engine
                    
                    result = await db_optimizer.optimize_tenant_database(tenant_id, database_url)
                    
                    assert result is True
                    mock_create_engine.assert_called_once_with(tenant_id, database_url)
                    mock_optimize.assert_called_once_with(mock_engine, tenant_id)
                    mock_monitor.assert_called_once_with(mock_engine, tenant_id)
    
    @pytest.mark.asyncio
    async def test_performance_metrics(self, db_optimizer):
        """Test performance metrics collection"""
        tenant_id = "test_tenant"
        
        # Initialize metrics
        db_optimizer.performance_metrics[tenant_id] = {
            'query_count': 100,
            'slow_queries': 5,
            'connection_usage': 0.75,
            'last_optimization': time.time()
        }
        
        # Get metrics
        metrics = await db_optimizer.get_performance_metrics(tenant_id)
        
        assert metrics['query_count'] == 100
        assert metrics['slow_queries'] == 5
        assert metrics['connection_usage'] == 0.75
        assert 'last_optimization' in metrics
    
    @pytest.mark.asyncio
    async def test_slow_query_detection(self, db_optimizer):
        """Test slow query detection and tracking"""
        tenant_id = "test_tenant"
        
        # Add some test queries
        db_optimizer.query_stats[tenant_id] = [
            {
                'statement': 'SELECT * FROM users',
                'execution_time': 0.1,
                'timestamp': time.time()
            },
            {
                'statement': 'SELECT * FROM large_table',
                'execution_time': 2.5,
                'timestamp': time.time()
            },
            {
                'statement': 'SELECT * FROM another_large_table',
                'execution_time': 1.8,
                'timestamp': time.time()
            }
        ]
        
        # Get slow queries
        slow_queries = await db_optimizer.get_slow_queries(tenant_id, limit=5)
        
        assert len(slow_queries) == 2  # Only queries > 0.5s
        assert slow_queries[0]['execution_time'] == 2.5  # Sorted by execution time
        assert slow_queries[1]['execution_time'] == 1.8


class TestSecurityMiddleware:
    """Test security middleware functionality"""
    
    @pytest.fixture
    def security_middleware(self):
        """Create security middleware instance"""
        from app.middleware.security import SecurityMiddleware
        return SecurityMiddleware()
    
    def test_public_endpoint_detection(self, security_middleware):
        """Test public endpoint detection"""
        assert security_middleware._is_public_endpoint('/health') is True
        assert security_middleware._is_public_endpoint('/docs') is True
        assert security_middleware._is_public_endpoint('/api/products') is False
        assert security_middleware._is_public_endpoint('/api/invoices') is False
    
    def test_action_type_detection(self, security_middleware):
        """Test action type detection for rate limiting"""
        request = Mock()
        
        # Test login action
        request.url.path = "/api/auth/login"
        request.method = "POST"
        action = security_middleware._get_action_type(request)
        assert action == "login"
        
        # Test report generation
        request.url.path = "/api/reports/financial"
        request.method = "GET"
        action = security_middleware._get_action_type(request)
        assert action == "report_generation"
        
        # Test file upload
        request.url.path = "/api/upload/document"
        request.method = "POST"
        action = security_middleware._get_action_type(request)
        assert action == "file_upload"
        
        # Test regular API call
        request.url.path = "/api/products"
        request.method = "GET"
        action = security_middleware._get_action_type(request)
        assert action == "api_call"
    
    def test_client_ip_extraction(self, security_middleware):
        """Test client IP address extraction"""
        request = Mock()
        
        # Test X-Forwarded-For header
        request.headers = {"X-Forwarded-For": "192.168.1.1, 10.0.0.1"}
        ip = security_middleware._get_client_ip(request)
        assert ip == "192.168.1.1"
        
        # Test X-Real-IP header
        request.headers = {"X-Real-IP": "203.0.113.1"}
        ip = security_middleware._get_client_ip(request)
        assert ip == "203.0.113.1"
        
        # Test direct connection
        request.headers = {}
        request.client = Mock()
        request.client.host = "127.0.0.1"
        ip = security_middleware._get_client_ip(request)
        assert ip == "127.0.0.1"


class TestAuditMiddleware:
    """Test audit middleware functionality"""
    
    @pytest.fixture
    def audit_middleware(self):
        """Create audit middleware instance"""
        from app.middleware.security import AuditMiddleware
        return AuditMiddleware()
    
    def test_resource_type_detection(self, audit_middleware):
        """Test resource type detection"""
        assert audit_middleware._get_resource_type('/api/products') == 'products'
        assert audit_middleware._get_resource_type('/api/invoices') == 'invoices'
        assert audit_middleware._get_resource_type('/api/purchases') == 'purchases'
        assert audit_middleware._get_resource_type('/api/payments') == 'payments'
        assert audit_middleware._get_resource_type('/api/parties') == 'parties'
        assert audit_middleware._get_resource_type('/api/expenses') == 'expenses'
        assert audit_middleware._get_resource_type('/api/reports') == 'reports'
        assert audit_middleware._get_resource_type('/api/unknown') is None
    
    def test_action_detection(self, audit_middleware):
        """Test action detection from HTTP method"""
        assert audit_middleware._get_action('GET') == 'read'
        assert audit_middleware._get_action('POST') == 'create'
        assert audit_middleware._get_action('PUT') == 'update'
        assert audit_middleware._get_action('DELETE') == 'delete'
        assert audit_middleware._get_action('PATCH') == 'update'
        assert audit_middleware._get_action('OPTIONS') is None


class TestEpic2Integration:
    """Integration tests for Epic 2 features"""
    
    @pytest.fixture
    def app(self):
        """Create test app with Epic 2 features enabled"""
        with patch.dict('os.environ', {
            'MULTI_TENANT_ENABLED': 'true',
            'SECURITY_ENABLED': 'true',
            'DATABASE_OPTIMIZATION_ENABLED': 'true'
        }):
            return create_app()
    
    @pytest.fixture
    def client(self, app):
        """Create test client"""
        return TestClient(app)
    
    def test_security_status_endpoint(self, client):
        """Test security status endpoint"""
        response = client.get("/api/security/status")
        
        assert response.status_code == 200
        data = response.json()
        assert data["security_enabled"] is True
        assert data["encryption_available"] is True
        assert data["rate_limiting_enabled"] is True
        assert data["audit_logging_enabled"] is True
    
    def test_database_performance_endpoint(self, client):
        """Test database performance endpoint"""
        response = client.get("/api/database/performance/dental_clinic_abc")
        
        assert response.status_code == 200
        data = response.json()
        assert data["tenant_id"] == "dental_clinic_abc"
        assert "performance_metrics" in data
    
    def test_slow_queries_endpoint(self, client):
        """Test slow queries endpoint"""
        response = client.get("/api/database/slow-queries/dental_clinic_abc")
        
        assert response.status_code == 200
        data = response.json()
        assert data["tenant_id"] == "dental_clinic_abc"
        assert "slow_queries" in data
        assert "count" in data
    
    def test_health_check_with_epic2_features(self, client):
        """Test health check includes Epic 2 feature status"""
        response = client.get("/health")
        
        assert response.status_code == 200
        data = response.json()
        assert data["security_enabled"] is True
        assert data["database_optimization_enabled"] is True
    
    def test_detailed_health_check_with_epic2(self, client):
        """Test detailed health check includes Epic 2 information"""
        response = client.get("/health/detailed")
        
        assert response.status_code == 200
        data = response.json()
        
        # Check security information
        assert "security" in data
        assert data["security"]["enabled"] is True
        assert data["security"]["encryption_available"] is True
        assert data["security"]["rate_limiting_enabled"] is True
        assert data["security"]["audit_logging_enabled"] is True
        
        # Check database optimization information
        assert "database_optimization" in data
        assert data["database_optimization"]["enabled"] is True
        assert data["database_optimization"]["connection_pools_configured"] is True
        assert data["database_optimization"]["performance_monitoring_enabled"] is True


class TestSecurityPolicies:
    """Test security policy enforcement"""
    
    @pytest.mark.asyncio
    async def test_password_policy_validation(self):
        """Test password policy validation"""
        # This would test password complexity requirements
        # Implementation would depend on specific password policy rules
        pass
    
    @pytest.mark.asyncio
    async def test_session_policy_enforcement(self):
        """Test session policy enforcement"""
        # This would test session timeout and concurrent session limits
        # Implementation would depend on specific session policy rules
        pass
    
    @pytest.mark.asyncio
    async def test_rate_limiting_policy(self):
        """Test rate limiting policy enforcement"""
        # This would test different rate limits for different actions
        # Implementation would depend on specific rate limiting rules
        pass


if __name__ == "__main__":
    pytest.main([__file__])
