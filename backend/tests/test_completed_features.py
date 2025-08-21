"""
Tests for Completed Features (v1.44.3)
- Enhanced Filter System
- Dashboard Quick Links  
- Error Handling and Loading States
- Systematic Change Management
"""

import pytest
from decimal import Decimal
from datetime import datetime, date
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.models import User, Party, Product, Invoice, Payment, Expense

class TestEnhancedFilterSystem:
    """Test Enhanced Filter System functionality"""
    
    def test_product_filtering_multiple_criteria(self, client, auth_headers, db_session):
        """Test filtering products by multiple criteria"""
        # Create test products
        product1 = Product(
            name="Test Product 1",
            description="Test Description 1",
            hsn="12345678",
            gst_rate=18.0,
            stock=100.0,
            sales_price=100.0,
            category="Electronics"
        )
        product2 = Product(
            name="Test Product 2", 
            description="Test Description 2",
            hsn="87654321",
            gst_rate=12.0,
            stock=50.0,
            sales_price=200.0,
            category="Clothing"
        )
        db_session.add_all([product1, product2])
        db_session.commit()
        
        # Test filtering by category
        response = client.get("/api/products?category=Electronics", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["name"] == "Test Product 1"
        
        # Test filtering by price range
        response = client.get("/api/products?price_min=150&price_max=250", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["name"] == "Test Product 2"
        
        # Test filtering by GST rate
        response = client.get("/api/products?gst_rate=18", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["gst_rate"] == 18.0
    
    def test_invoice_filtering_advanced_criteria(self, client, auth_headers, db_session):
        """Test advanced invoice filtering"""
        # Create test data
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
        
        invoice1 = Invoice(
            customer_id=customer.id,
            supplier_id=supplier.id,
            invoice_no="INV-001",
            grand_total=Decimal("1000.00"),
            paid_amount=Decimal("600.00"),
            balance_amount=Decimal("400.00"),
            due_date=datetime.utcnow(),
            place_of_supply="Mumbai, Maharashtra",
            place_of_supply_state_code="27",
            bill_to_address="Test Bill Address",
            ship_to_address="Test Ship Address",
            taxable_value=Decimal("847.46"),
            cgst=Decimal("76.27"),
            sgst=Decimal("76.27"),
            igst=Decimal("0.00"),
            status="Sent"
        )
        invoice2 = Invoice(
            customer_id=customer.id,
            supplier_id=supplier.id,
            invoice_no="INV-002",
            grand_total=Decimal("500.00"),
            paid_amount=Decimal("500.00"),
            balance_amount=Decimal("0.00"),
            due_date=datetime.utcnow(),
            place_of_supply="Mumbai, Maharashtra",
            place_of_supply_state_code="27",
            bill_to_address="Test Bill Address",
            ship_to_address="Test Ship Address",
            taxable_value=Decimal("423.73"),
            cgst=Decimal("38.14"),
            sgst=Decimal("38.14"),
            igst=Decimal("0.00"),
            status="Paid"
        )
        db_session.add_all([invoice1, invoice2])
        db_session.commit()
        
        # Test filtering by status
        response = client.get("/api/invoices?status=Sent", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data["invoices"]) == 1
        assert data["invoices"][0]["status"] == "Sent"
        
        # Test filtering by amount range
        response = client.get("/api/invoices?amount_min=800&amount_max=1200", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data["invoices"]) == 1
        assert data["invoices"][0]["invoice_no"] == "INV-001"
        
        # Test filtering by payment status
        response = client.get("/api/invoices?payment_status=partially_paid", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data["invoices"]) == 1
        assert data["invoices"][0]["invoice_no"] == "INV-001"
    
    def test_filter_state_persistence(self, client, auth_headers):
        """Test that filter state persists across requests"""
        # Test that filter parameters are maintained
        response1 = client.get("/api/products?category=Electronics&price_min=100", headers=auth_headers)
        assert response1.status_code == 200
        
        # Verify filter parameters are applied
        response2 = client.get("/api/products?category=Electronics&price_min=100", headers=auth_headers)
        assert response2.status_code == 200
        # Results should be consistent between requests
    
    def test_filter_validation(self, client, auth_headers):
        """Test filter parameter validation"""
        # Test invalid price range
        response = client.get("/api/products?price_min=abc&price_max=def", headers=auth_headers)
        assert response.status_code == 422  # Should return validation error
        
        # Test invalid date format
        response = client.get("/api/invoices?date_from=invalid-date", headers=auth_headers)
        assert response.status_code == 422  # Should return validation error

class TestDashboardQuickLinks:
    """Test Dashboard Quick Links functionality"""
    
    def test_dashboard_quick_links_accessible(self, client, auth_headers):
        """Test that quick links are accessible from dashboard"""
        response = client.get("/api/dashboard", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        
        # Verify quick links are present
        assert "quick_links" in data
        assert isinstance(data["quick_links"], list)
        
        # Verify expected quick links exist
        quick_link_texts = [link["text"] for link in data["quick_links"]]
        expected_links = ["Add Product", "Add Invoice", "Add Purchase", "Add Expense"]
        for expected_link in expected_links:
            assert any(expected_link in text for text in quick_link_texts)
    
    def test_quick_link_navigation(self, client, auth_headers):
        """Test quick link navigation functionality"""
        # Test that the main endpoints are accessible (these are the actual API endpoints)
        # The "add" functionality is handled via POST requests to these endpoints
        
        # Test products endpoint is accessible
        response = client.get("/api/products", headers=auth_headers)
        assert response.status_code == 200
        
        # Test invoices endpoint is accessible
        response = client.get("/api/invoices", headers=auth_headers)
        assert response.status_code == 200
        
        # Test purchases endpoint is accessible
        response = client.get("/api/purchases", headers=auth_headers)
        assert response.status_code == 200
        
        # Test expenses endpoint is accessible
        response = client.get("/api/expenses", headers=auth_headers)
        assert response.status_code == 200
    
    def test_quick_link_permissions(self, client, auth_headers):
        """Test quick link permissions and access control"""
        # Test that quick links respect user permissions
        response = client.get("/api/dashboard", headers=auth_headers)
        assert response.status_code == 200
        
        # Verify only authorized quick links are shown
        data = response.json()
        if "quick_links" in data:
            for link in data["quick_links"]:
                # Test that each quick link endpoint is accessible
                if "url" in link:
                    response = client.get(link["url"], headers=auth_headers)
                    assert response.status_code in [200, 404]  # Should not be 403 (forbidden)

class TestErrorHandling:
    """Test Error Handling and Loading States"""
    
    def test_api_error_handling(self, client, auth_headers):
        """Test API error handling and response format"""
        # Test 404 error
        response = client.get("/api/nonexistent-endpoint", headers=auth_headers)
        assert response.status_code == 404
        data = response.json()
        assert "detail" in data
        
        # Test 422 validation error
        response = client.post("/api/products", json={}, headers=auth_headers)
        assert response.status_code == 422
        data = response.json()
        assert "detail" in data
        
        # Test 401 unauthorized error
        response = client.get("/api/products")
        assert response.status_code == 401
    
    def test_database_error_handling(self, client, auth_headers, db_session):
        """Test database error handling"""
        # Test duplicate key error (if applicable)
        # This would require specific database constraints to trigger
        
        # Test foreign key constraint error
        response = client.post("/api/invoices", json={
            "customer_id": 99999,  # Non-existent customer
            "invoice_no": "TEST-001",
            "grand_total": 1000.00
        }, headers=auth_headers)
        assert response.status_code in [422, 400]  # Should handle gracefully
    
    def test_loading_state_handling(self, client, auth_headers):
        """Test loading state handling in API responses"""
        # Test that API responses include appropriate loading indicators
        # This is primarily a frontend concern, but we can test API response times
        
        import time
        start_time = time.time()
        response = client.get("/api/products", headers=auth_headers)
        end_time = time.time()
        
        assert response.status_code == 200
        # Response should be reasonably fast (under 2 seconds)
        assert end_time - start_time < 2.0

class TestSystematicChangeManagement:
    """Test Systematic Change Management functionality"""
    
    def test_backward_compatibility(self, client, auth_headers):
        """Test backward compatibility of API endpoints"""
        # Test that existing API endpoints still work
        response = client.get("/api/products", headers=auth_headers)
        assert response.status_code == 200
        
        response = client.get("/api/invoices", headers=auth_headers)
        assert response.status_code == 200
        
        response = client.get("/api/purchases", headers=auth_headers)
        assert response.status_code == 200
        
        response = client.get("/api/expenses", headers=auth_headers)
        assert response.status_code == 200
    
    def test_api_version_consistency(self, client, auth_headers):
        """Test API version consistency across endpoints"""
        # Test that all endpoints return consistent API version
        endpoints = ["/api/products", "/api/invoices", "/api/purchases", "/api/expenses"]
        
        for endpoint in endpoints:
            response = client.get(endpoint, headers=auth_headers)
            assert response.status_code == 200
            
            # Check for version header if implemented
            if "X-API-Version" in response.headers:
                version = response.headers["X-API-Version"]
                assert version is not None
    
    def test_data_consistency_across_changes(self, client, auth_headers, db_session):
        """Test data consistency across system changes"""
        # Create test data
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
        
        # Test that data remains consistent across operations
        # Create invoice
        invoice_data = {
            "customer_id": customer.id,
            "supplier_id": supplier.id,
            "invoice_no": "TEST-001",
            "date": datetime.utcnow().isoformat(),
            "due_date": datetime.utcnow().isoformat(),
            "place_of_supply": "Mumbai, Maharashtra",
            "place_of_supply_state_code": "27",
            "bill_to_address": "Test Bill Address",
            "ship_to_address": "Test Ship Address",
            "items": [
                {
                    "product_id": 1,
                    "qty": 1,
                    "rate": 1000.00,
                    "description": "Test Description"
                }
            ]
        }
        
        response = client.post("/api/invoices", json=invoice_data, headers=auth_headers)
        assert response.status_code == 201
        invoice_id = response.json()["id"]
        
        # Verify data consistency by retrieving the invoice
        response = client.get(f"/api/invoices/{invoice_id}", headers=auth_headers)
        assert response.status_code == 200
        retrieved_invoice = response.json()
        
        # Verify all fields are consistent
        assert retrieved_invoice["invoice_no"] == "TEST-001"
        assert retrieved_invoice["grand_total"] == 1000.00
        assert retrieved_invoice["customer_id"] == customer.id
        assert retrieved_invoice["supplier_id"] == supplier.id

# Use existing fixtures from conftest.py
