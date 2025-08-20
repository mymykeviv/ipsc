"""
Multi-Tenant Architecture Tests
Tests for tenant configuration, routing, and database isolation
"""

import pytest
import asyncio
from unittest.mock import Mock, patch, AsyncMock
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.main import create_app
from app.tenant_config import TenantConfig, TenantConfigManager, tenant_config_manager
from app.middleware.tenant import TenantMiddleware, FeatureAccessMiddleware


class TestTenantConfig:
    """Test tenant configuration class"""
    
    def test_tenant_config_creation(self):
        """Test creating a tenant configuration"""
        config_data = {
            'database_url': 'postgresql://test:test@localhost:5432/test_db',
            'domain': 'dental',
            'branding': {
                'company_name': 'Test Dental',
                'primary_color': '#123456'
            },
            'features': ['patient_management', 'treatment_tracking'],
            'gst_number': 'GST123456789',
            'contact_info': {
                'phone': '+91-1234567890',
                'email': 'test@dental.com'
            },
            'is_active': True
        }
        
        config = TenantConfig('test_tenant', config_data)
        
        assert config.tenant_id == 'test_tenant'
        assert config.database_url == config_data['database_url']
        assert config.domain == 'dental'
        assert config.branding['company_name'] == 'Test Dental'
        assert 'patient_management' in config.features
        assert config.gst_number == 'GST123456789'
        assert config.is_active is True
    
    def test_tenant_config_to_dict(self):
        """Test converting tenant config to dictionary"""
        config_data = {
            'database_url': 'postgresql://test:test@localhost:5432/test_db',
            'domain': 'manufacturing',
            'branding': {'company_name': 'Test Manufacturing'},
            'features': ['bom_management'],
            'gst_number': 'GST987654321',
            'contact_info': {'phone': '+91-9876543210'},
            'is_active': True
        }
        
        config = TenantConfig('test_tenant', config_data)
        config_dict = config.to_dict()
        
        assert config_dict['tenant_id'] == 'test_tenant'
        assert config_dict['database_url'] == config_data['database_url']
        assert config_dict['domain'] == 'manufacturing'
        assert config_dict['features'] == ['bom_management']


class TestTenantConfigManager:
    """Test tenant configuration manager"""
    
    @pytest.fixture
    def config_manager(self):
        """Create a test tenant config manager"""
        return TenantConfigManager()
    
    @pytest.mark.asyncio
    async def test_get_tenant_config(self, config_manager):
        """Test getting tenant configuration"""
        # Add test tenant
        test_config = {
            'database_url': 'postgresql://test:test@localhost:5432/test_db',
            'domain': 'dental',
            'branding': {'company_name': 'Test Dental'},
            'features': ['patient_management'],
            'gst_number': 'GST123456789',
            'contact_info': {},
            'is_active': True
        }
        
        await config_manager.add_tenant('test_tenant', test_config)
        
        # Get tenant config
        config = await config_manager.get_tenant_config('test_tenant')
        
        assert config is not None
        assert config.tenant_id == 'test_tenant'
        assert config.domain == 'dental'
    
    @pytest.mark.asyncio
    async def test_has_feature(self, config_manager):
        """Test feature access checking"""
        test_config = {
            'database_url': 'postgresql://test:test@localhost:5432/test_db',
            'domain': 'dental',
            'branding': {'company_name': 'Test Dental'},
            'features': ['patient_management', 'treatment_tracking'],
            'gst_number': 'GST123456789',
            'contact_info': {},
            'is_active': True
        }
        
        await config_manager.add_tenant('test_tenant', test_config)
        
        # Test feature access
        assert await config_manager.has_feature('test_tenant', 'patient_management') is True
        assert await config_manager.has_feature('test_tenant', 'bom_management') is False
        assert await config_manager.has_feature('nonexistent_tenant', 'patient_management') is False
    
    @pytest.mark.asyncio
    async def test_get_branding(self, config_manager):
        """Test getting tenant branding"""
        test_config = {
            'database_url': 'postgresql://test:test@localhost:5432/test_db',
            'domain': 'dental',
            'branding': {
                'company_name': 'Test Dental',
                'primary_color': '#123456',
                'logo_url': '/assets/test_logo.png'
            },
            'features': ['patient_management'],
            'gst_number': 'GST123456789',
            'contact_info': {},
            'is_active': True
        }
        
        await config_manager.add_tenant('test_tenant', test_config)
        
        branding = await config_manager.get_branding('test_tenant')
        
        assert branding['company_name'] == 'Test Dental'
        assert branding['primary_color'] == '#123456'
        assert branding['logo_url'] == '/assets/test_logo.png'
    
    @pytest.mark.asyncio
    async def test_list_tenants(self, config_manager):
        """Test listing active tenants"""
        # Add test tenants
        test_config = {
            'database_url': 'postgresql://test:test@localhost:5432/test_db',
            'domain': 'dental',
            'branding': {'company_name': 'Test Dental'},
            'features': ['patient_management'],
            'gst_number': 'GST123456789',
            'contact_info': {},
            'is_active': True
        }
        
        await config_manager.add_tenant('active_tenant', test_config)
        await config_manager.add_tenant('inactive_tenant', {**test_config, 'is_active': False})
        
        tenants = await config_manager.list_tenants()
        
        assert 'active_tenant' in tenants
        assert 'inactive_tenant' not in tenants


class TestTenantMiddleware:
    """Test tenant middleware"""
    
    @pytest.fixture
    def middleware(self):
        """Create tenant middleware instance"""
        return TenantMiddleware()
    
    def test_extract_tenant_id_from_subdomain(self, middleware):
        """Test extracting tenant ID from subdomain"""
        request = Mock()
        request.headers = {'host': 'dental-clinic-abc.app.com'}
        
        tenant_id = middleware.extract_tenant_id(request)
        
        assert tenant_id == 'dental-clinic-abc'
    
    def test_extract_tenant_id_from_header(self, middleware):
        """Test extracting tenant ID from header"""
        request = Mock()
        request.headers = {'host': 'app.com', 'X-Tenant-ID': 'manufacturing-xyz'}
        
        tenant_id = middleware.extract_tenant_id(request)
        
        assert tenant_id == 'manufacturing-xyz'
    
    def test_extract_tenant_id_from_query_param(self, middleware):
        """Test extracting tenant ID from query parameter"""
        request = Mock()
        request.headers = {'host': 'app.com'}
        request.query_params = {'tenant_id': 'test-tenant'}
        
        tenant_id = middleware.extract_tenant_id(request)
        
        assert tenant_id == 'test-tenant'
    
    def test_is_public_endpoint(self, middleware):
        """Test public endpoint detection"""
        assert middleware.is_public_endpoint('/health') is True
        assert middleware.is_public_endpoint('/docs') is True
        assert middleware.is_public_endpoint('/api/products') is False
        assert middleware.is_public_endpoint('/api/invoices') is False


class TestFeatureAccessMiddleware:
    """Test feature access middleware"""
    
    @pytest.fixture
    def middleware(self):
        """Create feature access middleware instance"""
        return FeatureAccessMiddleware()
    
    def test_get_required_feature(self, middleware):
        """Test getting required feature for path"""
        assert middleware.get_required_feature('/api/patients') == 'patient_management'
        assert middleware.get_required_feature('/api/bom') == 'bom_management'
        assert middleware.get_required_feature('/api/products') is None
        assert middleware.get_required_feature('/api/invoices') is None
    
    def test_is_public_endpoint(self, middleware):
        """Test public endpoint detection"""
        assert middleware.is_public_endpoint('/health') is True
        assert middleware.is_public_endpoint('/docs') is True
        assert middleware.is_public_endpoint('/api/products') is False


class TestMultiTenantIntegration:
    """Integration tests for multi-tenant functionality"""
    
    @pytest.fixture
    def app(self):
        """Create test app with multi-tenant enabled"""
        with patch.dict('os.environ', {'MULTI_TENANT_ENABLED': 'true'}):
            return create_app()
    
    @pytest.fixture
    def client(self, app):
        """Create test client"""
        return TestClient(app)
    
    def test_health_check_with_multi_tenant(self, client):
        """Test health check endpoint with multi-tenant info"""
        response = client.get("/health")
        
        assert response.status_code == 200
        data = response.json()
        assert data["multi_tenant_enabled"] is True
    
    def test_tenant_listing_endpoint(self, client):
        """Test tenant listing endpoint"""
        response = client.get("/api/tenants")
        
        assert response.status_code == 200
        data = response.json()
        assert "tenants" in data
        assert "count" in data
        assert isinstance(data["tenants"], list)
    
    def test_tenant_config_endpoint(self, client):
        """Test tenant configuration endpoint"""
        response = client.get("/api/tenants/dental_clinic_abc/config")
        
        assert response.status_code == 200
        data = response.json()
        assert data["tenant_id"] == "dental_clinic_abc"
        assert data["domain"] == "dental"
        assert "features" in data
        assert data["is_active"] is True
    
    def test_tenant_branding_endpoint(self, client):
        """Test tenant branding endpoint"""
        response = client.get("/api/tenants/dental_clinic_abc/branding")
        
        assert response.status_code == 200
        data = response.json()
        assert "branding" in data
        assert "company_info" in data
        assert data["branding"]["company_name"] == "ABC Dental Clinic"


class TestDatabaseIsolation:
    """Test database isolation between tenants"""
    
    @pytest.mark.asyncio
    async def test_tenant_database_connections(self):
        """Test that different tenants get different database connections"""
        # This test would require actual database setup
        # For now, we'll test the configuration
        
        config_manager = TenantConfigManager()
        
        # Get database URLs for different tenants
        dental_url = await config_manager.get_database_url('dental_clinic_abc')
        manufacturing_url = await config_manager.get_database_url('manufacturing_xyz')
        
        assert dental_url != manufacturing_url
        assert 'dental_clinic_abc' in dental_url
        assert 'manufacturing_xyz' in manufacturing_url


if __name__ == "__main__":
    pytest.main([__file__])
