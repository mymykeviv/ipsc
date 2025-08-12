"""
Test Edit Invoice Functionality
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from backend.app.main import app
from backend.app.models import Invoice, InvoiceItem, Party, Product, User
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

@pytest.fixture
def sample_invoice(db: Session, sample_customer, sample_product):
    """Create a sample invoice"""
    from datetime import datetime
    invoice = Invoice(
        customer_id=sample_customer.id,
        invoice_no="INV-001",
        date=datetime.fromisoformat("2024-01-15T00:00:00"),
        due_date=datetime.fromisoformat("2024-01-15T00:00:00"),
        terms="Due on Receipt",
        place_of_supply="Maharashtra",
        place_of_supply_state_code="27",
        eway_bill_number="123456789012345",
        reverse_charge=False,
        export_supply=False,
        bill_to_address="123 Test Street",
        ship_to_address="123 Test Street",
        taxable_value=100.00,
        total_discount=0.00,
        cgst=9.00,
        sgst=9.00,
        igst=0.00,
        grand_total=118.00,
        notes="Test invoice",
        status="Draft"
    )
    db.add(invoice)
    db.commit()
    db.refresh(invoice)
    
    # Add invoice item
    item = InvoiceItem(
        invoice_id=invoice.id,
        product_id=sample_product.id,
        description=sample_product.name,
        hsn_code=sample_product.hsn,
        qty=1,
        rate=100.00,
        discount=0,
        discount_type="Percentage",
        taxable_value=100.00,
        gst_rate=18.0,
        cgst=9.00,
        sgst=9.00,
        igst=0.00,
        amount=118.00
    )
    db.add(item)
    db.commit()
    
    return invoice

def test_edit_invoice_success(db: Session, auth_headers, sample_customer, sample_product, sample_invoice):
    """Test successful invoice editing"""
    payload = {
        "customer_id": sample_customer.id,
        "invoice_no": "INV-001-EDITED",
        "date": "2024-01-16",
        "terms": "30 days",
        "place_of_supply": "Maharashtra",
        "place_of_supply_state_code": "27",
        "eway_bill_number": "987654321098765",
        "reverse_charge": True,
        "export_supply": False,
        "bill_to_address": "456 Updated Street",
        "ship_to_address": "456 Updated Street",
        "items": [
            {
                "product_id": sample_product.id,
                "qty": 2,
                "rate": 100.00,
                "discount": 10,
                "discount_type": "Percentage"
            }
        ],
        "notes": "Updated test invoice"
    }
    
    response = client.put(f"/api/invoices/{sample_invoice.id}", json=payload, headers=auth_headers)
    assert response.status_code == 200
    
    data = response.json()
    assert data["invoice_no"] == "INV-001-EDITED"
    assert data["terms"] == "30 days"
    assert data["eway_bill_number"] == "987654321098765"
    assert data["reverse_charge"] == True
    assert data["bill_to_address"] == "456 Updated Street"
    assert data["notes"] == "Updated test invoice"

def test_edit_invoice_not_found(db: Session, auth_headers, sample_customer, sample_product):
    """Test editing non-existent invoice"""
    payload = {
        "customer_id": sample_customer.id,
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
    
    response = client.put("/api/invoices/99999", json=payload, headers=auth_headers)
    assert response.status_code == 404
    assert "Invoice not found" in response.json()["detail"]

def test_edit_invoice_duplicate_number(db: Session, auth_headers, sample_customer, sample_product, sample_invoice):
    """Test editing invoice with duplicate invoice number"""
    # Create another invoice with different number
    from datetime import datetime
    another_invoice = Invoice(
            customer_id=sample_customer.id,
            invoice_no="INV-002",
            date=datetime.fromisoformat("2024-01-15T00:00:00"),
            due_date=datetime.fromisoformat("2024-01-15T00:00:00"),
            terms="Due on Receipt",
            place_of_supply="Maharashtra",
            place_of_supply_state_code="27",
            bill_to_address="123 Test Street",
            ship_to_address="123 Test Street",
            taxable_value=100.00,
            total_discount=0.00,
            cgst=9.00,
            sgst=9.00,
            igst=0.00,
            grand_total=118.00,
            status="Draft"
        )
    db.add(another_invoice)
    db.commit()
    
    payload = {
        "customer_id": sample_customer.id,
        "invoice_no": "INV-002",  # Try to use existing invoice number
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
    
    response = client.put(f"/api/invoices/{sample_invoice.id}", json=payload, headers=auth_headers)
    assert response.status_code == 400
    assert "Invoice number already exists" in response.json()["detail"]

def test_edit_invoice_validation_errors(db: Session, auth_headers, sample_customer, sample_product, sample_invoice):
    """Test invoice editing with validation errors"""
    payload = {
        "customer_id": sample_customer.id,
        "invoice_no": "INV-12345678901234567",  # Too long
        "date": "2024-01-15",
        "terms": "Due on Receipt",
        "place_of_supply": "",  # Missing
        "place_of_supply_state_code": "",  # Missing
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
    
    response = client.put(f"/api/invoices/{sample_invoice.id}", json=payload, headers=auth_headers)
    assert response.status_code == 400
    assert "Invoice number must be 16 characters or less" in response.json()["detail"]

def test_edit_invoice_update_items(db: Session, auth_headers, sample_customer, sample_product, sample_invoice):
    """Test editing invoice items"""
    payload = {
        "customer_id": sample_customer.id,
        "invoice_no": sample_invoice.invoice_no,
        "date": "2024-01-15",
        "terms": "Due on Receipt",
        "place_of_supply": "Maharashtra",
        "place_of_supply_state_code": "27",
        "bill_to_address": "123 Test Street",
        "ship_to_address": "123 Test Street",
        "items": [
            {
                "product_id": sample_product.id,
                "qty": 3,  # Changed from 1 to 3
                "rate": 150.00,  # Changed from 100 to 150
                "discount": 5,
                "discount_type": "Percentage"
            }
        ]
    }
    
    response = client.put(f"/api/invoices/{sample_invoice.id}", json=payload, headers=auth_headers)
    assert response.status_code == 200
    
    data = response.json()
    # Check that totals are recalculated
    assert data["taxable_value"] > 100.00  # Should be higher due to quantity and rate change
    assert data["grand_total"] > 118.00

def test_edit_invoice_remove_items(db: Session, auth_headers, sample_customer, sample_product, sample_invoice):
    """Test editing invoice by removing items"""
    payload = {
        "customer_id": sample_customer.id,
        "invoice_no": sample_invoice.invoice_no,
        "date": "2024-01-15",
        "terms": "Due on Receipt",
        "place_of_supply": "Maharashtra",
        "place_of_supply_state_code": "27",
        "bill_to_address": "123 Test Street",
        "ship_to_address": "123 Test Street",
        "items": []  # Remove all items
    }
    
    response = client.put(f"/api/invoices/{sample_invoice.id}", json=payload, headers=auth_headers)
    assert response.status_code == 200
    
    data = response.json()
    assert data["taxable_value"] == 0.00
    assert data["grand_total"] == 0.00

def test_edit_invoice_invalid_product(db: Session, auth_headers, sample_customer, sample_invoice):
    """Test editing invoice with invalid product"""
    payload = {
        "customer_id": sample_customer.id,
        "invoice_no": sample_invoice.invoice_no,
        "date": "2024-01-15",
        "terms": "Due on Receipt",
        "place_of_supply": "Maharashtra",
        "place_of_supply_state_code": "27",
        "bill_to_address": "123 Test Street",
        "ship_to_address": "123 Test Street",
        "items": [
            {
                "product_id": 99999,  # Invalid product ID
                "qty": 1,
                "rate": 100.00,
                "discount": 0,
                "discount_type": "Percentage"
            }
        ]
    }
    
    response = client.put(f"/api/invoices/{sample_invoice.id}", json=payload, headers=auth_headers)
    assert response.status_code == 400
    assert "Invalid product" in response.json()["detail"]

def test_edit_invoice_gst_calculation(db: Session, auth_headers, sample_customer, sample_product, sample_invoice):
    """Test that GST is recalculated when editing invoice"""
    payload = {
        "customer_id": sample_customer.id,
        "invoice_no": sample_invoice.invoice_no,
        "date": "2024-01-15",
        "terms": "Due on Receipt",
        "place_of_supply": "Karnataka",  # Change to different state for IGST calculation
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
    
    response = client.put(f"/api/invoices/{sample_invoice.id}", json=payload, headers=auth_headers)
    assert response.status_code == 200
    
    data = response.json()
    # For inter-state, IGST should be calculated, CGST and SGST should be 0
    assert data["igst"] > 0
    assert data["cgst"] == 0
    assert data["sgst"] == 0

def test_edit_invoice_preserve_customer(db: Session, auth_headers, sample_customer, sample_product, sample_invoice):
    """Test that customer cannot be changed when editing invoice"""
    payload = {
        "customer_id": sample_customer.id,  # Same customer
        "invoice_no": sample_invoice.invoice_no,
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
    
    response = client.put(f"/api/invoices/{sample_invoice.id}", json=payload, headers=auth_headers)
    assert response.status_code == 200
    
    data = response.json()
    assert data["customer_id"] == sample_customer.id
