"""
Epic 3 Tests: Client Branding & Customization
Comprehensive tests for branding features, customization, and branded output generation
"""
import pytest
import asyncio
from unittest.mock import Mock, patch, AsyncMock, MagicMock
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession
import json
import base64
from datetime import datetime
from io import BytesIO
from PIL import Image

from app.main import create_app
from app.branding_manager import BrandingManager, branding_manager
from app.tenant_config import TenantConfigManager, tenant_config_manager


class TestBrandingManager:
    """Unit tests for BrandingManager"""
    
    @pytest.fixture
    def branding_mgr(self):
        return BrandingManager()
    
    @pytest.mark.asyncio
    async def test_get_tenant_branding(self, branding_mgr):
        """Test getting tenant branding configuration"""
        with patch.object(tenant_config_manager, 'get_tenant_config') as mock_get_config:
            mock_config = Mock()
            mock_config.branding_config = {
                'company_name': 'Test Company',
                'primary_color': '#2E86AB',
                'logo_url': 'https://example.com/logo.png'
            }
            mock_get_config.return_value = mock_config
            
            result = await branding_mgr.get_tenant_branding('test_tenant')
            
            assert result['company_name'] == 'Test Company'
            assert result['primary_color'] == '#2E86AB'
            assert result['logo_url'] == 'https://example.com/logo.png'
            mock_get_config.assert_called_once_with('test_tenant')
    
    @pytest.mark.asyncio
    async def test_get_tenant_branding_with_domain_defaults(self, branding_mgr):
        """Test getting tenant branding with domain-specific defaults"""
        with patch.object(tenant_config_manager, 'get_tenant_config') as mock_get_config:
            mock_config = Mock()
            mock_config.domain = 'dental'
            mock_config.branding_config = {'company_name': 'Dental Clinic'}
            mock_get_config.return_value = mock_config
            
            result = await branding_mgr.get_tenant_branding('dental_clinic')
            
            # Should include domain-specific defaults
            assert result['company_name'] == 'Dental Clinic'
            assert result['primary_color'] == '#2E86AB'  # Dental default
            assert result['domain'] == 'dental'
    
    @pytest.mark.asyncio
    async def test_generate_branded_invoice(self, branding_mgr):
        """Test generating branded invoice PDF"""
        with patch.object(tenant_config_manager, 'get_tenant_config') as mock_get_config:
            mock_config = Mock()
            mock_config.branding_config = {
                'company_name': 'Test Company',
                'primary_color': '#2E86AB',
                'address': '123 Test St'
            }
            mock_get_config.return_value = mock_config
            
            invoice_data = {
                'invoice_number': 'INV-001',
                'customer_name': 'John Doe',
                'total_amount': 100.00,
                'items': [{'name': 'Item 1', 'quantity': 1, 'price': 100.00}]
            }
            
            result = await branding_mgr.generate_branded_invoice('test_tenant', invoice_data)
            
            assert isinstance(result, bytes)
            assert len(result) > 0
            # PDF should contain company name
            assert b'Test Company' in result
    
    @pytest.mark.asyncio
    async def test_generate_branded_report(self, branding_mgr):
        """Test generating branded report PDF"""
        with patch.object(tenant_config_manager, 'get_tenant_config') as mock_get_config:
            mock_config = Mock()
            mock_config.branding_config = {
                'company_name': 'Test Company',
                'primary_color': '#2E86AB'
            }
            mock_get_config.return_value = mock_config
            
            report_data = {
                'title': 'Sales Report',
                'period': 'Q1 2024',
                'data': [{'month': 'Jan', 'sales': 1000}]
            }
            
            result = await branding_mgr.generate_branded_report('test_tenant', report_data, 'sales')
            
            assert isinstance(result, bytes)
            assert len(result) > 0
            # PDF should contain report title
            assert b'Sales Report' in result
    
    @pytest.mark.asyncio
    async def test_generate_qr_code(self, branding_mgr):
        """Test generating QR code with tenant branding"""
        with patch.object(tenant_config_manager, 'get_tenant_config') as mock_get_config:
            mock_config = Mock()
            mock_config.branding_config = {
                'company_name': 'Test Company',
                'primary_color': '#2E86AB'
            }
            mock_get_config.return_value = mock_config
            
            result = await branding_mgr.generate_qr_code('test_tenant', 'https://example.com/invoice/123')
            
            assert isinstance(result, str)
            assert result.startswith('data:image/png;base64,')
            
            # Decode base64 and verify it's a valid image
            image_data = base64.b64decode(result.split(',')[1])
            image = Image.open(BytesIO(image_data))
            assert image.format == 'PNG'
    
    @pytest.mark.asyncio
    async def test_get_ui_branding(self, branding_mgr):
        """Test getting UI branding configuration"""
        with patch.object(tenant_config_manager, 'get_tenant_config') as mock_get_config:
            mock_config = Mock()
            mock_config.branding_config = {
                'company_name': 'Test Company',
                'primary_color': '#2E86AB',
                'secondary_color': '#A23B72'
            }
            mock_get_config.return_value = mock_config
            
            result = await branding_mgr.get_ui_branding('test_tenant')
            
            assert 'colors' in result
            assert 'company_info' in result
            assert result['colors']['primary'] == '#2E86AB'
            assert result['company_info']['name'] == 'Test Company'
    
    @pytest.mark.asyncio
    async def test_update_tenant_branding(self, branding_mgr):
        """Test updating tenant branding configuration"""
        with patch.object(tenant_config_manager, 'update_tenant') as mock_update:
            mock_update.return_value = True
            
            branding_updates = {
                'primary_color': '#FF0000',
                'company_name': 'Updated Company'
            }
            
            result = await branding_mgr.update_tenant_branding('test_tenant', branding_updates)
            
            assert result is True
            mock_update.assert_called_once_with('test_tenant', {'branding_config': branding_updates})


class TestBrandingAPI:
    """Unit tests for branding API endpoints"""
    
    @pytest.fixture
    def app(self):
        with patch.dict('os.environ', {
            'MULTI_TENANT_ENABLED': 'true',
            'SECURITY_ENABLED': 'true',
            'DATABASE_OPTIMIZATION_ENABLED': 'true'
        }):
            return create_app()
    
    @pytest.fixture
    def client(self, app):
        return TestClient(app)
    
    def test_get_tenant_branding_endpoint(self, client):
        """Test GET /api/branding/{tenant_id} endpoint"""
        with patch.object(branding_manager, 'get_tenant_branding') as mock_get:
            mock_get.return_value = {
                'company_name': 'Test Company',
                'primary_color': '#2E86AB',
                'logo_url': 'https://example.com/logo.png'
            }
            
            response = client.get("/api/branding/test_tenant")
            
            assert response.status_code == 200
            data = response.json()
            assert data['company_name'] == 'Test Company'
            assert data['primary_color'] == '#2E86AB'
            mock_get.assert_called_once_with('test_tenant')
    
    def test_update_tenant_branding_endpoint(self, client):
        """Test PUT /api/branding/{tenant_id} endpoint"""
        with patch.object(branding_manager, 'update_tenant_branding') as mock_update:
            mock_update.return_value = True
            
            branding_updates = {
                'primary_color': '#FF0000',
                'company_name': 'Updated Company'
            }
            
            response = client.put("/api/branding/test_tenant", json=branding_updates)
            
            assert response.status_code == 200
            data = response.json()
            assert data['success'] is True
            mock_update.assert_called_once_with('test_tenant', branding_updates)
    
    def test_generate_branded_invoice_endpoint(self, client):
        """Test POST /api/branding/{tenant_id}/invoice endpoint"""
        with patch.object(branding_manager, 'generate_branded_invoice') as mock_generate:
            mock_generate.return_value = b'fake_pdf_content'
            
            invoice_data = {
                'invoice_number': 'INV-001',
                'customer_name': 'John Doe',
                'total_amount': 100.00
            }
            
            response = client.post("/api/branding/test_tenant/invoice", json=invoice_data)
            
            assert response.status_code == 200
            assert response.headers['content-type'] == 'application/pdf'
            assert response.content == b'fake_pdf_content'
            mock_generate.assert_called_once_with('test_tenant', invoice_data)
    
    def test_generate_branded_report_endpoint(self, client):
        """Test POST /api/branding/{tenant_id}/report/{report_type} endpoint"""
        with patch.object(branding_manager, 'generate_branded_report') as mock_generate:
            mock_generate.return_value = b'fake_report_content'
            
            report_data = {
                'title': 'Sales Report',
                'period': 'Q1 2024'
            }
            
            response = client.post("/api/branding/test_tenant/report/sales", json=report_data)
            
            assert response.status_code == 200
            assert response.headers['content-type'] == 'application/pdf'
            assert response.content == b'fake_report_content'
            mock_generate.assert_called_once_with('test_tenant', report_data, 'sales')
    
    def test_generate_qr_code_endpoint(self, client):
        """Test POST /api/branding/{tenant_id}/qr-code endpoint"""
        with patch.object(branding_manager, 'generate_qr_code') as mock_generate:
            mock_generate.return_value = 'data:image/png;base64,fake_qr_data'
            
            response = client.post("/api/branding/test_tenant/qr-code", json={'data': 'https://example.com'})
            
            assert response.status_code == 200
            data = response.json()
            assert data['qr_code'] == 'data:image/png;base64,fake_qr_data'
            mock_generate.assert_called_once_with('test_tenant', 'https://example.com')
    
    def test_get_branding_templates_endpoint(self, client):
        """Test GET /api/branding/{tenant_id}/templates endpoint"""
        with patch.object(branding_manager, 'get_tenant_branding') as mock_get:
            mock_get.return_value = {
                'templates': {
                    'invoice': {'name': 'Default Invoice', 'config': {}},
                    'report': {'name': 'Default Report', 'config': {}}
                }
            }
            
            response = client.get("/api/branding/test_tenant/templates")
            
            assert response.status_code == 200
            data = response.json()
            assert 'templates' in data
            assert 'invoice' in data['templates']
            mock_get.assert_called_once_with('test_tenant')


class TestEpic3Integration:
    """Integration tests for Epic 3 features"""
    
    @pytest.fixture
    def app(self):
        with patch.dict('os.environ', {
            'MULTI_TENANT_ENABLED': 'true',
            'SECURITY_ENABLED': 'true',
            'DATABASE_OPTIMIZATION_ENABLED': 'true'
        }):
            return create_app()
    
    @pytest.fixture
    def client(self, app):
        return TestClient(app)
    
    def test_branding_status_endpoint(self, client):
        """Test branding status endpoint"""
        response = client.get("/api/branding/status")
        assert response.status_code == 200
        data = response.json()
        assert data["branding_enabled"] is True
        assert data["templates_available"] is True
        assert data["pdf_generation_enabled"] is True
        assert data["qr_code_generation_enabled"] is True
        assert "timestamp" in data
    
    def test_available_templates_endpoint(self, client):
        """Test available templates endpoint"""
        response = client.get("/api/branding/templates")
        assert response.status_code == 200
        data = response.json()
        assert "templates" in data
        assert "dental" in data["templates"]
        assert "manufacturing" in data["templates"]
        assert "default" in data["templates"]
        assert "timestamp" in data
    
    def test_health_check_with_branding(self, client):
        """Test health check includes branding status"""
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert "version" in data
        assert "build_date" in data
        assert data["multi_tenant_enabled"] is True
        assert data["security_enabled"] is True
        assert data["database_optimization_enabled"] is True


class TestBrandingErrorHandling:
    """Test error handling in branding features"""
    
    @pytest.fixture
    def app(self):
        with patch.dict('os.environ', {
            'MULTI_TENANT_ENABLED': 'true',
            'SECURITY_ENABLED': 'true',
            'DATABASE_OPTIMIZATION_ENABLED': 'true'
        }):
            return create_app()
    
    @pytest.fixture
    def client(self, app):
        return TestClient(app)
    
    def test_tenant_not_found_branding(self, client):
        """Test handling of non-existent tenant in branding endpoints"""
        with patch.object(tenant_config_manager, 'get_tenant_config') as mock_get:
            mock_get.return_value = None
            
            response = client.get("/api/branding/non_existent_tenant")
            
            assert response.status_code == 404
            data = response.json()
            assert "error" in data
            assert "not found" in data["error"].lower()
    
    def test_branding_generation_error(self, client):
        """Test handling of PDF generation errors"""
        with patch.object(branding_manager, 'generate_branded_invoice') as mock_generate:
            mock_generate.side_effect = Exception("PDF generation failed")
            
            invoice_data = {'invoice_number': 'INV-001'}
            response = client.post("/api/branding/test_tenant/invoice", json=invoice_data)
            
            assert response.status_code == 500
            data = response.json()
            assert "error" in data
            assert "failed" in data["error"].lower()
    
    def test_invalid_branding_data(self, client):
        """Test handling of invalid branding data"""
        response = client.put("/api/branding/test_tenant", json={"invalid": "data"})
        
        # Should handle gracefully even with invalid data
        assert response.status_code in [200, 400, 422]


class TestBrandingPerformance:
    """Test performance aspects of branding features"""
    
    @pytest.mark.asyncio
    async def test_branding_cache_performance(self):
        """Test that branding cache improves performance"""
        branding_mgr = BrandingManager()
        
        with patch.object(tenant_config_manager, 'get_tenant_config') as mock_get_config:
            mock_config = Mock()
            mock_config.branding_config = {'company_name': 'Test Company'}
            mock_get_config.return_value = mock_config
            
            # First call should hit the config manager
            start_time = datetime.now()
            result1 = await branding_mgr.get_tenant_branding('test_tenant')
            first_call_time = (datetime.now() - start_time).total_seconds()
            
            # Second call should use cache
            start_time = datetime.now()
            result2 = await branding_mgr.get_tenant_branding('test_tenant')
            second_call_time = (datetime.now() - start_time).total_seconds()
            
            assert result1 == result2
            # Second call should be faster (cached)
            assert second_call_time <= first_call_time
    
    @pytest.mark.asyncio
    async def test_concurrent_branding_requests(self):
        """Test handling of concurrent branding requests"""
        branding_mgr = BrandingManager()
        
        with patch.object(tenant_config_manager, 'get_tenant_config') as mock_get_config:
            mock_config = Mock()
            mock_config.branding_config = {'company_name': 'Test Company'}
            mock_get_config.return_value = mock_config
            
            # Simulate concurrent requests
            tasks = [
                branding_mgr.get_tenant_branding('test_tenant')
                for _ in range(10)
            ]
            
            results = await asyncio.gather(*tasks)
            
            # All results should be the same
            assert all(result == results[0] for result in results)
            # Config should only be fetched once due to caching
            assert mock_get_config.call_count == 1


if __name__ == "__main__":
    pytest.main([__file__])
