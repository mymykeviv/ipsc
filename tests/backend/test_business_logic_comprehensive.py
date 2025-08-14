"""
Comprehensive automated tests for all business logic
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from backend.app.models import Invoice, Party, Product, Purchase, PurchaseItem, InvoiceItem, Payment, PurchasePayment
from decimal import Decimal
from datetime import datetime, timedelta


class TestBusinessLogicComprehensive:
    """Comprehensive tests for all business logic"""

    def test_gst_calculation_accuracy(self, client: TestClient, db: Session):
        """Test GST calculation accuracy for different scenarios"""
        # Create test data
        customer = Party(
            type="customer",
            name="Test Customer",
            billing_address_line1="123 Test St",
            billing_city="Test City",
            billing_state="Test State",
            billing_country="India",
            gstin="22AAAAA0000A1Z5"
        )
        db.add(customer)
        db.commit()
        
        supplier = Party(
            type="vendor",
            name="Test Supplier",
            billing_address_line1="456 Supplier St",
            billing_city="Supplier City",
            billing_state="Supplier State",
            billing_country="India",
            gstin="33BBBBB0000B1Z5"
        )
        db.add(supplier)
        db.commit()
        
        product = Product(
            name="Test Product",
            sales_price=Decimal("100.00"),
            purchase_price=Decimal("80.00"),
            stock=100,
            unit="Pcs",
            hsn="12345678",
            gst_rate=18.0
        )
        db.add(product)
        db.commit()
        
        # Test GST calculation for invoice
        invoice_data = {
            "customer_id": customer.id,
            "supplier_id": supplier.id,
            "invoice_no": "INV-GST-001",
            "date": "2025-01-14",
            "due_date": "2025-02-14",
            "items": [
                {
                    "product_id": product.id,
                    "description": "Test Product",
                    "qty": 10,
                    "rate": 100.00,
                    "gst_rate": 18.0
                }
            ]
        }
        
        response = client.post("/api/invoices", json=invoice_data)
        assert response.status_code == 201
        
        data = response.json()
        # Verify GST calculations
        taxable_value = 10 * 100.00  # 1000.00
        expected_cgst = taxable_value * 0.09  # 90.00
        expected_sgst = taxable_value * 0.09  # 90.00
        expected_total = taxable_value + expected_cgst + expected_sgst  # 1180.00
        
        assert abs(float(data["grand_total"]) - expected_total) < 0.01
        assert abs(float(data["cgst_total"]) - expected_cgst) < 0.01
        assert abs(float(data["sgst_total"]) - expected_sgst) < 0.01

    def test_stock_movement_validation(self, client: TestClient, db: Session):
        """Test stock movement validation and updates"""
        # Create test product
        product = Product(
            name="Stock Test Product",
            sales_price=Decimal("100.00"),
            purchase_price=Decimal("80.00"),
            stock=50,
            unit="Pcs",
            hsn="12345678",
            gst_rate=18.0
        )
        db.add(product)
        db.commit()
        
        initial_stock = product.stock
        
        # Test stock reduction via invoice
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
        
        invoice_data = {
            "customer_id": customer.id,
            "supplier_id": supplier.id,
            "invoice_no": "INV-STOCK-001",
            "date": "2025-01-14",
            "due_date": "2025-02-14",
            "items": [
                {
                    "product_id": product.id,
                    "description": "Stock Test Product",
                    "qty": 10,
                    "rate": 100.00,
                    "gst_rate": 18.0
                }
            ]
        }
        
        response = client.post("/api/invoices", json=invoice_data)
        assert response.status_code == 201
        
        # Verify stock reduction
        db.refresh(product)
        assert product.stock == initial_stock - 10
        
        # Test stock addition via purchase
        vendor = Party(
            type="vendor",
            name="Test Vendor",
            billing_address_line1="789 Vendor St",
            billing_city="Vendor City",
            billing_state="Vendor State",
            billing_country="India"
        )
        db.add(vendor)
        db.commit()
        
        purchase_data = {
            "vendor_id": vendor.id,
            "purchase_no": "PUR-STOCK-001",
            "date": "2025-01-14",
            "due_date": "2025-02-14",
            "items": [
                {
                    "product_id": product.id,
                    "description": "Stock Test Product",
                    "qty": 20,
                    "rate": 80.00,
                    "gst_rate": 18.0
                }
            ]
        }
        
        response = client.post("/api/purchases", json=purchase_data)
        assert response.status_code == 201
        
        # Verify stock addition
        db.refresh(product)
        assert product.stock == (initial_stock - 10) + 20

    def test_financial_calculations_accuracy(self, client: TestClient, db: Session):
        """Test financial calculations accuracy"""
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
        
        product = Product(
            name="Financial Test Product",
            sales_price=Decimal("100.00"),
            purchase_price=Decimal("80.00"),
            stock=100,
            unit="Pcs",
            hsn="12345678",
            gst_rate=18.0
        )
        db.add(product)
        db.commit()
        
        # Create invoice with multiple items and discounts
        invoice_data = {
            "customer_id": customer.id,
            "supplier_id": supplier.id,
            "invoice_no": "INV-FIN-001",
            "date": "2025-01-14",
            "due_date": "2025-02-14",
            "items": [
                {
                    "product_id": product.id,
                    "description": "Financial Test Product",
                    "qty": 5,
                    "rate": 100.00,
                    "discount": 10.00,
                    "discount_type": "Percentage",
                    "gst_rate": 18.0
                },
                {
                    "product_id": product.id,
                    "description": "Financial Test Product",
                    "qty": 3,
                    "rate": 100.00,
                    "discount": 50.00,
                    "discount_type": "Fixed",
                    "gst_rate": 18.0
                }
            ]
        }
        
        response = client.post("/api/invoices", json=invoice_data)
        assert response.status_code == 201
        
        data = response.json()
        
        # Verify calculations
        # Item 1: 5 * 100 = 500, discount 10% = 50, taxable = 450
        # Item 2: 3 * 100 = 300, discount 50 = 250, taxable = 250
        # Total taxable = 700
        # GST = 700 * 18% = 126
        # Grand total = 700 + 126 = 826
        
        expected_total = 826.00
        assert abs(float(data["grand_total"]) - expected_total) < 0.01

    def test_business_rules_validation(self, client: TestClient, db: Session):
        """Test business rules validation"""
        # Test 1: Cannot create invoice with negative quantity
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
            name="Business Rules Test Product",
            sales_price=Decimal("100.00"),
            purchase_price=Decimal("80.00"),
            stock=100,
            unit="Pcs",
            hsn="12345678",
            gst_rate=18.0
        )
        db.add(product)
        db.commit()
        
        # Test negative quantity
        invoice_data = {
            "customer_id": customer.id,
            "supplier_id": supplier.id,
            "invoice_no": "INV-RULES-001",
            "date": "2025-01-14",
            "due_date": "2025-02-14",
            "items": [
                {
                    "product_id": product.id,
                    "description": "Business Rules Test Product",
                    "qty": -5,  # Invalid negative quantity
                    "rate": 100.00,
                    "gst_rate": 18.0
                }
            ]
        }
        
        response = client.post("/api/invoices", json=invoice_data)
        assert response.status_code in [400, 422]  # Should fail validation
        
        # Test 2: Cannot create invoice with zero rate
        invoice_data["items"][0]["qty"] = 5
        invoice_data["items"][0]["rate"] = 0.00  # Invalid zero rate
        
        response = client.post("/api/invoices", json=invoice_data)
        assert response.status_code in [400, 422]  # Should fail validation

    def test_payment_reconciliation(self, client: TestClient, db: Session):
        """Test payment reconciliation logic"""
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
        
        product = Product(
            name="Payment Test Product",
            sales_price=Decimal("100.00"),
            purchase_price=Decimal("80.00"),
            stock=100,
            unit="Pcs",
            hsn="12345678",
            gst_rate=18.0
        )
        db.add(product)
        db.commit()
        
        invoice_data = {
            "customer_id": customer.id,
            "supplier_id": supplier.id,
            "invoice_no": "INV-PAY-001",
            "date": "2025-01-14",
            "due_date": "2025-02-14",
            "items": [
                {
                    "product_id": product.id,
                    "description": "Payment Test Product",
                    "qty": 10,
                    "rate": 100.00,
                    "gst_rate": 18.0
                }
            ]
        }
        
        response = client.post("/api/invoices", json=invoice_data)
        assert response.status_code == 201
        
        invoice_id = response.json()["id"]
        invoice_total = float(response.json()["grand_total"])
        
        # Add multiple payments
        payments = [
            {"amount": invoice_total * 0.3, "method": "Cash", "reference": "PAY-001"},
            {"amount": invoice_total * 0.4, "method": "Bank Transfer", "reference": "PAY-002"},
            {"amount": invoice_total * 0.3, "method": "UPI", "reference": "PAY-003"}
        ]
        
        total_paid = 0
        for payment in payments:
            payment_data = {
                "amount": payment["amount"],
                "method": payment["method"],
                "account_head": "Bank",
                "reference_number": payment["reference"],
                "notes": f"Payment {payment['reference']}"
            }
            
            response = client.post(f"/api/invoices/{invoice_id}/payments", json=payment_data)
            assert response.status_code == 201
            
            total_paid += payment["amount"]
        
        # Verify reconciliation
        invoice_response = client.get(f"/api/invoices/{invoice_id}")
        assert invoice_response.status_code == 200
        
        invoice_data = invoice_response.json()
        assert abs(float(invoice_data["paid_amount"]) - total_paid) < 0.01
        assert abs(float(invoice_data["balance_amount"]) - (invoice_total - total_paid)) < 0.01
        
        # Should be marked as paid
        assert invoice_data["status"] == "Paid"

    def test_stock_overflow_prevention(self, client: TestClient, db: Session):
        """Test stock overflow prevention"""
        # Create test product with limited stock
        product = Product(
            name="Limited Stock Product",
            sales_price=Decimal("100.00"),
            purchase_price=Decimal("80.00"),
            stock=5,  # Only 5 items in stock
            unit="Pcs",
            hsn="12345678",
            gst_rate=18.0
        )
        db.add(product)
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
        
        # Try to create invoice with more quantity than available stock
        invoice_data = {
            "customer_id": customer.id,
            "supplier_id": supplier.id,
            "invoice_no": "INV-OVERFLOW-001",
            "date": "2025-01-14",
            "due_date": "2025-02-14",
            "items": [
                {
                    "product_id": product.id,
                    "description": "Limited Stock Product",
                    "qty": 10,  # More than available stock (5)
                    "rate": 100.00,
                    "gst_rate": 18.0
                }
            ]
        }
        
        response = client.post("/api/invoices", json=invoice_data)
        # Should fail due to insufficient stock
        assert response.status_code in [400, 422, 409]  # Depending on validation

    def test_duplicate_invoice_prevention(self, client: TestClient, db: Session):
        """Test duplicate invoice number prevention"""
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
            name="Duplicate Test Product",
            sales_price=Decimal("100.00"),
            purchase_price=Decimal("80.00"),
            stock=100,
            unit="Pcs",
            hsn="12345678",
            gst_rate=18.0
        )
        db.add(product)
        db.commit()
        
        # Create first invoice
        invoice_data = {
            "customer_id": customer.id,
            "supplier_id": supplier.id,
            "invoice_no": "INV-DUP-001",
            "date": "2025-01-14",
            "due_date": "2025-02-14",
            "items": [
                {
                    "product_id": product.id,
                    "description": "Duplicate Test Product",
                    "qty": 5,
                    "rate": 100.00,
                    "gst_rate": 18.0
                }
            ]
        }
        
        response = client.post("/api/invoices", json=invoice_data)
        assert response.status_code == 201
        
        # Try to create second invoice with same invoice number
        response = client.post("/api/invoices", json=invoice_data)
        # Should fail due to duplicate invoice number
        assert response.status_code in [400, 409, 422]  # Depending on validation

    def test_financial_period_validation(self, client: TestClient, db: Session):
        """Test financial period validation"""
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
            name="Period Test Product",
            sales_price=Decimal("100.00"),
            purchase_price=Decimal("80.00"),
            stock=100,
            unit="Pcs",
            hsn="12345678",
            gst_rate=18.0
        )
        db.add(product)
        db.commit()
        
        # Test invoice with due date before invoice date
        invoice_data = {
            "customer_id": customer.id,
            "supplier_id": supplier.id,
            "invoice_no": "INV-PERIOD-001",
            "date": "2025-01-14",
            "due_date": "2025-01-10",  # Due date before invoice date
            "items": [
                {
                    "product_id": product.id,
                    "description": "Period Test Product",
                    "qty": 5,
                    "rate": 100.00,
                    "gst_rate": 18.0
                }
            ]
        }
        
        response = client.post("/api/invoices", json=invoice_data)
        # Should fail due to invalid date range
        assert response.status_code in [400, 422]  # Depending on validation

    def test_business_rule_edge_cases(self, client: TestClient, db: Session):
        """Test business rule edge cases"""
        # Test 1: Zero amount invoice
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
            name="Edge Case Product",
            sales_price=Decimal("0.00"),  # Zero price
            purchase_price=Decimal("0.00"),
            stock=100,
            unit="Pcs",
            hsn="12345678",
            gst_rate=0.0
        )
        db.add(product)
        db.commit()
        
        invoice_data = {
            "customer_id": customer.id,
            "supplier_id": supplier.id,
            "invoice_no": "INV-EDGE-001",
            "date": "2025-01-14",
            "due_date": "2025-02-14",
            "items": [
                {
                    "product_id": product.id,
                    "description": "Edge Case Product",
                    "qty": 10,
                    "rate": 0.00,
                    "gst_rate": 0.0
                }
            ]
        }
        
        response = client.post("/api/invoices", json=invoice_data)
        # Should handle zero amount gracefully
        assert response.status_code in [201, 400, 422]  # Depending on business rules
        
        # Test 2: Very large amounts
        product.sales_price = Decimal("999999.99")
        db.commit()
        
        invoice_data["invoice_no"] = "INV-EDGE-002"
        invoice_data["items"][0]["rate"] = 999999.99
        
        response = client.post("/api/invoices", json=invoice_data)
        # Should handle large amounts
        assert response.status_code in [201, 400, 422]  # Depending on business rules
