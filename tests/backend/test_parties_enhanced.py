import pytest
from httpx import AsyncClient
from sqlalchemy.orm import Session
from app.models import Party, User, Role
from app.auth import create_access_token
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


@pytest.fixture
def admin_token():
    return create_access_token("admin")


@pytest.fixture
def sample_customer_data():
    return {
        "type": "customer",
        "name": "Test Customer Ltd",
        "contact_person": "Jane Doe",
        "contact_number": "+91-9876543210",
        "email": "jane@testcustomer.com",
        "gstin": "27AACCT1234A1Z9",
        "gst_registration_status": "GST registered",
        "billing_address_line1": "123 Test Street",
        "billing_address_line2": "Suite 101",
        "billing_city": "Mumbai",
        "billing_state": "Maharashtra",
        "billing_country": "India",
        "billing_pincode": "400001",
        "shipping_address_line1": "123 Test Street",
        "shipping_address_line2": "Suite 101",
        "shipping_city": "Mumbai",
        "shipping_state": "Maharashtra",
        "shipping_country": "India",
        "shipping_pincode": "400001",
        "notes": "Test customer for API testing"
    }


@pytest.fixture
def sample_vendor_data():
    return {
        "type": "vendor",
        "name": "Test Vendor Pvt Ltd",
        "contact_person": "Bob Wilson",
        "contact_number": "+91-8765432109",
        "email": "bob@testvendor.com",
        "gstin": "29AABVT1234M1Z7",
        "gst_registration_status": "GST registered",
        "billing_address_line1": "456 Vendor Lane",
        "billing_address_line2": "Industrial Area",
        "billing_city": "Bangalore",
        "billing_state": "Karnataka",
        "billing_country": "India",
        "billing_pincode": "560002",
        "shipping_address_line1": "456 Vendor Lane",
        "shipping_address_line2": "Industrial Area",
        "shipping_city": "Bangalore",
        "shipping_state": "Karnataka",
        "shipping_country": "India",
        "shipping_pincode": "560002",
        "notes": "Test vendor for API testing"
    }


class TestPartyCRUD:
    """Test enhanced Party CRUD operations"""

    async def test_create_customer(self, client: AsyncClient, admin_token: str, sample_customer_data: dict):
        """Test creating a new customer with all fields"""
        response = await client.post(
            "/api/parties",
            json=sample_customer_data,
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 201
        data = response.json()
        
        assert data["type"] == "customer"
        assert data["name"] == "Test Customer Ltd"
        assert data["contact_person"] == "Jane Doe"
        assert data["contact_number"] == "+91-9876543210"
        assert data["email"] == "jane@testcustomer.com"
        assert data["gstin"] == "27AACCT1234A1Z9"
        assert data["gst_registration_status"] == "GST registered"
        assert data["billing_address_line1"] == "123 Test Street"
        assert data["billing_city"] == "Mumbai"
        assert data["billing_state"] == "Maharashtra"
        assert data["billing_country"] == "India"
        assert data["billing_pincode"] == "400001"
        assert data["shipping_address_line1"] == "123 Test Street"
        assert data["shipping_city"] == "Mumbai"
        assert data["is_active"] is True

    async def test_create_vendor(self, client: AsyncClient, admin_token: str, sample_vendor_data: dict):
        """Test creating a new vendor with all fields"""
        response = await client.post(
            "/api/parties",
            json=sample_vendor_data,
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 201
        data = response.json()
        
        assert data["type"] == "vendor"
        assert data["name"] == "Test Vendor Pvt Ltd"
        assert data["contact_person"] == "Bob Wilson"
        assert data["gst_registration_status"] == "GST registered"
        assert data["is_active"] is True

    async def test_create_party_minimal_required_fields(self, client: AsyncClient, admin_token: str):
        """Test creating a party with only required fields"""
        minimal_data = {
            "type": "customer",
            "name": "Minimal Customer",
            "gst_registration_status": "GST not registered",
            "billing_address_line1": "Minimal Address",
            "billing_city": "Mumbai",
            "billing_state": "Maharashtra",
            "billing_country": "India"
        }
        
        response = await client.post(
            "/api/parties",
            json=minimal_data,
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 201
        data = response.json()
        
        assert data["name"] == "Minimal Customer"
        assert data["contact_person"] is None
        assert data["email"] is None
        assert data["gstin"] is None
        assert data["gst_registration_status"] == "GST not registered"
        assert data["billing_address_line1"] == "Minimal Address"
        assert data["shipping_address_line1"] is None

    async def test_list_customers(self, client: AsyncClient, admin_token: str):
        """Test listing only customers"""
        response = await client.get(
            "/api/parties/customers",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Should only return customers
        for party in data:
            assert party["type"] == "customer"
            assert party["is_active"] is True

    async def test_list_vendors(self, client: AsyncClient, admin_token: str):
        """Test listing only vendors"""
        response = await client.get(
            "/api/parties/vendors",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Should only return vendors
        for party in data:
            assert party["type"] == "vendor"
            assert party["is_active"] is True

    async def test_search_parties_by_name(self, client: AsyncClient, admin_token: str):
        """Test searching parties by name"""
        response = await client.get(
            "/api/parties?search=Acme",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Should return parties with "Acme" in name
        assert len(data) > 0
        for party in data:
            assert "Acme" in party["name"]

    async def test_search_parties_by_contact_person(self, client: AsyncClient, admin_token: str):
        """Test searching parties by contact person"""
        response = await client.get(
            "/api/parties?search=John",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Should return parties with "John" in contact person
        assert len(data) > 0
        for party in data:
            assert party["contact_person"] and "John" in party["contact_person"]

    async def test_search_parties_by_gstin(self, client: AsyncClient, admin_token: str):
        """Test searching parties by GSTIN"""
        response = await client.get(
            "/api/parties?search=27AACCA1234A1Z9",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Should return party with specific GSTIN
        assert len(data) > 0
        for party in data:
            assert party["gstin"] == "27AACCA1234A1Z9"

    async def test_filter_parties_by_type(self, client: AsyncClient, admin_token: str):
        """Test filtering parties by type"""
        response = await client.get(
            "/api/parties?type=customer",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Should only return customers
        for party in data:
            assert party["type"] == "customer"

    async def test_update_party(self, client: AsyncClient, admin_token: str, sample_customer_data: dict):
        """Test updating a party"""
        # First create a party
        create_response = await client.post(
            "/api/parties",
            json=sample_customer_data,
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert create_response.status_code == 201
        party_id = create_response.json()["id"]
        
        # Update the party
        update_data = {
            "name": "Updated Customer Ltd",
            "contact_person": "Updated Contact",
            "email": "updated@customer.com",
            "notes": "Updated notes"
        }
        
        response = await client.put(
            f"/api/parties/{party_id}",
            json=update_data,
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["name"] == "Updated Customer Ltd"
        assert data["contact_person"] == "Updated Contact"
        assert data["email"] == "updated@customer.com"
        assert data["notes"] == "Updated notes"
        # Other fields should remain unchanged
        assert data["gstin"] == "27AACCT1234A1Z9"
        assert data["billing_city"] == "Mumbai"

    async def test_toggle_party_status(self, client: AsyncClient, admin_token: str, sample_customer_data: dict):
        """Test toggling party active status"""
        # First create a party
        create_response = await client.post(
            "/api/parties",
            json=sample_customer_data,
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert create_response.status_code == 201
        party_id = create_response.json()["id"]
        
        # Toggle to inactive
        response = await client.patch(
            f"/api/parties/{party_id}/toggle",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["is_active"] is False
        
        # Toggle back to active
        response = await client.patch(
            f"/api/parties/{party_id}/toggle",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["is_active"] is True

    async def test_update_party_not_found(self, client: AsyncClient, admin_token: str):
        """Test updating a non-existent party"""
        response = await client.put(
            "/api/parties/99999",
            json={"name": "Updated Name"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 404
        assert "Party not found" in response.json()["detail"]

    async def test_toggle_party_not_found(self, client: AsyncClient, admin_token: str):
        """Test toggling a non-existent party"""
        response = await client.patch(
            "/api/parties/99999/toggle",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 404
        assert "Party not found" in response.json()["detail"]

    async def test_create_party_validation_errors(self, client: AsyncClient, admin_token: str):
        """Test creating party with validation errors"""
        # Missing required fields
        invalid_data = {
            "type": "customer",
            "name": "",  # Empty name
            # Missing required billing address fields
        }
        
        response = await client.post(
            "/api/parties",
            json=invalid_data,
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 422  # Validation error

    async def test_copy_billing_to_shipping_address(self, client: AsyncClient, admin_token: str):
        """Test creating party with billing address copied to shipping"""
        party_data = {
            "type": "customer",
            "name": "Copy Address Customer",
            "gst_registration_status": "GST not registered",
            "billing_address_line1": "123 Billing Street",
            "billing_address_line2": "Billing Suite",
            "billing_city": "Mumbai",
            "billing_state": "Maharashtra",
            "billing_country": "India",
            "billing_pincode": "400001",
            "shipping_address_line1": "123 Billing Street",  # Same as billing
            "shipping_address_line2": "Billing Suite",
            "shipping_city": "Mumbai",
            "shipping_state": "Maharashtra",
            "shipping_country": "India",
            "shipping_pincode": "400001"
        }
        
        response = await client.post(
            "/api/parties",
            json=party_data,
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 201
        data = response.json()
        
        # Verify shipping address matches billing
        assert data["shipping_address_line1"] == data["billing_address_line1"]
        assert data["shipping_address_line2"] == data["billing_address_line2"]
        assert data["shipping_city"] == data["billing_city"]
        assert data["shipping_state"] == data["billing_state"]
        assert data["shipping_country"] == data["billing_country"]
        assert data["shipping_pincode"] == data["billing_pincode"]
