"""
Test cases for purchase payment functionality
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from backend.app.models import Purchase, PurchasePayment, Party, Product, User, Role
from backend.app.test_seed import run_test_seed
from decimal import Decimal


class TestPurchasePayments:
    """Test purchase payment functionality"""

    def test_create_purchase_payment_success(self, client: TestClient, db: Session):
        """Test successful purchase payment creation"""
        # Create test data
        role = Role(name="admin")
        db.add(role)
        db.commit()
        
        user = User(username="testuser", password_hash="hashed", role_id=role.id)
        db.add(user)
        db.commit()
        
        vendor = Party(
            type="vendor",
            name="Test Vendor",
            billing_address_line1="123 Test St",
            billing_city="Test City",
            billing_state="Test State",
            billing_country="India"
        )
        db.add(vendor)
        db.commit()
        
        product = Product(
            name="Test Product",
            sales_price=Decimal("100.00"),
            stock=10,
            unit="Pcs"
        )
        db.add(product)
        db.commit()
        
        purchase = Purchase(
            vendor_id=vendor.id,
            purchase_no="PUR-001",
            date="2025-01-14",
            due_date="2025-02-14",
            grand_total=Decimal("1000.00"),
            paid_amount=Decimal("0.00"),
            balance_amount=Decimal("1000.00"),
            status="Draft"
        )
        db.add(purchase)
        db.commit()
        
        # Test payment creation
        payment_data = {
            "amount": 500.00,
            "method": "Bank Transfer",
            "account_head": "Bank",
            "reference_number": "PAY-001",
            "notes": "Partial payment"
        }
        
        response = client.post(f"/api/purchases/{purchase.id}/payments", json=payment_data)
        
        assert response.status_code == 201
        data = response.json()
        assert "id" in data
        
        # Verify payment was created in database
        payment = db.query(PurchasePayment).filter(PurchasePayment.id == data["id"]).first()
        assert payment is not None
        assert float(payment.payment_amount) == 500.00
        assert payment.payment_method == "Bank Transfer"
        assert payment.reference_number == "PAY-001"
        
        # Verify purchase status was updated
        db.refresh(purchase)
        assert float(purchase.paid_amount) == 500.00
        assert float(purchase.balance_amount) == 500.00
        assert purchase.status == "Partially Paid"

    def test_create_purchase_payment_invalid_purchase(self, client: TestClient):
        """Test payment creation with invalid purchase ID"""
        payment_data = {
            "amount": 500.00,
            "method": "Bank Transfer",
            "account_head": "Bank",
            "reference_number": "PAY-001",
            "notes": "Test payment"
        }
        
        response = client.post("/api/purchases/99999/payments", json=payment_data)
        assert response.status_code == 404
        assert "Purchase not found" in response.json()["detail"]

    def test_create_purchase_payment_invalid_amount(self, client: TestClient, db: Session):
        """Test payment creation with invalid amount"""
        # Create test purchase
        vendor = Party(
            type="vendor",
            name="Test Vendor",
            billing_address_line1="123 Test St",
            billing_city="Test City",
            billing_state="Test State",
            billing_country="India"
        )
        db.add(vendor)
        db.commit()
        
        purchase = Purchase(
            vendor_id=vendor.id,
            purchase_no="PUR-002",
            date="2025-01-14",
            due_date="2025-02-14",
            grand_total=Decimal("1000.00"),
            paid_amount=Decimal("0.00"),
            balance_amount=Decimal("1000.00"),
            status="Draft"
        )
        db.add(purchase)
        db.commit()
        
        # Test with negative amount
        payment_data = {
            "amount": -100.00,
            "method": "Bank Transfer",
            "account_head": "Bank",
            "reference_number": "PAY-002",
            "notes": "Invalid payment"
        }
        
        response = client.post(f"/api/purchases/{purchase.id}/payments", json=payment_data)
        assert response.status_code == 422  # Validation error

    def test_list_purchase_payments(self, client: TestClient, db: Session):
        """Test listing purchase payments"""
        # Create test data
        vendor = Party(
            type="vendor",
            name="Test Vendor",
            billing_address_line1="123 Test St",
            billing_city="Test City",
            billing_state="Test State",
            billing_country="India"
        )
        db.add(vendor)
        db.commit()
        
        purchase = Purchase(
            vendor_id=vendor.id,
            purchase_no="PUR-003",
            date="2025-01-14",
            due_date="2025-02-14",
            grand_total=Decimal("1000.00"),
            paid_amount=Decimal("0.00"),
            balance_amount=Decimal("1000.00"),
            status="Draft"
        )
        db.add(purchase)
        db.commit()
        
        # Create test payments
        payment1 = PurchasePayment(
            purchase_id=purchase.id,
            payment_amount=Decimal("300.00"),
            payment_method="Cash",
            account_head="Cash",
            reference_number="PAY-003-1",
            notes="First payment"
        )
        payment2 = PurchasePayment(
            purchase_id=purchase.id,
            payment_amount=Decimal("400.00"),
            payment_method="Bank Transfer",
            account_head="Bank",
            reference_number="PAY-003-2",
            notes="Second payment"
        )
        db.add_all([payment1, payment2])
        db.commit()
        
        # Update purchase paid amount
        purchase.paid_amount = Decimal("700.00")
        purchase.balance_amount = Decimal("300.00")
        purchase.status = "Partially Paid"
        db.commit()
        
        # Test listing payments
        response = client.get(f"/api/purchases/{purchase.id}/payments")
        assert response.status_code == 200
        
        data = response.json()
        assert "payments" in data
        assert "total_paid" in data
        assert "outstanding" in data
        
        assert len(data["payments"]) == 2
        assert data["total_paid"] == 700.00
        assert data["outstanding"] == 300.00
        
        # Verify payment details
        payments = data["payments"]
        assert payments[0]["amount"] == 300.00
        assert payments[0]["method"] == "Cash"
        assert payments[1]["amount"] == 400.00
        assert payments[1]["method"] == "Bank Transfer"

    def test_list_purchase_payments_no_payments(self, client: TestClient, db: Session):
        """Test listing payments for purchase with no payments"""
        # Create test purchase
        vendor = Party(
            type="vendor",
            name="Test Vendor",
            billing_address_line1="123 Test St",
            billing_city="Test City",
            billing_state="Test State",
            billing_country="India"
        )
        db.add(vendor)
        db.commit()
        
        purchase = Purchase(
            vendor_id=vendor.id,
            purchase_no="PUR-004",
            date="2025-01-14",
            due_date="2025-02-14",
            grand_total=Decimal("1000.00"),
            paid_amount=Decimal("0.00"),
            balance_amount=Decimal("1000.00"),
            status="Draft"
        )
        db.add(purchase)
        db.commit()
        
        # Test listing payments
        response = client.get(f"/api/purchases/{purchase.id}/payments")
        assert response.status_code == 200
        
        data = response.json()
        assert len(data["payments"]) == 0
        assert data["total_paid"] == 0.0
        assert data["outstanding"] == 1000.0

    def test_purchase_payment_full_payment(self, client: TestClient, db: Session):
        """Test full payment that marks purchase as paid"""
        # Create test data
        vendor = Party(
            type="vendor",
            name="Test Vendor",
            billing_address_line1="123 Test St",
            billing_city="Test City",
            billing_state="Test State",
            billing_country="India"
        )
        db.add(vendor)
        db.commit()
        
        purchase = Purchase(
            vendor_id=vendor.id,
            purchase_no="PUR-005",
            date="2025-01-14",
            due_date="2025-02-14",
            grand_total=Decimal("1000.00"),
            paid_amount=Decimal("0.00"),
            balance_amount=Decimal("1000.00"),
            status="Draft"
        )
        db.add(purchase)
        db.commit()
        
        # Create full payment
        payment_data = {
            "amount": 1000.00,
            "method": "Bank Transfer",
            "account_head": "Bank",
            "reference_number": "PAY-005",
            "notes": "Full payment"
        }
        
        response = client.post(f"/api/purchases/{purchase.id}/payments", json=payment_data)
        assert response.status_code == 201
        
        # Verify purchase status was updated to paid
        db.refresh(purchase)
        assert float(purchase.paid_amount) == 1000.00
        assert float(purchase.balance_amount) == 0.00
        assert purchase.status == "Paid"

    def test_purchase_payment_validation(self, client: TestClient, db: Session):
        """Test payment validation rules"""
        # Create test purchase
        vendor = Party(
            type="vendor",
            name="Test Vendor",
            billing_address_line1="123 Test St",
            billing_city="Test City",
            billing_state="Test State",
            billing_country="India"
        )
        db.add(vendor)
        db.commit()
        
        purchase = Purchase(
            vendor_id=vendor.id,
            purchase_no="PUR-006",
            date="2025-01-14",
            due_date="2025-02-14",
            grand_total=Decimal("1000.00"),
            paid_amount=Decimal("0.00"),
            balance_amount=Decimal("1000.00"),
            status="Draft"
        )
        db.add(purchase)
        db.commit()
        
        # Test missing required fields
        response = client.post(f"/api/purchases/{purchase.id}/payments", json={})
        assert response.status_code == 422
        
        # Test invalid payment method
        payment_data = {
            "amount": 500.00,
            "method": "",
            "account_head": "Bank",
            "reference_number": "PAY-006",
            "notes": "Test payment"
        }
        response = client.post(f"/api/purchases/{purchase.id}/payments", json=payment_data)
        assert response.status_code == 422

    def test_purchase_payment_edge_cases(self, client: TestClient, db: Session):
        """Test edge cases for purchase payments"""
        # Create test purchase
        vendor = Party(
            type="vendor",
            name="Test Vendor",
            billing_address_line1="123 Test St",
            billing_city="Test City",
            billing_state="Test State",
            billing_country="India"
        )
        db.add(vendor)
        db.commit()
        
        purchase = Purchase(
            vendor_id=vendor.id,
            purchase_no="PUR-007",
            date="2025-01-14",
            due_date="2025-02-14",
            grand_total=Decimal("1000.00"),
            paid_amount=Decimal("0.00"),
            balance_amount=Decimal("1000.00"),
            status="Draft"
        )
        db.add(purchase)
        db.commit()
        
        # Test zero amount payment
        payment_data = {
            "amount": 0.00,
            "method": "Cash",
            "account_head": "Cash",
            "reference_number": "PAY-007",
            "notes": "Zero payment"
        }
        response = client.post(f"/api/purchases/{purchase.id}/payments", json=payment_data)
        assert response.status_code == 201  # Should be allowed
        
        # Test very large amount
        payment_data = {
            "amount": 999999.99,
            "method": "Bank Transfer",
            "account_head": "Bank",
            "reference_number": "PAY-008",
            "notes": "Large payment"
        }
        response = client.post(f"/api/purchases/{purchase.id}/payments", json=payment_data)
        assert response.status_code == 201  # Should be allowed
