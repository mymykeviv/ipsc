"""
Test Payment Management Features
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from backend.app.main import app
from backend.app.models import Invoice, Payment, Party, Product, User
from backend.app.auth import create_access_token

client = TestClient(app)

@pytest.fixture
def auth_headers():
    """Create authentication headers"""
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
    invoice = Invoice(
        customer_id=sample_customer.id,
        invoice_no="INV-001",
        date="2024-01-15T00:00:00",
        due_date="2024-01-15T00:00:00",
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
        paid_amount=0.00,
        balance_amount=118.00,
        notes="Test invoice",
        status="Sent"
    )
    db.add(invoice)
    db.commit()
    db.refresh(invoice)
    return invoice

def test_add_payment_success(db: Session, auth_headers, sample_invoice):
    """Test successful payment addition"""
    payload = {
        "payment_date": "2024-01-16",
        "payment_amount": 50.00,
        "payment_method": "Cash",
        "reference_number": "CASH001",
        "notes": "Partial payment"
    }
    
    response = client.post(f"/api/invoices/{sample_invoice.id}/payments", json=payload, headers=auth_headers)
    assert response.status_code == 201
    
    data = response.json()
    assert data["payment_amount"] == 50.00
    assert data["payment_method"] == "Cash"
    assert data["reference_number"] == "CASH001"
    assert data["notes"] == "Partial payment"
    
    # Check that invoice status and amounts are updated
    db.refresh(sample_invoice)
    assert sample_invoice.paid_amount == 50.00
    assert sample_invoice.balance_amount == 68.00
    assert sample_invoice.status == "Partially Paid"

def test_add_payment_full_amount(db: Session, auth_headers, sample_invoice):
    """Test payment for full invoice amount"""
    payload = {
        "payment_date": "2024-01-16",
        "payment_amount": 118.00,
        "payment_method": "Bank Transfer",
        "reference_number": "BT123456",
        "notes": "Full payment"
    }
    
    response = client.post(f"/api/invoices/{sample_invoice.id}/payments", json=payload, headers=auth_headers)
    assert response.status_code == 201
    
    # Check that invoice status is updated to Paid
    db.refresh(sample_invoice)
    assert sample_invoice.paid_amount == 118.00
    assert sample_invoice.balance_amount == 0.00
    assert sample_invoice.status == "Paid"

def test_add_payment_invalid_amount(db: Session, auth_headers, sample_invoice):
    """Test payment with invalid amount"""
    payload = {
        "payment_date": "2024-01-16",
        "payment_amount": 0.00,  # Invalid amount
        "payment_method": "Cash",
        "reference_number": "",
        "notes": ""
    }
    
    response = client.post(f"/api/invoices/{sample_invoice.id}/payments", json=payload, headers=auth_headers)
    assert response.status_code == 400
    assert "Payment amount must be greater than 0" in response.json()["detail"]

def test_add_payment_exceeds_balance(db: Session, auth_headers, sample_invoice):
    """Test payment amount exceeding balance"""
    payload = {
        "payment_date": "2024-01-16",
        "payment_amount": 150.00,  # More than balance
        "payment_method": "Cash",
        "reference_number": "",
        "notes": ""
    }
    
    response = client.post(f"/api/invoices/{sample_invoice.id}/payments", json=payload, headers=auth_headers)
    assert response.status_code == 400
    assert "Payment amount cannot exceed balance amount" in response.json()["detail"]

def test_add_payment_missing_method(db: Session, auth_headers, sample_invoice):
    """Test payment without payment method"""
    payload = {
        "payment_date": "2024-01-16",
        "payment_amount": 50.00,
        "payment_method": "",  # Missing method
        "reference_number": "",
        "notes": ""
    }
    
    response = client.post(f"/api/invoices/{sample_invoice.id}/payments", json=payload, headers=auth_headers)
    assert response.status_code == 400
    assert "Payment method is required" in response.json()["detail"]

def test_add_payment_invalid_invoice(db: Session, auth_headers):
    """Test payment for non-existent invoice"""
    payload = {
        "payment_date": "2024-01-16",
        "payment_amount": 50.00,
        "payment_method": "Cash",
        "reference_number": "",
        "notes": ""
    }
    
    response = client.post("/api/invoices/99999/payments", json=payload, headers=auth_headers)
    assert response.status_code == 400
    assert "Invoice not found" in response.json()["detail"]

def test_get_invoice_payments(db: Session, auth_headers, sample_invoice):
    """Test getting invoice payments"""
    # Add a payment first
    payment = Payment(
        invoice_id=sample_invoice.id,
        payment_date="2024-01-16T00:00:00",
        payment_amount=50.00,
        payment_method="Cash",
        reference_number="CASH001",
        notes="Test payment"
    )
    db.add(payment)
    db.commit()
    
    response = client.get(f"/api/invoices/{sample_invoice.id}/payments", headers=auth_headers)
    assert response.status_code == 200
    
    payments = response.json()
    assert len(payments) == 1
    assert payments[0]["payment_amount"] == 50.00
    assert payments[0]["payment_method"] == "Cash"

def test_get_invoice_payments_empty(db: Session, auth_headers, sample_invoice):
    """Test getting payments for invoice with no payments"""
    response = client.get(f"/api/invoices/{sample_invoice.id}/payments", headers=auth_headers)
    assert response.status_code == 200
    
    payments = response.json()
    assert len(payments) == 0

def test_get_invoice_payments_invalid_invoice(db: Session, auth_headers):
    """Test getting payments for non-existent invoice"""
    response = client.get("/api/invoices/99999/payments", headers=auth_headers)
    assert response.status_code == 404
    assert "Invoice not found" in response.json()["detail"]

def test_delete_payment_success(db: Session, auth_headers, sample_invoice):
    """Test successful payment deletion"""
    # Add a payment first
    payment = Payment(
        invoice_id=sample_invoice.id,
        payment_date="2024-01-16T00:00:00",
        payment_amount=50.00,
        payment_method="Cash",
        reference_number="CASH001",
        notes="Test payment"
    )
    db.add(payment)
    db.commit()
    
    # Update invoice amounts
    sample_invoice.paid_amount = 50.00
    sample_invoice.balance_amount = 68.00
    sample_invoice.status = "Partially Paid"
    db.commit()
    
    response = client.delete(f"/api/payments/{payment.id}", headers=auth_headers)
    assert response.status_code == 200
    assert "Payment deleted successfully" in response.json()["message"]
    
    # Check that invoice amounts are reverted
    db.refresh(sample_invoice)
    assert sample_invoice.paid_amount == 0.00
    assert sample_invoice.balance_amount == 118.00
    assert sample_invoice.status == "Sent"

def test_delete_payment_not_found(db: Session, auth_headers):
    """Test deleting non-existent payment"""
    response = client.delete("/api/payments/99999", headers=auth_headers)
    assert response.status_code == 400
    assert "Payment not found" in response.json()["detail"]

def test_multiple_payments(db: Session, auth_headers, sample_invoice):
    """Test multiple payments for same invoice"""
    # First payment
    payload1 = {
        "payment_date": "2024-01-16",
        "payment_amount": 50.00,
        "payment_method": "Cash",
        "reference_number": "CASH001",
        "notes": "First payment"
    }
    
    response = client.post(f"/api/invoices/{sample_invoice.id}/payments", json=payload1, headers=auth_headers)
    assert response.status_code == 201
    
    # Second payment
    payload2 = {
        "payment_date": "2024-01-17",
        "payment_amount": 68.00,
        "payment_method": "Bank Transfer",
        "reference_number": "BT123456",
        "notes": "Final payment"
    }
    
    response = client.post(f"/api/invoices/{sample_invoice.id}/payments", json=payload2, headers=auth_headers)
    assert response.status_code == 201
    
    # Check final invoice status
    db.refresh(sample_invoice)
    assert sample_invoice.paid_amount == 118.00
    assert sample_invoice.balance_amount == 0.00
    assert sample_invoice.status == "Paid"
    
    # Check payment history
    response = client.get(f"/api/invoices/{sample_invoice.id}/payments", headers=auth_headers)
    assert response.status_code == 200
    
    payments = response.json()
    assert len(payments) == 2
    assert payments[0]["payment_amount"] == 68.00  # Most recent first
    assert payments[1]["payment_amount"] == 50.00

def test_payment_validation_fields(db: Session, auth_headers, sample_invoice):
    """Test payment field validation"""
    # Test payment method too long
    payload = {
        "payment_date": "2024-01-16",
        "payment_amount": 50.00,
        "payment_method": "A" * 51,  # Too long
        "reference_number": "",
        "notes": ""
    }
    
    response = client.post(f"/api/invoices/{sample_invoice.id}/payments", json=payload, headers=auth_headers)
    assert response.status_code == 400
    assert "Payment method must be 50 characters or less" in response.json()["detail"]
    
    # Test reference number too long
    payload = {
        "payment_date": "2024-01-16",
        "payment_amount": 50.00,
        "payment_method": "Cash",
        "reference_number": "A" * 101,  # Too long
        "notes": ""
    }
    
    response = client.post(f"/api/invoices/{sample_invoice.id}/payments", json=payload, headers=auth_headers)
    assert response.status_code == 400
    assert "Reference number must be 100 characters or less" in response.json()["detail"]
    
    # Test notes too long
    payload = {
        "payment_date": "2024-01-16",
        "payment_amount": 50.00,
        "payment_method": "Cash",
        "reference_number": "",
        "notes": "A" * 201  # Too long
    }
    
    response = client.post(f"/api/invoices/{sample_invoice.id}/payments", json=payload, headers=auth_headers)
    assert response.status_code == 400
    assert "Notes must be 200 characters or less" in response.json()["detail"]
