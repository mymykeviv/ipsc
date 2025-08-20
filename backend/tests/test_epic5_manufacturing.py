"""
Epic 5 Tests: Manufacturing Domain Features
Comprehensive tests for manufacturing features including BOM management, production tracking, and material cost analysis
"""
import pytest
import asyncio
from unittest.mock import Mock, patch, AsyncMock, MagicMock
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession
import json
from datetime import datetime, date, timedelta
from decimal import Decimal

from app.main import create_app
from app.manufacturing_manager import ManufacturingManager, manufacturing_manager
from app.tenant_config import TenantConfigManager, tenant_config_manager


class TestManufacturingManager:
    """Unit tests for ManufacturingManager"""
    
    @pytest.fixture
    def manufacturing_mgr(self):
        return ManufacturingManager()
    
    @pytest.mark.asyncio
    async def test_create_bom(self, manufacturing_mgr):
        """Test creating a new Bill of Materials (BOM)"""
        with patch.object(tenant_config_manager, 'get_tenant_config') as mock_get_config:
            mock_config = Mock()
            mock_get_config.return_value = mock_config
            
            # Mock session
            mock_session = AsyncMock()
            
            bom_data = {
                'product_id': 'product_001',
                'name': 'Product A BOM v1.0',
                'version': '1.0',
                'description': 'Bill of Materials for Product A',
                'components': [
                    {
                        'product_id': 'material_001',
                        'quantity': 2,
                        'unit': 'pcs',
                        'cost_per_unit': 5.00
                    },
                    {
                        'product_id': 'material_002',
                        'quantity': 1,
                        'unit': 'pcs',
                        'cost_per_unit': 10.00
                    }
                ],
                'labor_cost': 15.00,
                'overhead_cost': 5.00
            }
            
            result = await manufacturing_mgr.create_bom('test_tenant', bom_data, mock_session)
            
            assert result is not None
            assert result['name'] == 'Product A BOM v1.0'
            assert result['product_id'] == 'product_001'
            assert result['version'] == '1.0'
            assert result['total_cost'] == 20.00  # (2 * 5) + (1 * 10)
            assert len(result['components']) == 2
            assert 'message' in result
            assert result['message'] == 'BOM created successfully'
    
    @pytest.mark.asyncio
    async def test_create_bom_missing_required_fields(self, manufacturing_mgr):
        """Test creating BOM with missing required fields"""
        with patch.object(tenant_config_manager, 'get_tenant_config') as mock_get_config:
            mock_config = Mock()
            mock_get_config.return_value = mock_config
            
            # Mock session
            mock_session = AsyncMock()
            
            # Missing required fields
            bom_data = {
                'name': 'Product A BOM v1.0',
                'description': 'Bill of Materials for Product A'
            }
            
            result = await manufacturing_mgr.create_bom('test_tenant', bom_data, mock_session)
            
            assert result is None
    
    @pytest.mark.asyncio
    async def test_get_bom(self, manufacturing_mgr):
        """Test getting BOM details with component information"""
        with patch.object(tenant_config_manager, 'get_tenant_config') as mock_get_config:
            mock_config = Mock()
            mock_get_config.return_value = mock_config
            
            # Mock session and BOM data
            mock_session = AsyncMock()
            mock_bom = Mock()
            mock_bom.id = 'bom_001'
            mock_bom.name = 'Product A BOM v1.0'
            mock_bom.description = 'Bill of Materials for Product A'
            mock_bom.bom_product_id = 'product_001'
            mock_bom.bom_version = '1.0'
            mock_bom.bom_components = json.dumps([
                {
                    'product_id': 'material_001',
                    'quantity': 2,
                    'unit': 'pcs',
                    'cost_per_unit': 5.00
                }
            ])
            mock_bom.bom_total_cost = Decimal('20.00')
            mock_bom.bom_labor_cost = Decimal('15.00')
            mock_bom.bom_overhead_cost = Decimal('5.00')
            mock_bom.is_active = True
            mock_bom.created_at = datetime.utcnow()
            mock_bom.updated_at = datetime.utcnow()
            
            # Mock session.execute to return BOM
            mock_session.execute.return_value.scalar_one_or_none.return_value = mock_bom
            
            # Mock component product lookup
            with patch.object(manufacturing_mgr, '_get_product_by_id') as mock_product:
                mock_product.return_value = {
                    'id': 'material_001',
                    'name': 'Steel Plate',
                    'description': 'High-grade steel plate',
                    'category': 'raw_material',
                    'cost_price': 5.00,
                    'selling_price': 7.00
                }
                
                result = await manufacturing_mgr.get_bom('test_tenant', 'bom_001', mock_session)
                
                assert result is not None
                assert result['bom_id'] == 'bom_001'
                assert result['name'] == 'Product A BOM v1.0'
                assert result['product_id'] == 'product_001'
                assert result['version'] == '1.0'
                assert result['total_cost'] == 20.00
                assert result['labor_cost'] == 15.00
                assert result['overhead_cost'] == 5.00
                assert result['total_with_overhead'] == 40.00
                assert len(result['components']) == 1
                assert result['components'][0]['product_name'] == 'Steel Plate'
    
    @pytest.mark.asyncio
    async def test_create_production_order(self, manufacturing_mgr):
        """Test creating a new production order"""
        with patch.object(tenant_config_manager, 'get_tenant_config') as mock_get_config:
            mock_config = Mock()
            mock_get_config.return_value = mock_config
            
            # Mock session
            mock_session = AsyncMock()
            
            order_data = {
                'product_id': 'product_001',
                'quantity': 100,
                'bom_id': 'bom_001',
                'due_date': datetime.utcnow() + timedelta(days=7),
                'priority': 'high',
                'notes': 'Urgent production order',
                'start_date': datetime.utcnow()
            }
            
            # Mock BOM lookup
            with patch.object(manufacturing_mgr, 'get_bom') as mock_get_bom:
                mock_get_bom.return_value = {
                    'total_with_overhead': 40.00
                }
                
                result = await manufacturing_mgr.create_production_order('test_tenant', order_data, mock_session)
                
                assert result is not None
                assert result['product_id'] == 'product_001'
                assert result['quantity'] == 100
                assert result['bom_id'] == 'bom_001'
                assert result['status'] == 'planned'
                assert result['estimated_cost'] == 4000.00  # 100 * 40.00
                assert 'message' in result
                assert result['message'] == 'Production order created successfully'
    
    @pytest.mark.asyncio
    async def test_update_production_status(self, manufacturing_mgr):
        """Test updating production order status"""
        with patch.object(tenant_config_manager, 'get_tenant_config') as mock_get_config:
            mock_config = Mock()
            mock_get_config.return_value = mock_config
            
            # Mock session
            mock_session = AsyncMock()
            
            # Mock production order
            mock_order = Mock()
            mock_order.id = 'order_001'
            mock_order.status = 'planned'
            mock_order.completion_percentage = 0
            mock_order.updated_at = datetime.utcnow()
            
            # Mock session.execute to return order
            mock_session.execute.return_value.scalar_one_or_none.return_value = mock_order
            
            status_updates = {
                'status': 'in_progress',
                'completion_percentage': 25,
                'start_date': datetime.utcnow()
            }
            
            result = await manufacturing_mgr.update_production_status('test_tenant', 'order_001', status_updates, mock_session)
            
            assert result is True
    
    @pytest.mark.asyncio
    async def test_get_production_schedule(self, manufacturing_mgr):
        """Test getting production schedule"""
        with patch.object(tenant_config_manager, 'get_tenant_config') as mock_get_config:
            mock_config = Mock()
            mock_get_config.return_value = mock_config
            
            # Mock session
            mock_session = AsyncMock()
            
            # Mock production order
            mock_order = Mock()
            mock_order.id = 'order_001'
            mock_order.product_id = 'product_001'
            mock_order.quantity = 100
            mock_order.due_date = datetime.utcnow().date()
            mock_order.start_date = datetime.utcnow()
            mock_order.status = 'in_progress'
            mock_order.priority = 'high'
            mock_order.estimated_cost = Decimal('4000.00')
            mock_order.actual_cost = Decimal('0.00')
            mock_order.completion_percentage = 25
            
            # Mock session.execute to return order
            mock_session.execute.return_value.scalars.return_value.all.return_value = [mock_order]
            
            # Mock product lookup
            with patch.object(manufacturing_mgr, '_get_product_by_id') as mock_product:
                mock_product.return_value = {
                    'id': 'product_001',
                    'name': 'Product A',
                    'description': 'Manufactured product',
                    'category': 'finished_good',
                    'cost_price': 40.00,
                    'selling_price': 60.00
                }
                
                result = await manufacturing_mgr.get_production_schedule('test_tenant', datetime.utcnow().date(), datetime.utcnow().date() + timedelta(days=30), mock_session)
                
                assert len(result) == 1
                assert result[0]['order_id'] == 'order_001'
                assert result[0]['product_id'] == 'product_001'
                assert result[0]['product_name'] == 'Product A'
                assert result[0]['quantity'] == 100
                assert result[0]['status'] == 'in_progress'
                assert result[0]['priority'] == 'high'
                assert result[0]['completion_percentage'] == 25
    
    @pytest.mark.asyncio
    async def test_get_material_requirements(self, manufacturing_mgr):
        """Test calculating material requirements for production"""
        with patch.object(tenant_config_manager, 'get_tenant_config') as mock_get_config:
            mock_config = Mock()
            mock_get_config.return_value = mock_config
            
            # Mock session
            mock_session = AsyncMock()
            
            # Mock BOM lookup
            with patch.object(manufacturing_mgr, 'get_bom') as mock_get_bom:
                mock_get_bom.return_value = {
                    'components': [
                        {
                            'product_id': 'material_001',
                            'product_name': 'Steel Plate',
                            'quantity': 2,
                            'unit': 'pcs',
                            'cost_per_unit': 5.00
                        },
                        {
                            'product_id': 'material_002',
                            'product_name': 'Aluminum Bar',
                            'quantity': 1,
                            'unit': 'm',
                            'cost_per_unit': 15.00
                        }
                    ]
                }
                
                # Mock stock lookup
                with patch.object(manufacturing_mgr, '_get_product_stock') as mock_stock:
                    mock_stock.side_effect = [50, 30]  # Current stock for materials
                    
                    result = await manufacturing_mgr.get_material_requirements('test_tenant', 'bom_001', 100, mock_session)
                    
                    assert len(result) == 2
                    assert result[0]['product_id'] == 'material_001'
                    assert result[0]['product_name'] == 'Steel Plate'
                    assert result[0]['required_quantity'] == 200  # 2 * 100
                    assert result[0]['current_stock'] == 50
                    assert result[0]['shortage'] == 150  # 200 - 50
                    assert result[1]['product_id'] == 'material_002'
                    assert result[1]['product_name'] == 'Aluminum Bar'
                    assert result[1]['required_quantity'] == 100  # 1 * 100
                    assert result[1]['current_stock'] == 30
                    assert result[1]['shortage'] == 70  # 100 - 30
    
    @pytest.mark.asyncio
    async def test_get_production_analytics(self, manufacturing_mgr):
        """Test getting manufacturing analytics"""
        with patch.object(tenant_config_manager, 'get_tenant_config') as mock_get_config:
            mock_config = Mock()
            mock_get_config.return_value = mock_config
            
            # Mock session
            mock_session = AsyncMock()
            
            # Mock analytics data
            mock_session.execute.return_value.scalar.return_value = 50  # Total orders
            mock_session.execute.return_value.scalar.return_value = 10   # Orders this month
            mock_session.execute.return_value.scalar.return_value = 8    # Completed orders
            mock_session.execute.return_value.scalar.return_value = 50000.00  # Production value
            mock_session.execute.return_value.scalar.return_value = 2    # Pending orders
            mock_session.execute.return_value.scalar.return_value = 1    # Overdue orders
            
            # Mock low stock materials
            with patch.object(manufacturing_mgr, '_get_low_stock_materials') as mock_low_stock:
                mock_low_stock.return_value = [
                    {
                        'product_id': 'material_001',
                        'name': 'Steel Plate',
                        'current_stock': 10,
                        'reorder_level': 20,
                        'supplier': 'Steel Supplier Co.'
                    }
                ]
                
                result = await manufacturing_mgr.get_production_analytics('test_tenant', mock_session)
                
                assert result is not None
                assert result['total_orders'] == 50
                assert result['orders_this_month'] == 10
                assert result['completed_orders'] == 8
                assert result['completion_rate'] == 80.0  # (8 / 10) * 100
                assert result['production_value'] == 50000.00
                assert result['pending_orders'] == 2
                assert result['overdue_orders'] == 1
                assert result['low_stock_count'] == 1
                assert len(result['low_stock_materials']) == 1
                assert result['low_stock_materials'][0]['name'] == 'Steel Plate'
    
    @pytest.mark.asyncio
    async def test_get_cost_analysis(self, manufacturing_mgr):
        """Test getting detailed cost analysis for a product"""
        with patch.object(tenant_config_manager, 'get_tenant_config') as mock_get_config:
            mock_config = Mock()
            mock_get_config.return_value = mock_config
            
            # Mock session
            mock_session = AsyncMock()
            
            # Mock product lookup
            with patch.object(manufacturing_mgr, '_get_product_by_id') as mock_product:
                mock_product.return_value = {
                    'id': 'product_001',
                    'name': 'Product A',
                    'description': 'Manufactured product',
                    'category': 'finished_good',
                    'cost_price': 40.00,
                    'selling_price': 60.00
                }
                
                # Mock BOM lookup
                with patch.object(manufacturing_mgr, 'get_bom') as mock_get_bom:
                    mock_get_bom.return_value = {
                        'bom_id': 'bom_001',
                        'name': 'Product A BOM v1.0',
                        'components': [],
                        'total_cost': 20.00,
                        'labor_cost': 15.00,
                        'overhead_cost': 5.00
                    }
                    
                    # Mock production history
                    with patch.object(manufacturing_mgr, '_get_production_history') as mock_history:
                        mock_history.return_value = [
                            {
                                'order_id': 'order_001',
                                'quantity': 100,
                                'actual_cost': 4000.00,
                                'completion_date': datetime.utcnow(),
                                'quality_check_passed': True
                            }
                        ]
                        
                        # Mock cost trends
                        with patch.object(manufacturing_mgr, '_calculate_cost_trends') as mock_trends:
                            mock_trends.return_value = [
                                {
                                    'month': '2024-01',
                                    'total_cost': 4000.00,
                                    'total_quantity': 100,
                                    'average_cost': 40.00
                                }
                            ]
                            
                            result = await manufacturing_mgr.get_cost_analysis('test_tenant', 'product_001', mock_session)
                            
                            assert result is not None
                            assert result['product_id'] == 'product_001'
                            assert result['product_name'] == 'Product A'
                            assert result['has_bom'] is True
                            assert result['average_cost'] == 4000.00
                            assert result['total_production_quantity'] == 100
                            assert len(result['production_history']) == 1
                            assert len(result['cost_trends']) == 1


class TestManufacturingAPI:
    """Unit tests for manufacturing API endpoints"""
    
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
    
    def test_get_bom_endpoint(self, client):
        """Test GET /api/manufacturing/boms/{bom_id} endpoint"""
        with patch.object(manufacturing_manager, 'get_bom') as mock_get:
            mock_get.return_value = {
                'bom_id': 'bom_001',
                'name': 'Product A BOM v1.0',
                'product_id': 'product_001',
                'version': '1.0',
                'components': [],
                'total_cost': 20.00,
                'labor_cost': 15.00,
                'overhead_cost': 5.00
            }
            
            response = client.get("/api/manufacturing/boms/bom_001")
            
            assert response.status_code == 200
            data = response.json()
            assert data['bom_id'] == 'bom_001'
            assert data['name'] == 'Product A BOM v1.0'
            mock_get.assert_called_once()
    
    def test_create_bom_endpoint(self, client):
        """Test POST /api/manufacturing/boms endpoint"""
        with patch.object(manufacturing_manager, 'create_bom') as mock_create:
            mock_create.return_value = {
                'bom_id': 'bom_002',
                'name': 'Product B BOM v1.0',
                'product_id': 'product_002',
                'version': '1.0',
                'total_cost': 30.00,
                'components': [],
                'message': 'BOM created successfully'
            }
            
            bom_data = {
                'product_id': 'product_002',
                'name': 'Product B BOM v1.0',
                'version': '1.0',
                'components': []
            }
            
            response = client.post("/api/manufacturing/boms", json=bom_data)
            
            assert response.status_code == 200
            data = response.json()
            assert data['bom_id'] == 'bom_002'
            assert data['name'] == 'Product B BOM v1.0'
            mock_create.assert_called_once()
    
    def test_create_production_order_endpoint(self, client):
        """Test POST /api/manufacturing/production-orders endpoint"""
        with patch.object(manufacturing_manager, 'create_production_order') as mock_create:
            mock_create.return_value = {
                'order_id': 'order_001',
                'product_id': 'product_001',
                'quantity': 100,
                'bom_id': 'bom_001',
                'due_date': datetime.utcnow().isoformat(),
                'status': 'planned',
                'estimated_cost': 4000.00,
                'message': 'Production order created successfully'
            }
            
            order_data = {
                'product_id': 'product_001',
                'quantity': 100,
                'bom_id': 'bom_001',
                'due_date': datetime.utcnow().isoformat()
            }
            
            response = client.post("/api/manufacturing/production-orders", json=order_data)
            
            assert response.status_code == 200
            data = response.json()
            assert data['order_id'] == 'order_001'
            assert data['product_id'] == 'product_001'
            assert data['quantity'] == 100
            mock_create.assert_called_once()
    
    def test_get_production_schedule_endpoint(self, client):
        """Test GET /api/manufacturing/production-schedule endpoint"""
        with patch.object(manufacturing_manager, 'get_production_schedule') as mock_get:
            mock_get.return_value = [
                {
                    'order_id': 'order_001',
                    'product_id': 'product_001',
                    'product_name': 'Product A',
                    'quantity': 100,
                    'status': 'in_progress'
                }
            ]
            
            response = client.get("/api/manufacturing/production-schedule")
            
            assert response.status_code == 200
            data = response.json()
            assert data['count'] == 1
            assert len(data['schedule']) == 1
            assert data['schedule'][0]['product_name'] == 'Product A'
            mock_get.assert_called_once()
    
    def test_get_material_requirements_endpoint(self, client):
        """Test GET /api/manufacturing/material-requirements/{bom_id} endpoint"""
        with patch.object(manufacturing_manager, 'get_material_requirements') as mock_get:
            mock_get.return_value = [
                {
                    'product_id': 'material_001',
                    'product_name': 'Steel Plate',
                    'required_quantity': 200,
                    'current_stock': 50,
                    'shortage': 150
                }
            ]
            
            response = client.get("/api/manufacturing/material-requirements/bom_001?quantity=100")
            
            assert response.status_code == 200
            data = response.json()
            assert data['bom_id'] == 'bom_001'
            assert data['quantity'] == 100
            assert data['total_materials'] == 1
            assert len(data['requirements']) == 1
            assert data['requirements'][0]['product_name'] == 'Steel Plate'
            mock_get.assert_called_once()
    
    def test_get_manufacturing_analytics_endpoint(self, client):
        """Test GET /api/manufacturing/analytics endpoint"""
        with patch.object(manufacturing_manager, 'get_production_analytics') as mock_get:
            mock_get.return_value = {
                'total_orders': 50,
                'orders_this_month': 10,
                'completed_orders': 8,
                'completion_rate': 80.0,
                'production_value': 50000.00
            }
            
            response = client.get("/api/manufacturing/analytics")
            
            assert response.status_code == 200
            data = response.json()
            assert data['total_orders'] == 50
            assert data['orders_this_month'] == 10
            assert data['completed_orders'] == 8
            assert data['completion_rate'] == 80.0
            mock_get.assert_called_once()
    
    def test_get_cost_analysis_endpoint(self, client):
        """Test GET /api/manufacturing/cost-analysis/{product_id} endpoint"""
        with patch.object(manufacturing_manager, 'get_cost_analysis') as mock_get:
            mock_get.return_value = {
                'product_id': 'product_001',
                'product_name': 'Product A',
                'has_bom': True,
                'average_cost': 40.00,
                'total_production_quantity': 100
            }
            
            response = client.get("/api/manufacturing/cost-analysis/product_001")
            
            assert response.status_code == 200
            data = response.json()
            assert data['product_id'] == 'product_001'
            assert data['product_name'] == 'Product A'
            assert data['has_bom'] is True
            assert data['average_cost'] == 40.00
            mock_get.assert_called_once()
    
    def test_get_manufacturing_dashboard_endpoint(self, client):
        """Test GET /api/manufacturing/dashboard endpoint"""
        with patch.object(manufacturing_manager, 'get_production_analytics') as mock_analytics:
            with patch.object(manufacturing_manager, 'get_production_schedule') as mock_schedule:
                mock_analytics.return_value = {
                    'total_orders': 50,
                    'orders_this_month': 10
                }
                mock_schedule.return_value = []
                
                response = client.get("/api/manufacturing/dashboard")
                
                assert response.status_code == 200
                data = response.json()
                assert 'analytics' in data
                assert 'current_schedule' in data
                assert 'low_stock_materials' in data
                assert 'dashboard_date' in data


class TestEpic5Integration:
    """Integration tests for Epic 5 features"""
    
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
    
    def test_manufacturing_status_endpoint(self, client):
        """Test manufacturing status endpoint"""
        response = client.get("/api/manufacturing/status")
        assert response.status_code == 200
        data = response.json()
        assert "manufacturing_features_enabled" in data
        assert "bom_management_enabled" in data
        assert "production_tracking_enabled" in data
        assert "material_management_enabled" in data
        assert "cost_analysis_enabled" in data
        assert "timestamp" in data
    
    def test_manufacturing_reports_endpoints(self, client):
        """Test manufacturing reports endpoints"""
        # Test production report
        response = client.get("/api/manufacturing/reports/production")
        assert response.status_code == 200
        data = response.json()
        assert data["report_type"] == "production"
        
        # Test materials report
        response = client.get("/api/manufacturing/reports/materials")
        assert response.status_code == 200
        data = response.json()
        assert data["report_type"] == "materials"
        
        # Test costs report
        response = client.get("/api/manufacturing/reports/costs")
        assert response.status_code == 200
        data = response.json()
        assert data["report_type"] == "costs"


class TestManufacturingErrorHandling:
    """Test error handling in manufacturing features"""
    
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
    
    def test_bom_not_found(self, client):
        """Test handling of non-existent BOM"""
        with patch.object(manufacturing_manager, 'get_bom') as mock_get:
            mock_get.return_value = None
            
            response = client.get("/api/manufacturing/boms/non_existent_bom")
            
            assert response.status_code == 404
            data = response.json()
            assert "error" in data
            assert "not found" in data["error"].lower()
    
    def test_invalid_bom_data(self, client):
        """Test handling of invalid BOM data"""
        with patch.object(manufacturing_manager, 'create_bom') as mock_create:
            mock_create.return_value = None
            
            bom_data = {"invalid": "data"}
            response = client.post("/api/manufacturing/boms", json=bom_data)
            
            assert response.status_code == 400
            data = response.json()
            assert "error" in data
            assert "failed" in data["error"].lower()
    
    def test_invalid_production_order_data(self, client):
        """Test handling of invalid production order data"""
        with patch.object(manufacturing_manager, 'create_production_order') as mock_create:
            mock_create.return_value = None
            
            order_data = {"invalid": "data"}
            response = client.post("/api/manufacturing/production-orders", json=order_data)
            
            assert response.status_code == 400
            data = response.json()
            assert "error" in data
            assert "failed" in data["error"].lower()


class TestManufacturingPerformance:
    """Test performance aspects of manufacturing features"""
    
    @pytest.mark.asyncio
    async def test_bom_cache_performance(self):
        """Test that BOM cache improves performance"""
        manufacturing_mgr = ManufacturingManager()
        
        with patch.object(tenant_config_manager, 'get_tenant_config') as mock_get_config:
            mock_config = Mock()
            mock_get_config.return_value = mock_config
            
            # Mock session and BOM data
            mock_session = AsyncMock()
            mock_bom = Mock()
            mock_bom.id = 'bom_001'
            mock_bom.name = 'Product A BOM v1.0'
            mock_bom.description = 'Bill of Materials for Product A'
            mock_bom.bom_product_id = 'product_001'
            mock_bom.bom_version = '1.0'
            mock_bom.bom_components = json.dumps([])
            mock_bom.bom_total_cost = Decimal('20.00')
            mock_bom.bom_labor_cost = Decimal('15.00')
            mock_bom.bom_overhead_cost = Decimal('5.00')
            mock_bom.is_active = True
            mock_bom.created_at = datetime.utcnow()
            mock_bom.updated_at = datetime.utcnow()
            
            # Mock session.execute to return BOM
            mock_session.execute.return_value.scalar_one_or_none.return_value = mock_bom
            
            # Mock component product lookup
            with patch.object(manufacturing_mgr, '_get_product_by_id') as mock_product:
                mock_product.return_value = {
                    'id': 'material_001',
                    'name': 'Steel Plate',
                    'description': 'High-grade steel plate',
                    'category': 'raw_material',
                    'cost_price': 5.00,
                    'selling_price': 7.00
                }
                
                # First call should hit the database
                start_time = datetime.now()
                result1 = await manufacturing_mgr.get_bom('test_tenant', 'bom_001', mock_session)
                first_call_time = (datetime.now() - start_time).total_seconds()
                
                # Second call should use cache
                start_time = datetime.now()
                result2 = await manufacturing_mgr.get_bom('test_tenant', 'bom_001', mock_session)
                second_call_time = (datetime.now() - start_time).total_seconds()
                
                assert result1 == result2
                # Second call should be faster (cached)
                assert second_call_time <= first_call_time
    
    @pytest.mark.asyncio
    async def test_concurrent_manufacturing_requests(self):
        """Test handling of concurrent manufacturing requests"""
        manufacturing_mgr = ManufacturingManager()
        
        with patch.object(tenant_config_manager, 'get_tenant_config') as mock_get_config:
            mock_config = Mock()
            mock_get_config.return_value = mock_config
            
            # Mock session
            mock_session = AsyncMock()
            
            # Simulate concurrent BOM creation requests
            bom_data = {
                'product_id': 'product_001',
                'name': 'Test BOM',
                'version': '1.0',
                'components': []
            }
            
            tasks = [
                manufacturing_mgr.create_bom('test_tenant', bom_data, mock_session)
                for _ in range(5)
            ]
            
            results = await asyncio.gather(*tasks)
            
            # All results should be successful
            assert all(result is not None for result in results)
            assert all(result['name'] == 'Test BOM' for result in results)


if __name__ == "__main__":
    pytest.main([__file__])
