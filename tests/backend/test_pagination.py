"""
Test Pagination Features
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from backend.app.main import app
from backend.app.models import Invoice, Party, Product, User
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
def sample_invoices(db: Session, sample_customer, sample_product):
    """Create multiple sample invoices for pagination testing"""
    invoices = []
    for i in range(25):  # Create 25 invoices
        invoice = Invoice(
            customer_id=sample_customer.id,
            invoice_no=f"INV-{i+1:03d}",
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
            notes=f"Test invoice {i+1}",
            status="Sent"
        )
        db.add(invoice)
        invoices.append(invoice)
    
    db.commit()
    return invoices

def test_pagination_default_params(db: Session, auth_headers, sample_invoices):
    """Test pagination with default parameters"""
    response = client.get("/api/invoices", headers=auth_headers)
    assert response.status_code == 200
    
    data = response.json()
    assert "invoices" in data
    assert "pagination" in data
    
    pagination = data["pagination"]
    assert pagination["page"] == 1
    assert pagination["limit"] == 10
    assert pagination["total_count"] == 25
    assert pagination["total_pages"] == 3
    assert pagination["has_next"] == True
    assert pagination["has_prev"] == False
    
    invoices = data["invoices"]
    assert len(invoices) == 10  # Default limit

def test_pagination_custom_limit(db: Session, auth_headers, sample_invoices):
    """Test pagination with custom limit"""
    response = client.get("/api/invoices?limit=5", headers=auth_headers)
    assert response.status_code == 200
    
    data = response.json()
    pagination = data["pagination"]
    assert pagination["limit"] == 5
    assert pagination["total_pages"] == 5
    assert len(data["invoices"]) == 5

def test_pagination_second_page(db: Session, auth_headers, sample_invoices):
    """Test pagination second page"""
    response = client.get("/api/invoices?page=2&limit=10", headers=auth_headers)
    assert response.status_code == 200
    
    data = response.json()
    pagination = data["pagination"]
    assert pagination["page"] == 2
    assert pagination["has_next"] == True
    assert pagination["has_prev"] == True
    
    invoices = data["invoices"]
    assert len(invoices) == 10

def test_pagination_last_page(db: Session, auth_headers, sample_invoices):
    """Test pagination last page"""
    response = client.get("/api/invoices?page=3&limit=10", headers=auth_headers)
    assert response.status_code == 200
    
    data = response.json()
    pagination = data["pagination"]
    assert pagination["page"] == 3
    assert pagination["has_next"] == False
    assert pagination["has_prev"] == True
    
    invoices = data["invoices"]
    assert len(invoices) == 5  # Remaining invoices

def test_pagination_invalid_page(db: Session, auth_headers, sample_invoices):
    """Test pagination with invalid page number"""
    response = client.get("/api/invoices?page=0", headers=auth_headers)
    assert response.status_code == 200
    
    data = response.json()
    pagination = data["pagination"]
    assert pagination["page"] == 1  # Should default to page 1

def test_pagination_invalid_limit(db: Session, auth_headers, sample_invoices):
    """Test pagination with invalid limit"""
    response = client.get("/api/invoices?limit=0", headers=auth_headers)
    assert response.status_code == 200
    
    data = response.json()
    pagination = data["pagination"]
    assert pagination["limit"] == 10  # Should default to 10

def test_pagination_limit_too_high(db: Session, auth_headers, sample_invoices):
    """Test pagination with limit too high"""
    response = client.get("/api/invoices?limit=150", headers=auth_headers)
    assert response.status_code == 200
    
    data = response.json()
    pagination = data["pagination"]
    assert pagination["limit"] == 10  # Should default to 10

def test_pagination_with_search(db: Session, auth_headers, sample_invoices):
    """Test pagination with search filter"""
    response = client.get("/api/invoices?search=INV-001&limit=5", headers=auth_headers)
    assert response.status_code == 200
    
    data = response.json()
    pagination = data["pagination"]
    assert pagination["total_count"] == 1  # Only one invoice matches
    assert pagination["total_pages"] == 1
    assert pagination["has_next"] == False
    assert pagination["has_prev"] == False
    
    invoices = data["invoices"]
    assert len(invoices) == 1
    assert invoices[0]["invoice_no"] == "INV-001"

def test_pagination_with_status_filter(db: Session, auth_headers, sample_invoices):
    """Test pagination with status filter"""
    response = client.get("/api/invoices?status=Sent&limit=5", headers=auth_headers)
    assert response.status_code == 200
    
    data = response.json()
    pagination = data["pagination"]
    assert pagination["total_count"] == 25  # All invoices have status "Sent"
    assert pagination["total_pages"] == 5
    
    invoices = data["invoices"]
    assert len(invoices) == 5
    assert all(invoice["status"] == "Sent" for invoice in invoices)

def test_pagination_combined_filters(db: Session, auth_headers, sample_invoices):
    """Test pagination with combined search and status filters"""
    response = client.get("/api/invoices?search=INV-&status=Sent&page=2&limit=5", headers=auth_headers)
    assert response.status_code == 200
    
    data = response.json()
    pagination = data["pagination"]
    assert pagination["page"] == 2
    assert pagination["limit"] == 5
    assert pagination["total_count"] == 25
    assert pagination["total_pages"] == 5
    
    invoices = data["invoices"]
    assert len(invoices) == 5

def test_pagination_empty_result(db: Session, auth_headers, sample_invoices):
    """Test pagination with no results"""
    response = client.get("/api/invoices?search=NONEXISTENT", headers=auth_headers)
    assert response.status_code == 200
    
    data = response.json()
    pagination = data["pagination"]
    assert pagination["total_count"] == 0
    assert pagination["total_pages"] == 0
    assert pagination["has_next"] == False
    assert pagination["has_prev"] == False
    
    invoices = data["invoices"]
    assert len(invoices) == 0

def test_pagination_edge_case_single_page(db: Session, auth_headers, sample_customer, sample_product):
    """Test pagination edge case with exactly one page"""
    # Create exactly 10 invoices
    for i in range(10):
        invoice = Invoice(
            customer_id=sample_customer.id,
            invoice_no=f"INV-{i+1:03d}",
            date="2024-01-15T00:00:00",
            due_date="2024-01-15T00:00:00",
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
            paid_amount=0.00,
            balance_amount=118.00,
            status="Sent"
        )
        db.add(invoice)
    db.commit()
    
    response = client.get("/api/invoices?limit=10", headers=auth_headers)
    assert response.status_code == 200
    
    data = response.json()
    pagination = data["pagination"]
    assert pagination["total_count"] == 10
    assert pagination["total_pages"] == 1
    assert pagination["has_next"] == False
    assert pagination["has_prev"] == False
    
    invoices = data["invoices"]
    assert len(invoices) == 10

def test_pagination_order(db: Session, auth_headers, sample_invoices):
    """Test that pagination maintains correct order"""
    response = client.get("/api/invoices?limit=5", headers=auth_headers)
    assert response.status_code == 200
    
    data = response.json()
    invoices = data["invoices"]
    
    # Check that invoices are ordered by ID descending (most recent first)
    invoice_ids = [invoice["id"] for invoice in invoices]
    assert invoice_ids == sorted(invoice_ids, reverse=True)

def test_pagination_page_beyond_total(db: Session, auth_headers, sample_invoices):
    """Test pagination with page number beyond total pages"""
    response = client.get("/api/invoices?page=10&limit=10", headers=auth_headers)
    assert response.status_code == 200
    
    data = response.json()
    pagination = data["pagination"]
    assert pagination["page"] == 10
    assert pagination["total_count"] == 25
    assert pagination["total_pages"] == 3
    assert pagination["has_next"] == False
    assert pagination["has_prev"] == True
    
    invoices = data["invoices"]
    assert len(invoices) == 0  # No invoices on page 10
