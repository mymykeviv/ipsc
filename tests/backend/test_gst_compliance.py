"""
Test GST Compliance Features
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from backend.app.main import app
from backend.app.models import Invoice, Party, Product, User
from backend.app.auth import create_access_token

client = TestClient(app)

@pytest.fixture
def auth_headers(db: Session):
    """Create authentication headers"""
    # Create admin user if it doesn't exist
    admin_user = db.query(User).filter(User.username == "admin").first()
    if not admin_user:
        from backend.app.models import Role
        # Create admin role
        admin_role = db.query(Role).filter(Role.name == "admin").first()
        if not admin_role:
            admin_role = Role(name="admin")
            db.add(admin_role)
            db.commit()
            db.refresh(admin_role)
        
                    # Create admin user
            from backend.app.auth import pwd_context
            admin_user = User(
                username="admin",
                password_hash=pwd_context.hash("admin123"),
                role_id=admin_role.id
            )
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)
    
    token = create_access_token("admin")
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def sample_customer(db: Session):
    """Create a sample customer"""
    customer = Party(
        name="Test Customer",
        type="customer",
        contact_person="John Doe",
        contact_number="1234567890",
        email="customer@test.com",
        gstin="22AAAAA0000A1Z5",
        gst_registration_status="Registered",
        billing_address_line1="123 Test Street",
        billing_city="Mumbai",
        billing_state="Maharashtra",
        billing_pincode="400001",
        is_active=True
    )
    db.add(customer)
    db.commit()
    db.refresh(customer)
    return customer

@pytest.fixture
def sample_product(db: Session):
    """Create a sample product"""
    product = Product(
        name="Test Product",
        description="Test Description",
        sales_price=100.00,
        purchase_price=80.00,
        stock=10,
        sku="TEST001",
        unit="Pcs",
        hsn="123456",
        gst_rate=18.0,
        is_active=True
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    return product

def test_invoice_creation_with_gst_compliance(db: Session, auth_headers, sample_customer, sample_product):
    """Test invoice creation with all GST compliance fields"""
    payload = {
        "customer_id": sample_customer.id,
        "date": "2024-01-15",
        "terms": "Due on Receipt",
        "place_of_supply": "Maharashtra",
        "place_of_supply_state_code": "27",
        "eway_bill_number": "123456789012345",
        "reverse_charge": False,
        "export_supply": False,
        "bill_to_address": "123 Test Street, Mumbai, Maharashtra - 400001",
        "ship_to_address": "123 Test Street, Mumbai, Maharashtra - 400001",
        "items": [
            {
                "product_id": sample_product.id,
                "qty": 2,
                "rate": 100.00,
                "discount": 10,
                "discount_type": "Percentage"
            }
        ],
        "notes": "Test invoice"
    }
    
    response = client.post("/api/invoices", json=payload, headers=auth_headers)
    assert response.status_code == 201
    
    data = response.json()
    assert data["place_of_supply"] == "Maharashtra"
    assert data["place_of_supply_state_code"] == "27"
    assert data["eway_bill_number"] == "123456789012345"
    assert data["reverse_charge"] == False
    assert data["export_supply"] == False

def test_invoice_validation_place_of_supply_required(db: Session, auth_headers, sample_customer, sample_product):
    """Test that place of supply is required"""
    payload = {
        "customer_id": sample_customer.id,
        "date": "2024-01-15",
        "terms": "Due on Receipt",
        "place_of_supply": "",
        "place_of_supply_state_code": "",
        "bill_to_address": "123 Test Street",
        "ship_to_address": "123 Test Street",
        "items": [
            {
                "product_id": sample_product.id,
                "qty": 1,
                "rate": 100.00,
                "discount": 0,
                "discount_type": "Percentage"
            }
        ]
    }
    
    response = client.post("/api/invoices", json=payload, headers=auth_headers)
    assert response.status_code == 400
    assert "Place of supply is mandatory" in response.json()["detail"]

def test_invoice_validation_state_code_required(db: Session, auth_headers, sample_customer, sample_product):
    """Test that place of supply state code is required"""
    payload = {
        "customer_id": sample_customer.id,
        "date": "2024-01-15",
        "terms": "Due on Receipt",
        "place_of_supply": "Maharashtra",
        "place_of_supply_state_code": "",
        "bill_to_address": "123 Test Street",
        "ship_to_address": "123 Test Street",
        "items": [
            {
                "product_id": sample_product.id,
                "qty": 1,
                "rate": 100.00,
                "discount": 0,
                "discount_type": "Percentage"
            }
        ]
    }
    
    response = client.post("/api/invoices", json=payload, headers=auth_headers)
    assert response.status_code == 400
    assert "Place of supply state code is mandatory" in response.json()["detail"]

def test_invoice_validation_eway_bill_format(db: Session, auth_headers, sample_customer, sample_product):
    """Test e-way bill number format validation"""
    payload = {
        "customer_id": sample_customer.id,
        "date": "2024-01-15",
        "terms": "Due on Receipt",
        "place_of_supply": "Maharashtra",
        "place_of_supply_state_code": "27",
        "eway_bill_number": "ABC123",  # Invalid format - contains letters
        "bill_to_address": "123 Test Street",
        "ship_to_address": "123 Test Street",
        "items": [
            {
                "product_id": sample_product.id,
                "qty": 1,
                "rate": 100.00,
                "discount": 0,
                "discount_type": "Percentage"
            }
        ]
    }
    
    response = client.post("/api/invoices", json=payload, headers=auth_headers)
    assert response.status_code == 400
    assert "E-way bill number must contain only numbers" in response.json()["detail"]

def test_invoice_validation_invoice_number_length(db: Session, auth_headers, sample_customer, sample_product):
    """Test invoice number length validation (max 16 characters)"""
    payload = {
        "customer_id": sample_customer.id,
        "invoice_no": "INV-12345678901234567",  # 17 characters
        "date": "2024-01-15",
        "terms": "Due on Receipt",
        "place_of_supply": "Maharashtra",
        "place_of_supply_state_code": "27",
        "bill_to_address": "123 Test Street",
        "ship_to_address": "123 Test Street",
        "items": [
            {
                "product_id": sample_product.id,
                "qty": 1,
                "rate": 100.00,
                "discount": 0,
                "discount_type": "Percentage"
            }
        ]
    }
    
    response = client.post("/api/invoices", json=payload, headers=auth_headers)
    assert response.status_code == 400
    assert "Invoice number must be 16 characters or less" in response.json()["detail"]

def test_invoice_creation_with_reverse_charge(db: Session, auth_headers, sample_customer, sample_product):
    """Test invoice creation with reverse charge enabled"""
    payload = {
        "customer_id": sample_customer.id,
        "date": "2024-01-15",
        "terms": "Due on Receipt",
        "place_of_supply": "Maharashtra",
        "place_of_supply_state_code": "27",
        "reverse_charge": True,
        "export_supply": False,
        "bill_to_address": "123 Test Street",
        "ship_to_address": "123 Test Street",
        "items": [
            {
                "product_id": sample_product.id,
                "qty": 1,
                "rate": 100.00,
                "discount": 0,
                "discount_type": "Percentage"
            }
        ]
    }
    
    response = client.post("/api/invoices", json=payload, headers=auth_headers)
    assert response.status_code == 201
    
    data = response.json()
    assert data["reverse_charge"] == True

def test_invoice_creation_with_export_supply(db: Session, auth_headers, sample_customer, sample_product):
    """Test invoice creation with export supply enabled"""
    payload = {
        "customer_id": sample_customer.id,
        "date": "2024-01-15",
        "terms": "Due on Receipt",
        "place_of_supply": "Maharashtra",
        "place_of_supply_state_code": "27",
        "reverse_charge": False,
        "export_supply": True,
        "bill_to_address": "123 Test Street",
        "ship_to_address": "123 Test Street",
        "items": [
            {
                "product_id": sample_product.id,
                "qty": 1,
                "rate": 100.00,
                "discount": 0,
                "discount_type": "Percentage"
            }
        ]
    }
    
    response = client.post("/api/invoices", json=payload, headers=auth_headers)
    assert response.status_code == 201
    
    data = response.json()
    assert data["export_supply"] == True

def test_invoice_listing_with_gst_fields(db: Session, auth_headers, sample_customer, sample_product):
    """Test that invoice listing includes GST compliance fields"""
    # Create an invoice first
    invoice_payload = {
        "customer_id": sample_customer.id,
        "date": "2024-01-15",
        "terms": "Due on Receipt",
        "place_of_supply": "Maharashtra",
        "place_of_supply_state_code": "27",
        "eway_bill_number": "123456789012345",
        "reverse_charge": False,
        "export_supply": False,
        "bill_to_address": "123 Test Street",
        "ship_to_address": "123 Test Street",
        "items": [
            {
                "product_id": sample_product.id,
                "qty": 1,
                "rate": 100.00,
                "discount": 0,
                "discount_type": "Percentage"
            }
        ]
    }
    
    # Create invoice
    create_response = client.post("/api/invoices", json=invoice_payload, headers=auth_headers)
    assert create_response.status_code == 201
    created_invoice = create_response.json()
    
    # Get the created invoice by ID
    invoice_id = created_invoice["id"]
    response = client.get(f"/api/invoices/{invoice_id}", headers=auth_headers)
    assert response.status_code == 200
    
    invoice = response.json()
    # Check that GST fields are present
    assert "place_of_supply" in invoice
    assert "place_of_supply_state_code" in invoice
    assert "eway_bill_number" in invoice
    assert "reverse_charge" in invoice
    assert "export_supply" in invoice

def test_gst_calculation_with_different_states(db: Session, auth_headers, sample_customer, sample_product):
    """Test GST calculation for different states (intra-state vs inter-state)"""
    # Create company settings for GST calculation
    from backend.app.models import CompanySettings
    company = db.query(CompanySettings).first()
    if company:
        # Update existing company to Maharashtra for this test
        company.state = "Maharashtra"
        company.state_code = "27"
        db.commit()
        db.refresh(company)
    else:
        company = CompanySettings(
            name="Test Company",
            gstin="22AAAAA0000A1Z5",
            state="Maharashtra",
            state_code="27",
            invoice_series="INV"
        )
        db.add(company)
        db.commit()
        db.refresh(company)
    

    
    # Test intra-state (same state)
    intra_state_payload = {
        "customer_id": sample_customer.id,
        "date": "2024-01-15",
        "terms": "Due on Receipt",
        "place_of_supply": "Maharashtra",  # Same as customer state
        "place_of_supply_state_code": "27",
        "bill_to_address": "123 Test Street",
        "ship_to_address": "123 Test Street",
        "items": [
            {
                "product_id": sample_product.id,
                "qty": 1,
                "rate": 100.00,
                "discount": 0,
                "discount_type": "Percentage"
            }
        ]
    }
    
    response = client.post("/api/invoices", json=intra_state_payload, headers=auth_headers)
    assert response.status_code == 201
    
    data = response.json()
        # For intra-state, CGST and SGST should be calculated, IGST should be 0
    assert data["cgst"] > 0
    assert data["sgst"] > 0
    assert data["igst"] == 0
    
    # Test inter-state (different state)
    inter_state_payload = {
        "customer_id": sample_customer.id,
        "date": "2024-01-15",
        "terms": "Due on Receipt",
        "place_of_supply": "Karnataka",  # Different from customer state
        "place_of_supply_state_code": "29",
        "bill_to_address": "123 Test Street",
        "ship_to_address": "123 Test Street",
        "items": [
            {
                "product_id": sample_product.id,
                "qty": 1,
                "rate": 100.00,
                "discount": 0,
                "discount_type": "Percentage"
            }
        ]
    }
    
    response = client.post("/api/invoices", json=inter_state_payload, headers=auth_headers)
    assert response.status_code == 201
    
    data = response.json()
    # For inter-state, IGST should be calculated, CGST and SGST should be 0
    assert data["igst"] > 0
    assert data["cgst"] == 0
    assert data["sgst"] == 0
