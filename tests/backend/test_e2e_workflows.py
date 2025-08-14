"""
Comprehensive E2E workflow tests for complete business processes
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from backend.app.models import Invoice, Party, Product, Purchase, Payment, PurchasePayment, User, Role
from decimal import Decimal
from datetime import datetime, timedelta


class TestE2EWorkflows:
    """Comprehensive E2E workflow tests"""

    def test_complete_sales_workflow(self, client: TestClient, db: Session):
        """Test complete sales workflow from product creation to payment"""
        # Step 1: Create customer
        customer = Party(
            type="customer",
            name="E2E Customer",
            billing_address_line1="123 E2E St",
            billing_city="E2E City",
            billing_state="E2E State",
            billing_country="India",
            gstin="22E2E0000000E1Z5"
        )
        db.add(customer)
        db.commit()
        
        # Step 2: Create supplier
        supplier = Party(
            type="vendor",
            name="E2E Supplier",
            billing_address_line1="456 E2E St",
            billing_city="E2E City",
            billing_state="E2E State",
            billing_country="India",
            gstin="33E2E0000000E1Z5"
        )
        db.add(supplier)
        db.commit()
        
        # Step 3: Create product
        product = Product(
            name="E2E Test Product",
            sales_price=Decimal("150.00"),
            purchase_price=Decimal("100.00"),
            stock=100,
            unit="Pcs",
            hsn="12345678",
            gst_rate=18.0
        )
        db.add(product)
        db.commit()
        
        # Step 4: Create purchase to add stock
        vendor = Party(
            type="vendor",
            name="E2E Vendor",
            billing_address_line1="789 E2E St",
            billing_city="E2E City",
            billing_state="E2E State",
            billing_country="India"
        )
        db.add(vendor)
        db.commit()
        
        purchase_data = {
            "vendor_id": vendor.id,
            "purchase_no": "PUR-E2E-001",
            "date": "2025-01-14",
            "due_date": "2025-02-14",
            "items": [
                {
                    "product_id": product.id,
                    "description": "E2E Test Product",
                    "qty": 50,
                    "rate": 100.00,
                    "gst_rate": 18.0
                }
            ]
        }
        
        response = client.post("/api/purchases", json=purchase_data)
        assert response.status_code == 201
        
        # Step 5: Create invoice
        invoice_data = {
            "customer_id": customer.id,
            "supplier_id": supplier.id,
            "invoice_no": "INV-E2E-001",
            "date": "2025-01-15",
            "due_date": "2025-02-15",
            "items": [
                {
                    "product_id": product.id,
                    "description": "E2E Test Product",
                    "qty": 20,
                    "rate": 150.00,
                    "gst_rate": 18.0
                }
            ]
        }
        
        response = client.post("/api/invoices", json=invoice_data)
        assert response.status_code == 201
        
        invoice_id = response.json()["id"]
        invoice_total = float(response.json()["grand_total"])
        
        # Step 6: Add payment
        payment_data = {
            "amount": invoice_total,
            "method": "Bank Transfer",
            "account_head": "Bank",
            "reference_number": "PAY-E2E-001",
            "notes": "Full payment for E2E test"
        }
        
        response = client.post(f"/api/invoices/{invoice_id}/payments", json=payment_data)
        assert response.status_code == 201
        
        # Step 7: Verify final state
        invoice_response = client.get(f"/api/invoices/{invoice_id}")
        assert invoice_response.status_code == 200
        
        final_invoice = invoice_response.json()
        assert final_invoice["status"] == "Paid"
        assert float(final_invoice["paid_amount"]) == invoice_total
        assert float(final_invoice["balance_amount"]) == 0.00
        
        # Verify stock reduction
        db.refresh(product)
        assert product.stock == 130  # 100 + 50 - 20

    def test_complete_purchase_workflow(self, client: TestClient, db: Session):
        """Test complete purchase workflow from vendor creation to payment"""
        # Step 1: Create vendor
        vendor = Party(
            type="vendor",
            name="E2E Purchase Vendor",
            billing_address_line1="123 Purchase St",
            billing_city="Purchase City",
            billing_state="Purchase State",
            billing_country="India",
            gstin="44PUR0000000P1Z5"
        )
        db.add(vendor)
        db.commit()
        
        # Step 2: Create product
        product = Product(
            name="E2E Purchase Product",
            sales_price=Decimal("200.00"),
            purchase_price=Decimal("150.00"),
            stock=0,  # Start with zero stock
            unit="Pcs",
            hsn="87654321",
            gst_rate=18.0
        )
        db.add(product)
        db.commit()
        
        # Step 3: Create purchase
        purchase_data = {
            "vendor_id": vendor.id,
            "purchase_no": "PUR-E2E-002",
            "date": "2025-01-16",
            "due_date": "2025-02-16",
            "items": [
                {
                    "product_id": product.id,
                    "description": "E2E Purchase Product",
                    "qty": 30,
                    "rate": 150.00,
                    "gst_rate": 18.0
                }
            ]
        }
        
        response = client.post("/api/purchases", json=purchase_data)
        assert response.status_code == 201
        
        purchase_id = response.json()["id"]
        purchase_total = float(response.json()["grand_total"])
        
        # Step 4: Add purchase payment
        payment_data = {
            "amount": purchase_total,
            "method": "Bank Transfer",
            "account_head": "Bank",
            "reference_number": "PAY-PUR-E2E-001",
            "notes": "Full payment for purchase"
        }
        
        response = client.post(f"/api/purchases/{purchase_id}/payments", json=payment_data)
        assert response.status_code == 201
        
        # Step 5: Verify final state
        purchase_response = client.get(f"/api/purchases/{purchase_id}")
        assert purchase_response.status_code == 200
        
        final_purchase = purchase_response.json()
        assert final_purchase["status"] == "Paid"
        assert float(final_purchase["paid_amount"]) == purchase_total
        assert float(final_purchase["balance_amount"]) == 0.00
        
        # Verify stock addition
        db.refresh(product)
        assert product.stock == 30

    def test_multi_step_payment_workflow(self, client: TestClient, db: Session):
        """Test multi-step payment workflow with partial payments"""
        # Create test data
        customer = Party(
            type="customer",
            name="Multi-Payment Customer",
            billing_address_line1="123 Multi St",
            billing_city="Multi City",
            billing_state="Multi State",
            billing_country="India"
        )
        db.add(customer)
        db.commit()
        
        supplier = Party(
            type="vendor",
            name="Multi-Payment Supplier",
            billing_address_line1="456 Multi St",
            billing_city="Multi City",
            billing_state="Multi State",
            billing_country="India"
        )
        db.add(supplier)
        db.commit()
        
        product = Product(
            name="Multi-Payment Product",
            sales_price=Decimal("1000.00"),
            purchase_price=Decimal("800.00"),
            stock=10,
            unit="Pcs",
            hsn="12345678",
            gst_rate=18.0
        )
        db.add(product)
        db.commit()
        
        # Create invoice
        invoice_data = {
            "customer_id": customer.id,
            "supplier_id": supplier.id,
            "invoice_no": "INV-MULTI-001",
            "date": "2025-01-17",
            "due_date": "2025-02-17",
            "items": [
                {
                    "product_id": product.id,
                    "description": "Multi-Payment Product",
                    "qty": 5,
                    "rate": 1000.00,
                    "gst_rate": 18.0
                }
            ]
        }
        
        response = client.post("/api/invoices", json=invoice_data)
        assert response.status_code == 201
        
        invoice_id = response.json()["id"]
        invoice_total = float(response.json()["grand_total"])
        
        # Step 1: First partial payment (30%)
        payment1_data = {
            "amount": invoice_total * 0.3,
            "method": "Cash",
            "account_head": "Cash",
            "reference_number": "PAY-MULTI-001",
            "notes": "First partial payment"
        }
        
        response = client.post(f"/api/invoices/{invoice_id}/payments", json=payment1_data)
        assert response.status_code == 201
        
        # Verify intermediate state
        invoice_response = client.get(f"/api/invoices/{invoice_id}")
        assert invoice_response.status_code == 200
        
        intermediate_invoice = invoice_response.json()
        assert intermediate_invoice["status"] == "Partially Paid"
        assert abs(float(intermediate_invoice["paid_amount"]) - (invoice_total * 0.3)) < 0.01
        
        # Step 2: Second partial payment (40%)
        payment2_data = {
            "amount": invoice_total * 0.4,
            "method": "Bank Transfer",
            "account_head": "Bank",
            "reference_number": "PAY-MULTI-002",
            "notes": "Second partial payment"
        }
        
        response = client.post(f"/api/invoices/{invoice_id}/payments", json=payment2_data)
        assert response.status_code == 201
        
        # Verify intermediate state
        invoice_response = client.get(f"/api/invoices/{invoice_id}")
        assert invoice_response.status_code == 200
        
        intermediate_invoice = invoice_response.json()
        assert intermediate_invoice["status"] == "Partially Paid"
        assert abs(float(intermediate_invoice["paid_amount"]) - (invoice_total * 0.7)) < 0.01
        
        # Step 3: Final payment (30%)
        payment3_data = {
            "amount": invoice_total * 0.3,
            "method": "UPI",
            "account_head": "Bank",
            "reference_number": "PAY-MULTI-003",
            "notes": "Final payment"
        }
        
        response = client.post(f"/api/invoices/{invoice_id}/payments", json=payment3_data)
        assert response.status_code == 201
        
        # Verify final state
        invoice_response = client.get(f"/api/invoices/{invoice_id}")
        assert invoice_response.status_code == 200
        
        final_invoice = invoice_response.json()
        assert final_invoice["status"] == "Paid"
        assert abs(float(final_invoice["paid_amount"]) - invoice_total) < 0.01
        assert float(final_invoice["balance_amount"]) == 0.00

    def test_stock_management_workflow(self, client: TestClient, db: Session):
        """Test complete stock management workflow"""
        # Create product with initial stock
        product = Product(
            name="Stock Management Product",
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
        
        # Create customer and supplier
        customer = Party(
            type="customer",
            name="Stock Customer",
            billing_address_line1="123 Stock St",
            billing_city="Stock City",
            billing_state="Stock State",
            billing_country="India"
        )
        db.add(customer)
        db.commit()
        
        supplier = Party(
            type="vendor",
            name="Stock Supplier",
            billing_address_line1="456 Stock St",
            billing_city="Stock City",
            billing_state="Stock State",
            billing_country="India"
        )
        db.add(supplier)
        db.commit()
        
        vendor = Party(
            type="vendor",
            name="Stock Vendor",
            billing_address_line1="789 Stock St",
            billing_city="Stock City",
            billing_state="Stock State",
            billing_country="India"
        )
        db.add(vendor)
        db.commit()
        
        # Step 1: Create purchase to add stock
        purchase_data = {
            "vendor_id": vendor.id,
            "purchase_no": "PUR-STOCK-001",
            "date": "2025-01-18",
            "due_date": "2025-02-18",
            "items": [
                {
                    "product_id": product.id,
                    "description": "Stock Management Product",
                    "qty": 30,
                    "rate": 80.00,
                    "gst_rate": 18.0
                }
            ]
        }
        
        response = client.post("/api/purchases", json=purchase_data)
        assert response.status_code == 201
        
        # Verify stock addition
        db.refresh(product)
        assert product.stock == initial_stock + 30
        
        # Step 2: Create invoice to reduce stock
        invoice_data = {
            "customer_id": customer.id,
            "supplier_id": supplier.id,
            "invoice_no": "INV-STOCK-001",
            "date": "2025-01-19",
            "due_date": "2025-02-19",
            "items": [
                {
                    "product_id": product.id,
                    "description": "Stock Management Product",
                    "qty": 20,
                    "rate": 100.00,
                    "gst_rate": 18.0
                }
            ]
        }
        
        response = client.post("/api/invoices", json=invoice_data)
        assert response.status_code == 201
        
        # Verify stock reduction
        db.refresh(product)
        assert product.stock == (initial_stock + 30) - 20
        
        # Step 3: Create another purchase
        purchase_data2 = {
            "vendor_id": vendor.id,
            "purchase_no": "PUR-STOCK-002",
            "date": "2025-01-20",
            "due_date": "2025-02-20",
            "items": [
                {
                    "product_id": product.id,
                    "description": "Stock Management Product",
                    "qty": 15,
                    "rate": 85.00,
                    "gst_rate": 18.0
                }
            ]
        }
        
        response = client.post("/api/purchases", json=purchase_data2)
        assert response.status_code == 201
        
        # Verify final stock
        db.refresh(product)
        expected_stock = initial_stock + 30 - 20 + 15
        assert product.stock == expected_stock

    def test_complete_business_cycle(self, client: TestClient, db: Session):
        """Test complete business cycle with multiple transactions"""
        # Create all required parties
        customer = Party(
            type="customer",
            name="Business Cycle Customer",
            billing_address_line1="123 Cycle St",
            billing_city="Cycle City",
            billing_state="Cycle State",
            billing_country="India"
        )
        db.add(customer)
        db.commit()
        
        supplier = Party(
            type="vendor",
            name="Business Cycle Supplier",
            billing_address_line1="456 Cycle St",
            billing_city="Cycle City",
            billing_state="Cycle State",
            billing_country="India"
        )
        db.add(supplier)
        db.commit()
        
        vendor = Party(
            type="vendor",
            name="Business Cycle Vendor",
            billing_address_line1="789 Cycle St",
            billing_city="Cycle City",
            billing_state="Cycle State",
            billing_country="India"
        )
        db.add(vendor)
        db.commit()
        
        # Create product
        product = Product(
            name="Business Cycle Product",
            sales_price=Decimal("120.00"),
            purchase_price=Decimal("90.00"),
            stock=0,
            unit="Pcs",
            hsn="12345678",
            gst_rate=18.0
        )
        db.add(product)
        db.commit()
        
        # Business Cycle Steps:
        
        # Step 1: Initial purchase
        purchase1_data = {
            "vendor_id": vendor.id,
            "purchase_no": "PUR-CYCLE-001",
            "date": "2025-01-21",
            "due_date": "2025-02-21",
            "items": [
                {
                    "product_id": product.id,
                    "description": "Business Cycle Product",
                    "qty": 100,
                    "rate": 90.00,
                    "gst_rate": 18.0
                }
            ]
        }
        
        response = client.post("/api/purchases", json=purchase1_data)
        assert response.status_code == 201
        
        # Verify stock
        db.refresh(product)
        assert product.stock == 100
        
        # Step 2: First sale
        invoice1_data = {
            "customer_id": customer.id,
            "supplier_id": supplier.id,
            "invoice_no": "INV-CYCLE-001",
            "date": "2025-01-22",
            "due_date": "2025-02-22",
            "items": [
                {
                    "product_id": product.id,
                    "description": "Business Cycle Product",
                    "qty": 30,
                    "rate": 120.00,
                    "gst_rate": 18.0
                }
            ]
        }
        
        response = client.post("/api/invoices", json=invoice1_data)
        assert response.status_code == 201
        
        invoice1_id = response.json()["id"]
        invoice1_total = float(response.json()["grand_total"])
        
        # Verify stock reduction
        db.refresh(product)
        assert product.stock == 70
        
        # Step 3: Second purchase
        purchase2_data = {
            "vendor_id": vendor.id,
            "purchase_no": "PUR-CYCLE-002",
            "date": "2025-01-23",
            "due_date": "2025-02-23",
            "items": [
                {
                    "product_id": product.id,
                    "description": "Business Cycle Product",
                    "qty": 50,
                    "rate": 95.00,
                    "gst_rate": 18.0
                }
            ]
        }
        
        response = client.post("/api/purchases", json=purchase2_data)
        assert response.status_code == 201
        
        # Verify stock addition
        db.refresh(product)
        assert product.stock == 120
        
        # Step 4: Second sale
        invoice2_data = {
            "customer_id": customer.id,
            "supplier_id": supplier.id,
            "invoice_no": "INV-CYCLE-002",
            "date": "2025-01-24",
            "due_date": "2025-02-24",
            "items": [
                {
                    "product_id": product.id,
                    "description": "Business Cycle Product",
                    "qty": 40,
                    "rate": 120.00,
                    "gst_rate": 18.0
                }
            ]
        }
        
        response = client.post("/api/invoices", json=invoice2_data)
        assert response.status_code == 201
        
        invoice2_id = response.json()["id"]
        invoice2_total = float(response.json()["grand_total"])
        
        # Verify stock reduction
        db.refresh(product)
        assert product.stock == 80
        
        # Step 5: Payments for both invoices
        # Payment for first invoice
        payment1_data = {
            "amount": invoice1_total,
            "method": "Bank Transfer",
            "account_head": "Bank",
            "reference_number": "PAY-CYCLE-001",
            "notes": "Payment for first invoice"
        }
        
        response = client.post(f"/api/invoices/{invoice1_id}/payments", json=payment1_data)
        assert response.status_code == 201
        
        # Payment for second invoice
        payment2_data = {
            "amount": invoice2_total,
            "method": "Cash",
            "account_head": "Cash",
            "reference_number": "PAY-CYCLE-002",
            "notes": "Payment for second invoice"
        }
        
        response = client.post(f"/api/invoices/{invoice2_id}/payments", json=payment2_data)
        assert response.status_code == 201
        
        # Verify final states
        invoice1_response = client.get(f"/api/invoices/{invoice1_id}")
        assert invoice1_response.status_code == 200
        assert invoice1_response.json()["status"] == "Paid"
        
        invoice2_response = client.get(f"/api/invoices/{invoice2_id}")
        assert invoice2_response.status_code == 200
        assert invoice2_response.json()["status"] == "Paid"
        
        # Verify final stock
        db.refresh(product)
        assert product.stock == 80

    def test_error_recovery_workflow(self, client: TestClient, db: Session):
        """Test error recovery workflow with invalid operations"""
        # Create test data
        customer = Party(
            type="customer",
            name="Error Recovery Customer",
            billing_address_line1="123 Error St",
            billing_city="Error City",
            billing_state="Error State",
            billing_country="India"
        )
        db.add(customer)
        db.commit()
        
        supplier = Party(
            type="vendor",
            name="Error Recovery Supplier",
            billing_address_line1="456 Error St",
            billing_city="Error City",
            billing_state="Error State",
            billing_country="India"
        )
        db.add(supplier)
        db.commit()
        
        product = Product(
            name="Error Recovery Product",
            sales_price=Decimal("100.00"),
            purchase_price=Decimal("80.00"),
            stock=10,
            unit="Pcs",
            hsn="12345678",
            gst_rate=18.0
        )
        db.add(product)
        db.commit()
        
        # Test 1: Try to create invoice with insufficient stock
        invoice_data = {
            "customer_id": customer.id,
            "supplier_id": supplier.id,
            "invoice_no": "INV-ERROR-001",
            "date": "2025-01-25",
            "due_date": "2025-02-25",
            "items": [
                {
                    "product_id": product.id,
                    "description": "Error Recovery Product",
                    "qty": 20,  # More than available stock (10)
                    "rate": 100.00,
                    "gst_rate": 18.0
                }
            ]
        }
        
        response = client.post("/api/invoices", json=invoice_data)
        # Should fail due to insufficient stock
        assert response.status_code in [400, 422, 409]
        
        # Verify stock remains unchanged
        db.refresh(product)
        assert product.stock == 10
        
        # Test 2: Create valid invoice with available stock
        invoice_data["items"][0]["qty"] = 5  # Valid quantity
        invoice_data["invoice_no"] = "INV-ERROR-002"
        
        response = client.post("/api/invoices", json=invoice_data)
        assert response.status_code == 201
        
        # Verify stock reduction
        db.refresh(product)
        assert product.stock == 5
        
        # Test 3: Try to create duplicate invoice number
        response = client.post("/api/invoices", json=invoice_data)
        # Should fail due to duplicate invoice number
        assert response.status_code in [400, 409, 422]
        
        # Verify stock remains unchanged
        db.refresh(product)
        assert product.stock == 5
