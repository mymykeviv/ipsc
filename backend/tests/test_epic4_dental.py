"""
Epic 4 Tests: Dental Clinic Domain Features
Comprehensive tests for dental clinic features including patient management, treatment tracking, and dental supplies
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
from app.dental_manager import DentalManager, dental_manager
from app.tenant_config import TenantConfigManager, tenant_config_manager


class TestDentalManager:
    """Unit tests for DentalManager"""
    
    @pytest.fixture
    def dental_mgr(self):
        return DentalManager()
    
    @pytest.mark.asyncio
    async def test_get_patient_profile(self, dental_mgr):
        """Test getting comprehensive patient profile"""
        with patch.object(tenant_config_manager, 'get_tenant_config') as mock_get_config:
            mock_config = Mock()
            mock_config.branding_config = {'company_name': 'Test Dental Clinic'}
            mock_get_config.return_value = mock_config
            
            # Mock session and patient data
            mock_session = AsyncMock()
            mock_patient = Mock()
            mock_patient.id = 'patient_001'
            mock_patient.name = 'John Doe'
            mock_patient.phone = '+1-555-0101'
            mock_patient.email = 'john.doe@example.com'
            mock_patient.address = '123 Main St'
            mock_patient.date_of_birth = date(1990, 1, 1)
            mock_patient.gender = 'Male'
            mock_patient.emergency_contact = 'Jane Doe'
            mock_patient.medical_history = 'No known conditions'
            mock_patient.allergies = 'None'
            mock_patient.insurance_info = {'provider': 'Blue Cross', 'policy_number': 'BC123456'}
            mock_patient.created_at = datetime.utcnow()
            mock_patient.last_visit = datetime.utcnow()
            
            # Mock session.execute to return patient
            mock_session.execute.return_value.scalar_one_or_none.return_value = mock_patient
            
            # Mock helper methods
            with patch.object(dental_mgr, '_get_patient_treatments') as mock_treatments:
                with patch.object(dental_mgr, '_get_patient_appointments') as mock_appointments:
                    with patch.object(dental_mgr, '_get_patient_billing_history') as mock_billing:
                        with patch.object(dental_mgr, '_get_patient_medical_notes') as mock_notes:
                            mock_treatments.return_value = []
                            mock_appointments.return_value = []
                            mock_billing.return_value = []
                            mock_notes.return_value = []
                            
                            result = await dental_mgr.get_patient_profile('test_tenant', 'patient_001', mock_session)
                            
                            assert result is not None
                            assert result['patient_id'] == 'patient_001'
                            assert result['name'] == 'John Doe'
                            assert result['phone'] == '+1-555-0101'
                            assert result['email'] == 'john.doe@example.com'
                            assert result['gender'] == 'Male'
                            assert result['emergency_contact'] == 'Jane Doe'
                            assert result['medical_history'] == 'No known conditions'
                            assert result['allergies'] == 'None'
                            assert result['insurance_info']['provider'] == 'Blue Cross'
    
    @pytest.mark.asyncio
    async def test_create_patient(self, dental_mgr):
        """Test creating a new patient"""
        with patch.object(tenant_config_manager, 'get_tenant_config') as mock_get_config:
            mock_config = Mock()
            mock_get_config.return_value = mock_config
            
            # Mock session
            mock_session = AsyncMock()
            
            patient_data = {
                'name': 'Jane Smith',
                'phone': '+1-555-0102',
                'email': 'jane.smith@example.com',
                'address': '456 Oak St',
                'date_of_birth': date(1985, 5, 15),
                'gender': 'Female',
                'emergency_contact': 'John Smith',
                'medical_history': 'Hypertension',
                'allergies': 'Penicillin',
                'insurance_info': {'provider': 'Aetna', 'policy_number': 'AE789012'}
            }
            
            result = await dental_mgr.create_patient('test_tenant', patient_data, mock_session)
            
            assert result is not None
            assert result['name'] == 'Jane Smith'
            assert result['phone'] == '+1-555-0102'
            assert result['email'] == 'jane.smith@example.com'
            assert 'message' in result
            assert result['message'] == 'Patient created successfully'
    
    @pytest.mark.asyncio
    async def test_create_patient_missing_required_fields(self, dental_mgr):
        """Test creating patient with missing required fields"""
        with patch.object(tenant_config_manager, 'get_tenant_config') as mock_get_config:
            mock_config = Mock()
            mock_get_config.return_value = mock_config
            
            # Mock session
            mock_session = AsyncMock()
            
            # Missing required fields
            patient_data = {
                'email': 'jane.smith@example.com',
                'address': '456 Oak St'
            }
            
            result = await dental_mgr.create_patient('test_tenant', patient_data, mock_session)
            
            assert result is None
    
    @pytest.mark.asyncio
    async def test_create_treatment_record(self, dental_mgr):
        """Test creating a new treatment record"""
        with patch.object(tenant_config_manager, 'get_tenant_config') as mock_get_config:
            mock_config = Mock()
            mock_get_config.return_value = mock_config
            
            # Mock session
            mock_session = AsyncMock()
            
            treatment_data = {
                'patient_id': 'patient_001',
                'treatment_type': 'Dental Checkup',
                'description': 'Regular dental examination and cleaning',
                'amount': 100.00,
                'treatment_date': datetime.utcnow(),
                'dentist_id': 'dentist_001',
                'treatment_notes': 'Patient has good oral hygiene',
                'follow_up_required': True,
                'follow_up_date': datetime.utcnow() + timedelta(days=30)
            }
            
            result = await dental_mgr.create_treatment_record('test_tenant', treatment_data, mock_session)
            
            assert result is not None
            assert result['patient_id'] == 'patient_001'
            assert result['treatment_type'] == 'Dental Checkup'
            assert result['description'] == 'Regular dental examination and cleaning'
            assert result['amount'] == 100.00
            assert 'message' in result
            assert result['message'] == 'Treatment record created successfully'
    
    @pytest.mark.asyncio
    async def test_get_dental_supplies(self, dental_mgr):
        """Test getting dental supplies inventory"""
        with patch.object(tenant_config_manager, 'get_tenant_config') as mock_get_config:
            mock_config = Mock()
            mock_get_config.return_value = mock_config
            
            # Mock session
            mock_session = AsyncMock()
            
            # Mock supply data
            mock_supply1 = Mock()
            mock_supply1.id = 'supply_001'
            mock_supply1.name = 'Dental Floss'
            mock_supply1.description = 'Professional dental floss'
            mock_supply1.category = 'dental_supplies'
            mock_supply1.unit = 'box'
            mock_supply1.reorder_level = 20
            mock_supply1.cost_price = Decimal('5.00')
            mock_supply1.selling_price = Decimal('8.00')
            mock_supply1.supplier = 'Dental Supply Co.'
            mock_supply1.last_restocked = datetime.utcnow()
            mock_supply1.expiry_date = date(2025, 12, 31)
            mock_supply1.is_active = True
            
            mock_supply2 = Mock()
            mock_supply2.id = 'supply_002'
            mock_supply2.name = 'Toothpaste'
            mock_supply2.description = 'Professional toothpaste'
            mock_supply2.category = 'dental_supplies'
            mock_supply2.unit = 'tube'
            mock_supply2.reorder_level = 30
            mock_supply2.cost_price = Decimal('3.00')
            mock_supply2.selling_price = Decimal('6.00')
            mock_supply2.supplier = 'Dental Supply Co.'
            mock_supply2.last_restocked = datetime.utcnow()
            mock_supply2.expiry_date = date(2025, 6, 30)
            mock_supply2.is_active = True
            
            # Mock session.execute to return supplies
            mock_session.execute.return_value.scalars.return_value.all.return_value = [mock_supply1, mock_supply2]
            mock_session.execute.return_value.scalar.return_value = 50  # Current stock
            
            result = await dental_mgr.get_dental_supplies('test_tenant', mock_session)
            
            assert len(result) == 2
            assert result[0]['supply_id'] == 'supply_001'
            assert result[0]['name'] == 'Dental Floss'
            assert result[0]['current_stock'] == 50
            assert result[0]['reorder_level'] == 20
            assert result[1]['supply_id'] == 'supply_002'
            assert result[1]['name'] == 'Toothpaste'
            assert result[1]['current_stock'] == 50
            assert result[1]['reorder_level'] == 30
    
    @pytest.mark.asyncio
    async def test_create_dental_supply_order(self, dental_mgr):
        """Test creating a dental supply order"""
        with patch.object(tenant_config_manager, 'get_tenant_config') as mock_get_config:
            mock_config = Mock()
            mock_get_config.return_value = mock_config
            
            # Mock session
            mock_session = AsyncMock()
            
            order_data = {
                'supplier_id': 'supplier_001',
                'expected_delivery': datetime.utcnow() + timedelta(days=7),
                'notes': 'Regular monthly order',
                'items': [
                    {
                        'product_id': 'supply_001',
                        'quantity': 50,
                        'unit_price': 5.00
                    },
                    {
                        'product_id': 'supply_002',
                        'quantity': 100,
                        'unit_price': 3.00
                    }
                ]
            }
            
            result = await dental_mgr.create_dental_supply_order('test_tenant', order_data, mock_session)
            
            assert result is not None
            assert result['supplier_id'] == 'supplier_001'
            assert result['total_amount'] == 550.00  # (50 * 5) + (100 * 3)
            assert result['status'] == 'ordered'
            assert 'message' in result
            assert result['message'] == 'Dental supply order created successfully'
    
    @pytest.mark.asyncio
    async def test_get_appointment_schedule(self, dental_mgr):
        """Test getting appointment schedule"""
        with patch.object(tenant_config_manager, 'get_tenant_config') as mock_get_config:
            mock_config = Mock()
            mock_get_config.return_value = mock_config
            
            # Mock session
            mock_session = AsyncMock()
            
            # Mock appointment data
            mock_appointment = Mock()
            mock_appointment.id = 'appointment_001'
            mock_appointment.patient_id = 'patient_001'
            mock_appointment.appointment_time = datetime.utcnow().time()
            mock_appointment.duration = 60
            mock_appointment.treatment_type = 'Dental Checkup'
            mock_appointment.dentist_id = 'dentist_001'
            mock_appointment.status = 'scheduled'
            mock_appointment.notes = 'Regular checkup'
            
            # Mock session.execute to return appointment
            mock_session.execute.return_value.scalars.return_value.all.return_value = [mock_appointment]
            
            # Mock patient lookup
            with patch.object(dental_mgr, '_get_patient_by_id') as mock_patient:
                mock_patient.return_value = {
                    'id': 'patient_001',
                    'name': 'John Doe',
                    'phone': '+1-555-0101',
                    'email': 'john.doe@example.com'
                }
                
                result = await dental_mgr.get_appointment_schedule('test_tenant', date.today(), mock_session)
                
                assert len(result) == 1
                assert result[0]['appointment_id'] == 'appointment_001'
                assert result[0]['patient_id'] == 'patient_001'
                assert result[0]['patient_name'] == 'John Doe'
                assert result[0]['treatment_type'] == 'Dental Checkup'
                assert result[0]['status'] == 'scheduled'
    
    @pytest.mark.asyncio
    async def test_create_appointment(self, dental_mgr):
        """Test creating a new appointment"""
        with patch.object(tenant_config_manager, 'get_tenant_config') as mock_get_config:
            mock_config = Mock()
            mock_get_config.return_value = mock_config
            
            # Mock session
            mock_session = AsyncMock()
            
            appointment_data = {
                'patient_id': 'patient_001',
                'appointment_time': datetime.utcnow(),
                'treatment_type': 'Dental Checkup',
                'duration': 60,
                'dentist_id': 'dentist_001',
                'notes': 'Regular checkup appointment'
            }
            
            result = await dental_mgr.create_appointment('test_tenant', appointment_data, mock_session)
            
            assert result is not None
            assert result['patient_id'] == 'patient_001'
            assert result['treatment_type'] == 'Dental Checkup'
            assert result['status'] == 'scheduled'
            assert 'message' in result
            assert result['message'] == 'Appointment created successfully'
    
    @pytest.mark.asyncio
    async def test_get_dental_analytics(self, dental_mgr):
        """Test getting dental clinic analytics"""
        with patch.object(tenant_config_manager, 'get_tenant_config') as mock_get_config:
            mock_config = Mock()
            mock_get_config.return_value = mock_config
            
            # Mock session
            mock_session = AsyncMock()
            
            # Mock analytics data
            mock_session.execute.return_value.scalar.return_value = 100  # Total patients
            mock_session.execute.return_value.scalar.return_value = 25   # Treatments this month
            mock_session.execute.return_value.scalar.return_value = 8    # Appointments today
            mock_session.execute.return_value.scalar.return_value = 5000.00  # Revenue this month
            
            # Mock supplies data
            mock_supply = Mock()
            mock_supply.id = 'supply_001'
            mock_supply.name = 'Dental Floss'
            mock_supply.reorder_level = 20
            mock_session.execute.return_value.scalars.return_value.all.return_value = [mock_supply]
            mock_session.execute.return_value.scalar.return_value = 15  # Current stock (below reorder level)
            
            result = await dental_mgr.get_dental_analytics('test_tenant', mock_session)
            
            assert result is not None
            assert result['total_patients'] == 100
            assert result['treatments_this_month'] == 25
            assert result['appointments_today'] == 8
            assert result['revenue_this_month'] == 5000.00
            assert result['low_stock_count'] == 1
            assert len(result['low_stock_supplies']) == 1
            assert result['low_stock_supplies'][0]['name'] == 'Dental Floss'


class TestDentalAPI:
    """Unit tests for dental API endpoints"""
    
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
    
    def test_get_patient_endpoint(self, client):
        """Test GET /api/dental/patients/{patient_id} endpoint"""
        with patch.object(dental_manager, 'get_patient_profile') as mock_get:
            mock_get.return_value = {
                'patient_id': 'patient_001',
                'name': 'John Doe',
                'phone': '+1-555-0101',
                'email': 'john.doe@example.com',
                'treatments': [],
                'appointments': [],
                'billing_history': [],
                'medical_notes': []
            }
            
            response = client.get("/api/dental/patients/patient_001")
            
            assert response.status_code == 200
            data = response.json()
            assert data['patient_id'] == 'patient_001'
            assert data['name'] == 'John Doe'
            mock_get.assert_called_once()
    
    def test_create_patient_endpoint(self, client):
        """Test POST /api/dental/patients endpoint"""
        with patch.object(dental_manager, 'create_patient') as mock_create:
            mock_create.return_value = {
                'patient_id': 'patient_002',
                'name': 'Jane Smith',
                'phone': '+1-555-0102',
                'email': 'jane.smith@example.com',
                'registration_date': datetime.utcnow().isoformat(),
                'message': 'Patient created successfully'
            }
            
            patient_data = {
                'name': 'Jane Smith',
                'phone': '+1-555-0102',
                'email': 'jane.smith@example.com'
            }
            
            response = client.post("/api/dental/patients", json=patient_data)
            
            assert response.status_code == 200
            data = response.json()
            assert data['patient_id'] == 'patient_002'
            assert data['name'] == 'Jane Smith'
            mock_create.assert_called_once()
    
    def test_create_treatment_endpoint(self, client):
        """Test POST /api/dental/treatments endpoint"""
        with patch.object(dental_manager, 'create_treatment_record') as mock_create:
            mock_create.return_value = {
                'treatment_id': 'treatment_001',
                'patient_id': 'patient_001',
                'treatment_type': 'Dental Checkup',
                'description': 'Regular dental examination',
                'amount': 100.00,
                'treatment_date': datetime.utcnow().isoformat(),
                'message': 'Treatment record created successfully'
            }
            
            treatment_data = {
                'patient_id': 'patient_001',
                'treatment_type': 'Dental Checkup',
                'description': 'Regular dental examination',
                'amount': 100.00
            }
            
            response = client.post("/api/dental/treatments", json=treatment_data)
            
            assert response.status_code == 200
            data = response.json()
            assert data['treatment_id'] == 'treatment_001'
            assert data['treatment_type'] == 'Dental Checkup'
            mock_create.assert_called_once()
    
    def test_get_appointments_endpoint(self, client):
        """Test GET /api/dental/appointments endpoint"""
        with patch.object(dental_manager, 'get_appointment_schedule') as mock_get:
            mock_get.return_value = [
                {
                    'appointment_id': 'appointment_001',
                    'patient_id': 'patient_001',
                    'patient_name': 'John Doe',
                    'appointment_time': '09:00:00',
                    'treatment_type': 'Dental Checkup',
                    'status': 'scheduled'
                }
            ]
            
            response = client.get("/api/dental/appointments")
            
            assert response.status_code == 200
            data = response.json()
            assert data['count'] == 1
            assert len(data['appointments']) == 1
            assert data['appointments'][0]['patient_name'] == 'John Doe'
            mock_get.assert_called_once()
    
    def test_get_dental_supplies_endpoint(self, client):
        """Test GET /api/dental/supplies endpoint"""
        with patch.object(dental_manager, 'get_dental_supplies') as mock_get:
            mock_get.return_value = [
                {
                    'supply_id': 'supply_001',
                    'name': 'Dental Floss',
                    'current_stock': 15,
                    'reorder_level': 20
                }
            ]
            
            response = client.get("/api/dental/supplies")
            
            assert response.status_code == 200
            data = response.json()
            assert data['count'] == 1
            assert data['low_stock_count'] == 1
            assert len(data['supplies']) == 1
            assert data['supplies'][0]['name'] == 'Dental Floss'
            mock_get.assert_called_once()
    
    def test_get_dental_analytics_endpoint(self, client):
        """Test GET /api/dental/analytics endpoint"""
        with patch.object(dental_manager, 'get_dental_analytics') as mock_get:
            mock_get.return_value = {
                'total_patients': 100,
                'treatments_this_month': 25,
                'appointments_today': 8,
                'revenue_this_month': 5000.00,
                'low_stock_count': 1
            }
            
            response = client.get("/api/dental/analytics")
            
            assert response.status_code == 200
            data = response.json()
            assert data['total_patients'] == 100
            assert data['treatments_this_month'] == 25
            assert data['appointments_today'] == 8
            assert data['revenue_this_month'] == 5000.00
            mock_get.assert_called_once()
    
    def test_get_dental_dashboard_endpoint(self, client):
        """Test GET /api/dental/dashboard endpoint"""
        with patch.object(dental_manager, 'get_dental_analytics') as mock_analytics:
            with patch.object(dental_manager, 'get_appointment_schedule') as mock_appointments:
                with patch.object(dental_manager, 'get_dental_supplies') as mock_supplies:
                    mock_analytics.return_value = {
                        'total_patients': 100,
                        'treatments_this_month': 25
                    }
                    mock_appointments.return_value = []
                    mock_supplies.return_value = []
                    
                    response = client.get("/api/dental/dashboard")
                    
                    assert response.status_code == 200
                    data = response.json()
                    assert 'analytics' in data
                    assert 'today_appointments' in data
                    assert 'low_stock_supplies' in data
                    assert 'dashboard_date' in data


class TestEpic4Integration:
    """Integration tests for Epic 4 features"""
    
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
    
    def test_dental_status_endpoint(self, client):
        """Test dental status endpoint"""
        response = client.get("/api/dental/status")
        assert response.status_code == 200
        data = response.json()
        assert "dental_features_enabled" in data
        assert "patient_management_enabled" in data
        assert "treatment_tracking_enabled" in data
        assert "appointment_scheduling_enabled" in data
        assert "dental_supplies_enabled" in data
        assert "timestamp" in data
    
    def test_dental_reports_endpoints(self, client):
        """Test dental reports endpoints"""
        # Test treatment report
        response = client.get("/api/dental/reports/treatments")
        assert response.status_code == 200
        data = response.json()
        assert data["report_type"] == "treatments"
        
        # Test patient report
        response = client.get("/api/dental/reports/patients")
        assert response.status_code == 200
        data = response.json()
        assert data["report_type"] == "patients"
        
        # Test supplies report
        response = client.get("/api/dental/reports/supplies")
        assert response.status_code == 200
        data = response.json()
        assert data["report_type"] == "supplies"


class TestDentalErrorHandling:
    """Test error handling in dental features"""
    
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
    
    def test_patient_not_found(self, client):
        """Test handling of non-existent patient"""
        with patch.object(dental_manager, 'get_patient_profile') as mock_get:
            mock_get.return_value = None
            
            response = client.get("/api/dental/patients/non_existent_patient")
            
            assert response.status_code == 404
            data = response.json()
            assert "error" in data
            assert "not found" in data["error"].lower()
    
    def test_invalid_patient_data(self, client):
        """Test handling of invalid patient data"""
        with patch.object(dental_manager, 'create_patient') as mock_create:
            mock_create.return_value = None
            
            patient_data = {"invalid": "data"}
            response = client.post("/api/dental/patients", json=patient_data)
            
            assert response.status_code == 400
            data = response.json()
            assert "error" in data
            assert "failed" in data["error"].lower()
    
    def test_invalid_treatment_data(self, client):
        """Test handling of invalid treatment data"""
        with patch.object(dental_manager, 'create_treatment_record') as mock_create:
            mock_create.return_value = None
            
            treatment_data = {"invalid": "data"}
            response = client.post("/api/dental/treatments", json=treatment_data)
            
            assert response.status_code == 400
            data = response.json()
            assert "error" in data
            assert "failed" in data["error"].lower()


class TestDentalPerformance:
    """Test performance aspects of dental features"""
    
    @pytest.mark.asyncio
    async def test_patient_cache_performance(self):
        """Test that patient cache improves performance"""
        dental_mgr = DentalManager()
        
        with patch.object(tenant_config_manager, 'get_tenant_config') as mock_get_config:
            mock_config = Mock()
            mock_get_config.return_value = mock_config
            
            # Mock session and patient data
            mock_session = AsyncMock()
            mock_patient = Mock()
            mock_patient.id = 'patient_001'
            mock_patient.name = 'John Doe'
            mock_patient.phone = '+1-555-0101'
            mock_patient.email = 'john.doe@example.com'
            mock_patient.address = '123 Main St'
            mock_patient.date_of_birth = date(1990, 1, 1)
            mock_patient.gender = 'Male'
            mock_patient.emergency_contact = 'Jane Doe'
            mock_patient.medical_history = 'No known conditions'
            mock_patient.allergies = 'None'
            mock_patient.insurance_info = {}
            mock_patient.created_at = datetime.utcnow()
            mock_patient.last_visit = datetime.utcnow()
            
            # Mock session.execute to return patient
            mock_session.execute.return_value.scalar_one_or_none.return_value = mock_patient
            
            # Mock helper methods
            with patch.object(dental_mgr, '_get_patient_treatments') as mock_treatments:
                with patch.object(dental_mgr, '_get_patient_appointments') as mock_appointments:
                    with patch.object(dental_mgr, '_get_patient_billing_history') as mock_billing:
                        with patch.object(dental_mgr, '_get_patient_medical_notes') as mock_notes:
                            mock_treatments.return_value = []
                            mock_appointments.return_value = []
                            mock_billing.return_value = []
                            mock_notes.return_value = []
                            
                            # First call should hit the database
                            start_time = datetime.now()
                            result1 = await dental_mgr.get_patient_profile('test_tenant', 'patient_001', mock_session)
                            first_call_time = (datetime.now() - start_time).total_seconds()
                            
                            # Second call should use cache
                            start_time = datetime.now()
                            result2 = await dental_mgr.get_patient_profile('test_tenant', 'patient_001', mock_session)
                            second_call_time = (datetime.now() - start_time).total_seconds()
                            
                            assert result1 == result2
                            # Second call should be faster (cached)
                            assert second_call_time <= first_call_time
    
    @pytest.mark.asyncio
    async def test_concurrent_dental_requests(self):
        """Test handling of concurrent dental requests"""
        dental_mgr = DentalManager()
        
        with patch.object(tenant_config_manager, 'get_tenant_config') as mock_get_config:
            mock_config = Mock()
            mock_get_config.return_value = mock_config
            
            # Mock session
            mock_session = AsyncMock()
            
            # Simulate concurrent patient creation requests
            patient_data = {
                'name': 'Test Patient',
                'phone': '+1-555-0100'
            }
            
            tasks = [
                dental_mgr.create_patient('test_tenant', patient_data, mock_session)
                for _ in range(5)
            ]
            
            results = await asyncio.gather(*tasks)
            
            # All results should be successful
            assert all(result is not None for result in results)
            assert all(result['name'] == 'Test Patient' for result in results)


if __name__ == "__main__":
    pytest.main([__file__])
