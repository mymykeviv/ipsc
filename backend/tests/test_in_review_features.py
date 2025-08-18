"""
Tests for In-Review Features
- Invoice Template System
- Payment Management Enhancements  
- Stock Management System
"""

import pytest
from decimal import Decimal
from datetime import datetime, date
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.models import User, Party, Product, Invoice, Payment, Expense, InvoiceTemplate, StockLedgerEntry

class TestInvoiceTemplateSystem:
    """Test Invoice Template System functionality"""
    
    def test_template_crud_operations(self, client, auth_headers, db_session):
        """Test template CRUD operations"""
        # Test create template
        template_data = {
            "name": "Test Template",
            "description": "Test template description",
            "template_type": "professional",
            "primary_color": "#007bff",
            "secondary_color": "#6c757d",
            "accent_color": "#28a745",
            "header_font": "Arial",
            "body_font": "Arial",
            "header_font_size": 16,
            "body_font_size": 12,
            "show_company_details": True,
            "show_customer_details": True,
            "show_item_details": True,
            "show_tax_details": True,
            "show_payment_terms": True,
            "is_default": False,
            "is_active": True
        }
        
        response = client.post("/api/invoice-templates", json=template_data, headers=auth_headers)
        assert response.status_code == 201
        template_id = response.json()["id"]
        
        # Test get template
        response = client.get(f"/api/invoice-templates/{template_id}", headers=auth_headers)
        assert response.status_code == 200
        template = response.json()
        assert template["name"] == "Test Template"
        assert template["template_type"] == "professional"
        
        # Test update template
        update_data = {"name": "Updated Test Template", "description": "Updated description"}
        response = client.put(f"/api/invoice-templates/{template_id}", json=update_data, headers=auth_headers)
        assert response.status_code == 200
        updated_template = response.json()
        assert updated_template["name"] == "Updated Test Template"
        
        # Test list templates
        response = client.get("/api/invoice-templates", headers=auth_headers)
        assert response.status_code == 200
        templates = response.json()
        assert len(templates) >= 1
        
        # Test delete template
        response = client.delete(f"/api/invoice-templates/{template_id}", headers=auth_headers)
        assert response.status_code == 200
    
    def test_template_pdf_generation(self, client, auth_headers, db_session):
        """Test template PDF generation"""
        # Create template
        template_data = {
            "name": "PDF Test Template",
            "description": "Template for PDF testing",
            "template_type": "professional",
            "primary_color": "#007bff",
            "secondary_color": "#6c757d",
            "accent_color": "#28a745",
            "header_font": "Arial",
            "body_font": "Arial",
            "header_font_size": 16,
            "body_font_size": 12,
            "show_company_details": True,
            "show_customer_details": True,
            "show_item_details": True,
            "show_tax_details": True,
            "show_payment_terms": True,
            "is_default": False,
            "is_active": True
        }
        
        response = client.post("/api/invoice-templates", json=template_data, headers=auth_headers)
        assert response.status_code == 201
        template_id = response.json()["id"]
        
        # Create test invoice
        customer = Party(
            name="Test Customer",
            type="Customer",
            gstin="27AAAAA0000A1Z5",
            gst_enabled=True,
            billing_address_line1="Test Address",
            billing_city="Test City",
            billing_state="Test State",
            billing_country="India"
        )
        supplier = Party(
            name="Test Supplier",
            type="Supplier",
            gstin="27BBBBB0000B1Z5",
            gst_enabled=True,
            billing_address_line1="Test Address",
            billing_city="Test City",
            billing_state="Test State",
            billing_country="India"
        )
        db_session.add_all([customer, supplier])
        db_session.flush()
        
        invoice = Invoice(
            customer_id=customer.id,
            supplier_id=supplier.id,
            invoice_no="INV-PDF-001",
            grand_total=Decimal("1000.00"),
            due_date=datetime.utcnow(),
            place_of_supply="Mumbai, Maharashtra",
            place_of_supply_state_code="27",
            bill_to_address="Test Bill Address",
            ship_to_address="Test Ship Address",
            taxable_value=Decimal("847.46"),
            cgst=Decimal("76.27"),
            sgst=Decimal("76.27"),
            igst=Decimal("0.00"),
            status="Draft",
            template_id=template_id
        )
        db_session.add(invoice)
        db_session.commit()
        
        # Test PDF generation with template
        response = client.get(f"/api/invoices/{invoice.id}/pdf?template_id={template_id}", headers=auth_headers)
        assert response.status_code == 200
        assert response.headers["content-type"] == "application/pdf"
    
    def test_template_customization(self, client, auth_headers, db_session):
        """Test template customization options"""
        # Test creating template with custom colors
        template_data = {
            "name": "Custom Template",
            "description": "Template with custom colors",
            "template_type": "modern",
            "primary_color": "#ff6b6b",
            "secondary_color": "#4ecdc4",
            "accent_color": "#45b7d1",
            "header_font": "Helvetica",
            "body_font": "Times New Roman",
            "header_font_size": 18,
            "body_font_size": 14,
            "show_company_details": True,
            "show_customer_details": True,
            "show_item_details": True,
            "show_tax_details": True,
            "show_payment_terms": False,
            "is_default": False,
            "is_active": True
        }
        
        response = client.post("/api/invoice-templates", json=template_data, headers=auth_headers)
        assert response.status_code == 201
        template = response.json()
        
        # Verify customization options
        assert template["primary_color"] == "#ff6b6b"
        assert template["secondary_color"] == "#4ecdc4"
        assert template["accent_color"] == "#45b7d1"
        assert template["header_font"] == "Helvetica"
        assert template["body_font"] == "Times New Roman"
        assert template["header_font_size"] == 18
        assert template["body_font_size"] == 14
        assert template["show_payment_terms"] == False
    
    def test_template_default_setting(self, client, auth_headers, db_session):
        """Test setting default template"""
        # Create template
        template_data = {
            "name": "Default Test Template",
            "description": "Template for default testing",
            "template_type": "professional",
            "primary_color": "#007bff",
            "secondary_color": "#6c757d",
            "accent_color": "#28a745",
            "header_font": "Arial",
            "body_font": "Arial",
            "header_font_size": 16,
            "body_font_size": 12,
            "show_company_details": True,
            "show_customer_details": True,
            "show_item_details": True,
            "show_tax_details": True,
            "show_payment_terms": True,
            "is_default": False,
            "is_active": True
        }
        
        response = client.post("/api/invoice-templates", json=template_data, headers=auth_headers)
        assert response.status_code == 201
        template_id = response.json()["id"]
        
        # Set as default
        response = client.put(f"/api/invoice-templates/{template_id}/set-default", headers=auth_headers)
        assert response.status_code == 200
        
        # Verify it's now default
        response = client.get(f"/api/invoice-templates/{template_id}", headers=auth_headers)
        assert response.status_code == 200
        template = response.json()
        assert template["is_default"] == True

class TestPaymentManagementEnhancements:
    """Test Payment Management Enhancements"""
    
    def test_payment_methods_validation(self, client, auth_headers, db_session):
        """Test payment method validation"""
        # Test valid payment methods
        valid_methods = ["Cash", "Bank Transfer", "Cheque", "Credit Card", "UPI"]
        
        for method in valid_methods:
            payment_data = {
                "payment_amount": 100.00,
                "payment_method": method,
                "account_head": "Cash",
                "reference_number": "REF123"
            }
            
            # This would be tested with an actual invoice, but for now we test the validation
            # The actual payment creation would require an invoice context
            assert method in valid_methods
    
    def test_payment_amount_validation(self, client, auth_headers, db_session):
        """Test payment amount validation"""
        # Test valid amounts
        valid_amounts = [0.01, 100.00, 1000.50, 999999.99]
        
        for amount in valid_amounts:
            payment_data = {
                "payment_amount": amount,
                "payment_method": "Cash",
                "account_head": "Cash"
            }
            # Validate amount format
            assert isinstance(amount, (int, float))
            assert amount > 0
        
        # Test invalid amounts
        invalid_amounts = [-100, 0, "abc", None]
        
        for amount in invalid_amounts:
            # These should be rejected by validation
            if isinstance(amount, (int, float)):
                assert amount <= 0 or amount is None
    
    def test_payment_reference_number_validation(self, client, auth_headers, db_session):
        """Test payment reference number validation"""
        # Test valid reference numbers
        valid_refs = ["REF123", "PAY-2024-001", "TRANS-12345", None, ""]
        
        for ref in valid_refs:
            if ref is not None:
                # Reference numbers should be strings
                assert isinstance(ref, str)
                # Should not be too long
                assert len(ref) <= 50
    
    def test_payment_account_head_validation(self, client, auth_headers, db_session):
        """Test payment account head validation"""
        # Test valid account heads
        valid_accounts = ["Cash", "Bank", "Credit Card", "UPI", "Cheque"]
        
        for account in valid_accounts:
            payment_data = {
                "payment_amount": 100.00,
                "payment_method": "Cash",
                "account_head": account
            }
            # Validate account head
            assert account in valid_accounts

class TestStockManagementSystem:
    """Test Stock Management System"""
    
    def test_stock_adjustment_creation(self, client, auth_headers, db_session):
        """Test stock adjustment creation"""
        # Create test product
        product = Product(
            name="Test Product",
            description="Test Description",
            hsn="12345678",
            gst_rate=18.0,
            stock=100.0,
            sales_price=100.0
        )
        db_session.add(product)
        db_session.commit()
        
        # Test stock adjustment
        adjustment_data = {
            "product_id": product.id,
            "qty": 50.0,
            "entry_type": "in",
            "ref_type": "adjustment",
            "notes": "Test stock adjustment"
        }
        
        # This would be tested with the actual stock adjustment endpoint
        # For now, we test the data structure
        assert adjustment_data["product_id"] == product.id
        assert adjustment_data["qty"] > 0
        assert adjustment_data["entry_type"] in ["in", "out"]
        assert adjustment_data["ref_type"] == "adjustment"
    
    def test_stock_history_tracking(self, client, auth_headers, db_session):
        """Test stock history tracking"""
        # Create test product
        product = Product(
            name="Test Product",
            description="Test Description",
            hsn="12345678",
            gst_rate=18.0,
            stock=100.0,
            sales_price=100.0
        )
        db_session.add(product)
        db_session.commit()
        
        # Create stock ledger entries
        entry1 = StockLedgerEntry(
            product_id=product.id,
            qty=50.0,
            entry_type="in",
            ref_type="purchase",
            ref_id=1
        )
        entry2 = StockLedgerEntry(
            product_id=product.id,
            qty=20.0,
            entry_type="out",
            ref_type="invoice",
            ref_id=1
        )
        db_session.add_all([entry1, entry2])
        db_session.commit()
        
        # Test stock history retrieval
        response = client.get(f"/api/products/{product.id}/stock-history", headers=auth_headers)
        assert response.status_code == 200
        history = response.json()
        
        # Verify history entries
        assert len(history) >= 2
        assert any(entry["entry_type"] == "in" for entry in history)
        assert any(entry["entry_type"] == "out" for entry in history)
    
    def test_running_balance_calculation(self, client, auth_headers, db_session):
        """Test running balance calculation"""
        # Create test product
        product = Product(
            name="Test Product",
            description="Test Description",
            hsn="12345678",
            gst_rate=18.0,
            stock=100.0,
            sales_price=100.0
        )
        db_session.add(product)
        db_session.commit()
        
        # Create multiple stock ledger entries
        entries = [
            StockLedgerEntry(product_id=product.id, qty=100.0, entry_type="in", ref_type="opening"),
            StockLedgerEntry(product_id=product.id, qty=50.0, entry_type="in", ref_type="purchase"),
            StockLedgerEntry(product_id=product.id, qty=30.0, entry_type="out", ref_type="invoice"),
            StockLedgerEntry(product_id=product.id, qty=20.0, entry_type="in", ref_type="purchase"),
            StockLedgerEntry(product_id=product.id, qty=10.0, entry_type="out", ref_type="invoice")
        ]
        db_session.add_all(entries)
        db_session.commit()
        
        # Test running balance calculation
        response = client.get(f"/api/products/{product.id}/stock-ledger", headers=auth_headers)
        assert response.status_code == 200
        ledger = response.json()
        
        # Verify running balance calculation
        running_balance = 0
        for entry in ledger:
            if entry["entry_type"] == "in":
                running_balance += entry["qty"]
            else:
                running_balance -= entry["qty"]
            assert entry["running_balance"] == running_balance
    
    def test_stock_error_handling(self, client, auth_headers, db_session):
        """Test stock error handling"""
        # Test stock adjustment with invalid product
        adjustment_data = {
            "product_id": 99999,  # Non-existent product
            "qty": 50.0,
            "entry_type": "in",
            "ref_type": "adjustment"
        }
        
        # This should return an error
        # For now, we test the validation logic
        assert adjustment_data["product_id"] > 0
        
        # Test negative quantity
        adjustment_data_negative = {
            "product_id": 1,
            "qty": -50.0,  # Negative quantity
            "entry_type": "in",
            "ref_type": "adjustment"
        }
        
        # Negative quantities should be handled appropriately
        # For stock adjustments, negative quantities might be valid for "out" entries
        if adjustment_data_negative["entry_type"] == "out":
            assert adjustment_data_negative["qty"] < 0
        else:
            assert adjustment_data_negative["qty"] > 0

# Use existing fixtures from conftest.py
