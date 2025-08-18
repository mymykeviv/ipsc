import pytest
from datetime import datetime, timedelta
from app.models import Invoice, InvoiceItem, Party, Product, CompanySettings
from app.auth import get_password_hash


class TestInvoiceCRUD:
    """Test invoice CRUD operations"""
    
    def test_create_invoice_success(self, client, db_session, sample_invoice_data):
        """Test successful invoice creation"""
        # Create required dependencies
        customer = Party(
            name="Test Customer",
            type="customer",
            gstin="22AAAAA0000A1Z5",
            gst_enabled=True
        )
        db_session.add(customer)
        
        company = CompanySettings(
            name="Test Company",
            gstin="22AAAAA0000A1Z5",
            state="Test State",
            state_code="TS"
        )
        db_session.add(company)
        db_session.commit()
        
        # Create invoice
        response = client.post("/api/invoices/", json=sample_invoice_data)
        
        assert response.status_code == 201
        data = response.json()
        assert data["customer_name"] == sample_invoice_data["customer_name"]
        assert data["invoice_number"] is not None
        assert len(data["items"]) == 1
        assert data["items"][0]["description"] == "Test Item 1"
    
    def test_create_invoice_missing_required_fields(self, client):
        """Test invoice creation with missing required fields"""
        response = client.post("/api/invoices/", json={
            "customer_name": "Test Customer"
            # Missing other required fields
        })
        
        assert response.status_code == 422
    
    def test_get_invoice_by_id(self, client, db_session, sample_invoice_data):
        """Test retrieving invoice by ID"""
        # Create invoice first
        response = client.post("/api/invoices/", json=sample_invoice_data)
        invoice_id = response.json()["id"]
        
        # Retrieve invoice
        response = client.get(f"/api/invoices/{invoice_id}")
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == invoice_id
        assert data["customer_name"] == sample_invoice_data["customer_name"]
    
    def test_get_invoice_not_found(self, client):
        """Test retrieving non-existent invoice"""
        response = client.get("/api/invoices/99999")
        
        assert response.status_code == 404
    
    def test_update_invoice(self, client, db_session, sample_invoice_data):
        """Test updating invoice"""
        # Create invoice first
        response = client.post("/api/invoices/", json=sample_invoice_data)
        invoice_id = response.json()["id"]
        
        # Update invoice
        update_data = {
            **sample_invoice_data,
            "customer_name": "Updated Customer",
            "notes": "Updated notes"
        }
        
        response = client.put(f"/api/invoices/{invoice_id}", json=update_data)
        
        assert response.status_code == 200
        data = response.json()
        assert data["customer_name"] == "Updated Customer"
        assert data["notes"] == "Updated notes"
    
    def test_delete_invoice(self, client, db_session, sample_invoice_data):
        """Test deleting invoice"""
        # Create invoice first
        response = client.post("/api/invoices/", json=sample_invoice_data)
        invoice_id = response.json()["id"]
        
        # Delete invoice
        response = client.delete(f"/api/invoices/{invoice_id}")
        
        assert response.status_code == 204
        
        # Verify invoice is deleted
        response = client.get(f"/api/invoices/{invoice_id}")
        assert response.status_code == 404
    
    def test_list_invoices(self, client, db_session, sample_invoice_data):
        """Test listing invoices"""
        # Create multiple invoices
        for i in range(3):
            invoice_data = {**sample_invoice_data}
            invoice_data["customer_name"] = f"Customer {i+1}"
            client.post("/api/invoices/", json=invoice_data)
        
        # List invoices
        response = client.get("/api/invoices/")
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 3


class TestInvoiceCalculations:
    """Test invoice calculations"""
    
    def test_invoice_totals_calculation(self, client, db_session, sample_invoice_data):
        """Test invoice totals calculation"""
        # Create invoice with multiple items
        invoice_data = {
            **sample_invoice_data,
            "items": [
                {
                    "description": "Item 1",
                    "quantity": 2,
                    "unit_price": 100.00,
                    "tax_rate": 10.0
                },
                {
                    "description": "Item 2",
                    "quantity": 1,
                    "unit_price": 50.00,
                    "tax_rate": 5.0
                }
            ]
        }
        
        response = client.post("/api/invoices/", json=invoice_data)
        
        assert response.status_code == 201
        data = response.json()
        
        # Verify calculations
        # Item 1: 2 * 100 = 200, tax = 20, total = 220
        # Item 2: 1 * 50 = 50, tax = 2.5, total = 52.5
        # Total: 220 + 52.5 = 272.5
        assert data["subtotal"] == 250.00
        assert data["total_tax"] == 22.50
        assert data["total_amount"] == 272.50
    
    def test_invoice_with_discount(self, client, db_session, sample_invoice_data):
        """Test invoice with discount"""
        invoice_data = {
            **sample_invoice_data,
            "discount_percentage": 10.0,
            "items": [
                {
                    "description": "Item 1",
                    "quantity": 1,
                    "unit_price": 100.00,
                    "tax_rate": 10.0
                }
            ]
        }
        
        response = client.post("/api/invoices/", json=invoice_data)
        
        assert response.status_code == 201
        data = response.json()
        
        # Verify discount calculation
        # Subtotal: 100, Discount: 10, Tax: 9, Total: 99
        assert data["subtotal"] == 100.00
        assert data["discount_amount"] == 10.00
        assert data["total_tax"] == 9.00
        assert data["total_amount"] == 99.00


class TestInvoiceValidation:
    """Test invoice validation"""
    
    def test_invoice_with_invalid_dates(self, client, sample_invoice_data):
        """Test invoice with invalid dates"""
        invoice_data = {
            **sample_invoice_data,
            "invoice_date": "2024-13-01",  # Invalid month
            "due_date": "2024-01-32"  # Invalid day
        }
        
        response = client.post("/api/invoices/", json=invoice_data)
        
        assert response.status_code == 422
    
    def test_invoice_with_negative_quantities(self, client, sample_invoice_data):
        """Test invoice with negative quantities"""
        invoice_data = {
            **sample_invoice_data,
            "items": [
                {
                    "description": "Item 1",
                    "quantity": -1,  # Negative quantity
                    "unit_price": 100.00,
                    "tax_rate": 10.0
                }
            ]
        }
        
        response = client.post("/api/invoices/", json=invoice_data)
        
        assert response.status_code == 422
    
    def test_invoice_with_empty_items(self, client, sample_invoice_data):
        """Test invoice with empty items list"""
        invoice_data = {
            **sample_invoice_data,
            "items": []
        }
        
        response = client.post("/api/invoices/", json=invoice_data)
        
        assert response.status_code == 422


class TestInvoiceSearch:
    """Test invoice search functionality"""
    
    def test_search_invoices_by_customer(self, client, db_session, sample_invoice_data):
        """Test searching invoices by customer name"""
        # Create invoices with different customer names
        customers = ["John Doe", "Jane Smith", "John Smith"]
        for customer in customers:
            invoice_data = {**sample_invoice_data, "customer_name": customer}
            client.post("/api/invoices/", json=invoice_data)
        
        # Search for "John"
        response = client.get("/api/invoices/?search=John")
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2  # Should find "John Doe" and "John Smith"
    
    def test_filter_invoices_by_date_range(self, client, db_session, sample_invoice_data):
        """Test filtering invoices by date range"""
        # Create invoices with different dates
        dates = ["2024-01-01", "2024-01-15", "2024-02-01"]
        for date in dates:
            invoice_data = {**sample_invoice_data, "invoice_date": date}
            client.post("/api/invoices/", json=invoice_data)
        
        # Filter by date range
        response = client.get("/api/invoices/?start_date=2024-01-01&end_date=2024-01-31")
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2  # Should find invoices from January
