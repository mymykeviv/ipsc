"""
Test cases for invoice payment functionality
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from backend.app.models import Invoice, Payment, Party, Product, User, Role, InvoiceItem
from backend.app.test_seed import run_test_seed
from decimal import Decimal


class TestInvoicePayments:
    """Test invoice payment functionality"""

    def test_create_invoice_payment_success(self, client: TestClient, db: Session):
        """Test successful invoice payment creation"""
        # Create test data
        role = Role(name="admin")
        db.add(role)
        db.commit()
        
        user = User(username="testuser", password_hash="hashed", role_id=role.id)
        db.add(user)
        db.commit()
        
        customer = Party(
            type="customer",
            name="Test Customer",
            billing_address_line1="123 Test St",
            billing_city="Test City",
            billing_state="Test State",
            billing_country="India"
        )
        db.add(customer)
        db.commit()
        
        supplier = Party(
            type="vendor",
            name="Test Supplier",
            billing_address_line1="456 Supplier St",
            billing_city="Supplier City",
            billing_state="Supplier State",
            billing_country="India"
        )
        db.add(supplier)
        db.commit()
        
        product = Product(
            name="Test Product",
            sales_price=Decimal("100.00"),
            stock=10,
            unit="Pcs"
        )
        db.add(product)
        db.commit()
        
        invoice = Invoice(
            customer_id=customer.id,
            supplier_id=supplier.id,
            invoice_no="INV-001",
            date="2025-01-14",
            due_date="2025-02-14",
            grand_total=Decimal("1000.00"),
            paid_amount=Decimal("0.00"),
            balance_amount=Decimal("1000.00"),
            status="Draft"
        )
        db.add(invoice)
        db.commit()
        
        # Test payment creation
        payment_data = {
            "amount": 500.00,
            "method": "Bank Transfer",
            "account_head": "Bank",
            "reference_number": "PAY-001",
            "notes": "Partial payment"
        }
        
        response = client.post(f"/api/invoices/{invoice.id}/payments", json=payment_data)
        
        assert response.status_code == 201
        data = response.json()
        assert "id" in data
        
        # Verify payment was created in database
        payment = db.query(Payment).filter(Payment.id == data["id"]).first()
        assert payment is not None
        assert float(payment.payment_amount) == 500.00
        assert payment.payment_method == "Bank Transfer"
        assert payment.reference_number == "PAY-001"
        
        # Verify invoice status was updated
        db.refresh(invoice)
        assert float(invoice.paid_amount) == 500.00
        assert float(invoice.balance_amount) == 500.00
        assert invoice.status == "Partially Paid"

    def test_create_invoice_payment_invalid_invoice(self, client: TestClient):
        """Test payment creation with invalid invoice ID"""
        payment_data = {
            "amount": 500.00,
            "method": "Bank Transfer",
            "account_head": "Bank",
            "reference_number": "PAY-001",
            "notes": "Test payment"
        }
        
        response = client.post("/api/invoices/99999/payments", json=payment_data)
        assert response.status_code == 404
        assert "Invoice not found" in response.json()["detail"]

    def test_list_invoice_payments(self, client: TestClient, db: Session):
        """Test listing invoice payments"""
        # Create test data
        customer = Party(
            type="customer",
            name="Test Customer",
            billing_address_line1="123 Test St",
            billing_city="Test City",
            billing_state="Test State",
            billing_country="India"
        )
        db.add(customer)
        db.commit()
        
        supplier = Party(
            type="vendor",
            name="Test Supplier",
            billing_address_line1="456 Supplier St",
            billing_city="Supplier City",
            billing_state="Supplier State",
            billing_country="India"
        )
        db.add(supplier)
        db.commit()
        
        invoice = Invoice(
            customer_id=customer.id,
            supplier_id=supplier.id,
            invoice_no="INV-002",
            date="2025-01-14",
            due_date="2025-02-14",
            grand_total=Decimal("1000.00"),
            paid_amount=Decimal("0.00"),
            balance_amount=Decimal("1000.00"),
            status="Draft"
        )
        db.add(invoice)
        db.commit()
        
        # Create test payments
        payment1 = Payment(
            invoice_id=invoice.id,
            payment_amount=Decimal("300.00"),
            payment_method="Cash",
            account_head="Cash",
            reference_number="PAY-002-1",
            notes="First payment"
        )
        payment2 = Payment(
            invoice_id=invoice.id,
            payment_amount=Decimal("400.00"),
            payment_method="Bank Transfer",
            account_head="Bank",
            reference_number="PAY-002-2",
            notes="Second payment"
        )
        db.add_all([payment1, payment2])
        db.commit()
        
        # Update invoice paid amount
        invoice.paid_amount = Decimal("700.00")
        invoice.balance_amount = Decimal("300.00")
        invoice.status = "Partially Paid"
        db.commit()
        
        # Test listing payments
        response = client.get(f"/api/invoices/{invoice.id}/payments")
        assert response.status_code == 200
        
        data = response.json()
        assert len(data) == 2
        
        # Verify payment details
        payments = data
        assert payments[0]["payment_amount"] == 300.00
        assert payments[0]["payment_method"] == "Cash"
        assert payments[1]["payment_amount"] == 400.00
        assert payments[1]["payment_method"] == "Bank Transfer"

    def test_invoice_payment_full_payment(self, client: TestClient, db: Session):
        """Test full payment that marks invoice as paid"""
        # Create test data
        customer = Party(
            type="customer",
            name="Test Customer",
            billing_address_line1="123 Test St",
            billing_city="Test City",
            billing_state="Test State",
            billing_country="India"
        )
        db.add(customer)
        db.commit()
        
        supplier = Party(
            type="vendor",
            name="Test Supplier",
            billing_address_line1="456 Supplier St",
            billing_city="Supplier City",
            billing_state="Supplier State",
            billing_country="India"
        )
        db.add(supplier)
        db.commit()
        
        invoice = Invoice(
            customer_id=customer.id,
            supplier_id=supplier.id,
            invoice_no="INV-003",
            date="2025-01-14",
            due_date="2025-02-14",
            grand_total=Decimal("1000.00"),
            paid_amount=Decimal("0.00"),
            balance_amount=Decimal("1000.00"),
            status="Draft"
        )
        db.add(invoice)
        db.commit()
        
        # Create full payment
        payment_data = {
            "amount": 1000.00,
            "method": "Bank Transfer",
            "account_head": "Bank",
            "reference_number": "PAY-003",
            "notes": "Full payment"
        }
        
        response = client.post(f"/api/invoices/{invoice.id}/payments", json=payment_data)
        assert response.status_code == 201
        
        # Verify invoice status was updated to paid
        db.refresh(invoice)
        assert float(invoice.paid_amount) == 1000.00
        assert float(invoice.balance_amount) == 0.00
        assert invoice.status == "Paid"

    def test_invoice_payment_validation(self, client: TestClient, db: Session):
        """Test payment validation rules"""
        # Create test invoice
        customer = Party(
            type="customer",
            name="Test Customer",
            billing_address_line1="123 Test St",
            billing_city="Test City",
            billing_state="Test State",
            billing_country="India"
        )
        db.add(customer)
        db.commit()
        
        supplier = Party(
            type="vendor",
            name="Test Supplier",
            billing_address_line1="456 Supplier St",
            billing_city="Supplier City",
            billing_state="Supplier State",
            billing_country="India"
        )
        db.add(supplier)
        db.commit()
        
        invoice = Invoice(
            customer_id=customer.id,
            supplier_id=supplier.id,
            invoice_no="INV-004",
            date="2025-01-14",
            due_date="2025-02-14",
            grand_total=Decimal("1000.00"),
            paid_amount=Decimal("0.00"),
            balance_amount=Decimal("1000.00"),
            status="Draft"
        )
        db.add(invoice)
        db.commit()
        
        # Test missing required fields
        response = client.post(f"/api/invoices/{invoice.id}/payments", json={})
        assert response.status_code == 422
        
        # Test invalid payment method
        payment_data = {
            "amount": 500.00,
            "method": "",
            "account_head": "Bank",
            "reference_number": "PAY-004",
            "notes": "Test payment"
        }
        response = client.post(f"/api/invoices/{invoice.id}/payments", json=payment_data)
        assert response.status_code == 422

    def test_delete_invoice_payment(self, client: TestClient, db: Session):
        """Test deleting an invoice payment"""
        # Create test data
        customer = Party(
            type="customer",
            name="Test Customer",
            billing_address_line1="123 Test St",
            billing_city="Test City",
            billing_state="Test State",
            billing_country="India"
        )
        db.add(customer)
        db.commit()
        
        supplier = Party(
            type="vendor",
            name="Test Supplier",
            billing_address_line1="456 Supplier St",
            billing_city="Supplier City",
            billing_state="Supplier State",
            billing_country="India"
        )
        db.add(supplier)
        db.commit()
        
        invoice = Invoice(
            customer_id=customer.id,
            supplier_id=supplier.id,
            invoice_no="INV-005",
            date="2025-01-14",
            due_date="2025-02-14",
            grand_total=Decimal("1000.00"),
            paid_amount=Decimal("500.00"),
            balance_amount=Decimal("500.00"),
            status="Partially Paid"
        )
        db.add(invoice)
        db.commit()
        
        payment = Payment(
            invoice_id=invoice.id,
            payment_amount=Decimal("500.00"),
            payment_method="Bank Transfer",
            account_head="Bank",
            reference_number="PAY-005",
            notes="Test payment"
        )
        db.add(payment)
        db.commit()
        
        # Test deleting payment
        response = client.delete(f"/api/payments/{payment.id}")
        assert response.status_code == 204
        
        # Verify payment was deleted
        deleted_payment = db.query(Payment).filter(Payment.id == payment.id).first()
        assert deleted_payment is None
        
        # Verify invoice status was updated
        db.refresh(invoice)
        assert float(invoice.paid_amount) == 0.00
        assert float(invoice.balance_amount) == 1000.00
        assert invoice.status == "Draft"

    def test_invoice_payment_edge_cases(self, client: TestClient, db: Session):
        """Test edge cases for invoice payments"""
        # Create test invoice
        customer = Party(
            type="customer",
            name="Test Customer",
            billing_address_line1="123 Test St",
            billing_city="Test City",
            billing_state="Test State",
            billing_country="India"
        )
        db.add(customer)
        db.commit()
        
        supplier = Party(
            type="vendor",
            name="Test Supplier",
            billing_address_line1="456 Supplier St",
            billing_city="Supplier City",
            billing_state="Supplier State",
            billing_country="India"
        )
        db.add(supplier)
        db.commit()
        
        invoice = Invoice(
            customer_id=customer.id,
            supplier_id=supplier.id,
            invoice_no="INV-006",
            date="2025-01-14",
            due_date="2025-02-14",
            grand_total=Decimal("1000.00"),
            paid_amount=Decimal("0.00"),
            balance_amount=Decimal("1000.00"),
            status="Draft"
        )
        db.add(invoice)
        db.commit()
        
        # Test zero amount payment
        payment_data = {
            "amount": 0.00,
            "method": "Cash",
            "account_head": "Cash",
            "reference_number": "PAY-006",
            "notes": "Zero payment"
        }
        response = client.post(f"/api/invoices/{invoice.id}/payments", json=payment_data)
        assert response.status_code == 201  # Should be allowed
        
        # Test very large amount
        payment_data = {
            "amount": 999999.99,
            "method": "Bank Transfer",
            "account_head": "Bank",
            "reference_number": "PAY-007",
            "notes": "Large payment"
        }
        response = client.post(f"/api/invoices/{invoice.id}/payments", json=payment_data)
        assert response.status_code == 201  # Should be allowed

    def test_invoice_payment_multiple_payments(self, client: TestClient, db: Session):
        """Test multiple payments for the same invoice"""
        # Create test invoice
        customer = Party(
            type="customer",
            name="Test Customer",
            billing_address_line1="123 Test St",
            billing_city="Test City",
            billing_state="Test State",
            billing_country="India"
        )
        db.add(customer)
        db.commit()
        
        supplier = Party(
            type="vendor",
            name="Test Supplier",
            billing_address_line1="456 Supplier St",
            billing_city="Supplier City",
            billing_state="Supplier State",
            billing_country="India"
        )
        db.add(supplier)
        db.commit()
        
        invoice = Invoice(
            customer_id=customer.id,
            supplier_id=supplier.id,
            invoice_no="INV-007",
            date="2025-01-14",
            due_date="2025-02-14",
            grand_total=Decimal("1000.00"),
            paid_amount=Decimal("0.00"),
            balance_amount=Decimal("1000.00"),
            status="Draft"
        )
        db.add(invoice)
        db.commit()
        
        # Create multiple payments
        payments = [
            {"amount": 300.00, "method": "Cash", "reference_number": "PAY-008-1"},
            {"amount": 400.00, "method": "Bank Transfer", "reference_number": "PAY-008-2"},
            {"amount": 300.00, "method": "UPI", "reference_number": "PAY-008-3"}
        ]
        
        for payment_data in payments:
            full_payment_data = {
                **payment_data,
                "account_head": "Bank",
                "notes": f"Payment {payment_data['reference_number']}"
            }
            response = client.post(f"/api/invoices/{invoice.id}/payments", json=full_payment_data)
            assert response.status_code == 201
        
        # Verify final invoice status
        db.refresh(invoice)
        assert float(invoice.paid_amount) == 1000.00
        assert float(invoice.balance_amount) == 0.00
        assert invoice.status == "Paid"
        
        # Verify all payments exist
        payments_list = db.query(Payment).filter(Payment.invoice_id == invoice.id).all()
        assert len(payments_list) == 3
