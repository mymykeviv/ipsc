import pytest
from decimal import Decimal
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from backend.app.main import app
from backend.app.models import Party, CompanySettings, Product, Invoice, InvoiceItem
from backend.app.gst import validate_gstin, split_gst, calculate_invoice_totals

client = TestClient(app)


class TestGSTToggleSystem:
    """Test cases for GST Toggle System"""
    
    def test_validate_gstin_valid_format(self):
        """Test GSTIN validation with valid format"""
        valid_gstin = "27AAPFU0939F1Z5"
        assert validate_gstin(valid_gstin) == True
    
    def test_validate_gstin_invalid_format(self):
        """Test GSTIN validation with invalid format"""
        invalid_gstins = [
            "27AAPFU0939F1Z",  # Too short
            "27AAPFU0939F1Z55",  # Too long
            "27AAPFU0939F1Z4",  # Invalid checksum
            "2AAAPFU0939F1Z5",  # Invalid state code
            "",  # Empty
            None  # None
        ]
        for gstin in invalid_gstins:
            assert validate_gstin(gstin) == False
    
    def test_split_gst_with_gst_enabled(self):
        """Test GST calculation when GST is enabled"""
        taxable = Decimal('1000.00')
        rate = 18.0
        intra_state = True
        gst_enabled = True
        
        cgst, sgst, igst = split_gst(taxable, rate, intra_state, gst_enabled)
        
        assert cgst == Decimal('90.00')  # 9% CGST
        assert sgst == Decimal('90.00')  # 9% SGST
        assert igst == Decimal('0.00')   # 0% IGST
    
    def test_split_gst_with_gst_disabled(self):
        """Test GST calculation when GST is disabled"""
        taxable = Decimal('1000.00')
        rate = 18.0
        intra_state = True
        gst_enabled = False
        
        cgst, sgst, igst = split_gst(taxable, rate, intra_state, gst_enabled)
        
        assert cgst == Decimal('0.00')
        assert sgst == Decimal('0.00')
        assert igst == Decimal('0.00')
    
    def test_calculate_invoice_totals_with_gst_enabled(self):
        """Test invoice total calculation with GST enabled"""
        items = [
            {
                'rate': Decimal('100.00'),
                'qty': Decimal('2'),
                'discount': Decimal('10'),
                'discount_type': 'Percentage',
                'gst_rate': Decimal('18.0')
            }
        ]
        
        totals = calculate_invoice_totals(items, gst_enabled=True, intra_state=True)
        
        assert totals['subtotal'] == Decimal('200.00')
        assert totals['total_discount'] == Decimal('20.00')
        assert totals['cgst'] == Decimal('16.20')  # 9% of 180
        assert totals['sgst'] == Decimal('16.20')  # 9% of 180
        assert totals['igst'] == Decimal('0.00')
        assert totals['grand_total'] == Decimal('212.40')
    
    def test_calculate_invoice_totals_with_gst_disabled(self):
        """Test invoice total calculation with GST disabled"""
        items = [
            {
                'rate': Decimal('100.00'),
                'qty': Decimal('2'),
                'discount': Decimal('10'),
                'discount_type': 'Percentage',
                'gst_rate': Decimal('18.0')
            }
        ]
        
        totals = calculate_invoice_totals(items, gst_enabled=False, intra_state=True)
        
        assert totals['subtotal'] == Decimal('200.00')
        assert totals['total_discount'] == Decimal('20.00')
        assert totals['cgst'] == Decimal('0.00')
        assert totals['sgst'] == Decimal('0.00')
        assert totals['igst'] == Decimal('0.00')
        assert totals['grand_total'] == Decimal('180.00')


class TestGSTToggleAPI:
    """Test cases for GST Toggle API endpoints"""
    
    def test_create_party_with_gst_enabled_valid_gstin(self, db: Session, admin_token: str):
        """Test creating party with GST enabled and valid GSTIN"""
        party_data = {
            "type": "customer",
            "name": "Test Customer GST",
            "gstin": "27AAPFU0939F1Z5",
            "gst_enabled": True,
            "gst_registration_status": "GST registered",
            "billing_address_line1": "123 Test Street",
            "billing_city": "Mumbai",
            "billing_state": "Maharashtra"
        }
        
        response = client.post(
            "/api/parties",
            json=party_data,
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["gst_enabled"] == True
        assert data["gstin"] == "27AAPFU0939F1Z5"
    
    def test_create_party_with_gst_enabled_invalid_gstin(self, db: Session, admin_token: str):
        """Test creating party with GST enabled but invalid GSTIN"""
        party_data = {
            "type": "customer",
            "name": "Test Customer Invalid GST",
            "gstin": "INVALID123",
            "gst_enabled": True,
            "gst_registration_status": "GST registered",
            "billing_address_line1": "123 Test Street",
            "billing_city": "Mumbai",
            "billing_state": "Maharashtra"
        }
        
        response = client.post(
            "/api/parties",
            json=party_data,
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 400
        assert "Invalid GSTIN format" in response.json()["detail"]
    
    def test_create_party_with_gst_disabled(self, db: Session, admin_token: str):
        """Test creating party with GST disabled"""
        party_data = {
            "type": "customer",
            "name": "Test Customer No GST",
            "gstin": None,
            "gst_enabled": False,
            "gst_registration_status": "GST not registered",
            "billing_address_line1": "123 Test Street",
            "billing_city": "Mumbai",
            "billing_state": "Maharashtra"
        }
        
        response = client.post(
            "/api/parties",
            json=party_data,
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["gst_enabled"] == False
        assert data["gstin"] is None
    
    def test_update_party_gst_setting(self, db: Session, admin_token: str):
        """Test updating party GST setting"""
        # First create a party with GST enabled
        party_data = {
            "type": "customer",
            "name": "Test Customer Update",
            "gstin": "27AAPFU0939F1Z5",
            "gst_enabled": True,
            "gst_registration_status": "GST registered",
            "billing_address_line1": "123 Test Street",
            "billing_city": "Mumbai",
            "billing_state": "Maharashtra"
        }
        
        create_response = client.post(
            "/api/parties",
            json=party_data,
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert create_response.status_code == 201
        party_id = create_response.json()["id"]
        
        # Update to disable GST
        update_data = {
            "gst_enabled": False,
            "gstin": None
        }
        
        update_response = client.put(
            f"/api/parties/{party_id}",
            json=update_data,
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert update_response.status_code == 200
        data = update_response.json()
        assert data["gst_enabled"] == False
        assert data["gstin"] is None


class TestGSTToggleInvoice:
    """Test cases for GST Toggle in Invoice creation"""
    
    def test_create_invoice_with_gst_enabled_customer(self, db: Session, admin_token: str):
        """Test creating invoice for customer with GST enabled"""
        # Create customer with GST enabled
        customer_data = {
            "type": "customer",
            "name": "GST Customer",
            "gstin": "27AAPFU0939F1Z5",
            "gst_enabled": True,
            "billing_address_line1": "123 Test Street",
            "billing_city": "Mumbai",
            "billing_state": "Maharashtra"
        }
        
        customer_response = client.post(
            "/api/parties",
            json=customer_data,
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        customer_id = customer_response.json()["id"]
        
        # Create supplier
        supplier_data = {
            "type": "vendor",
            "name": "Test Supplier",
            "gstin": "27AAPFU0939F1Z6",
            "gst_enabled": True,
            "billing_address_line1": "456 Supplier Street",
            "billing_city": "Mumbai",
            "billing_state": "Maharashtra"
        }
        
        supplier_response = client.post(
            "/api/parties",
            json=supplier_data,
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        supplier_id = supplier_response.json()["id"]
        
        # Create product
        product_data = {
            "name": "Test Product",
            "sales_price": 100.00,
            "gst_rate": 18.0,
            "hsn": "12345678"
        }
        
        product_response = client.post(
            "/api/products",
            json=product_data,
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        product_id = product_response.json()["id"]
        
        # Create invoice
        invoice_data = {
            "customer_id": customer_id,
            "supplier_id": supplier_id,
            "date": "2024-01-15T00:00:00Z",
            "terms": "Due on Receipt",
            "place_of_supply": "Maharashtra",
            "place_of_supply_state_code": "27",
            "bill_to_address": "123 Test Street, Mumbai",
            "ship_to_address": "123 Test Street, Mumbai",
            "items": [
                {
                    "product_id": product_id,
                    "qty": 2,
                    "rate": 100.00,
                    "discount": 0,
                    "discount_type": "Percentage"
                }
            ]
        }
        
        invoice_response = client.post(
            "/api/invoices",
            json=invoice_data,
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert invoice_response.status_code == 201
        data = invoice_response.json()
        
        # Verify GST is calculated
        assert data["cgst"] > 0
        assert data["sgst"] > 0
        assert data["igst"] == 0  # Same state transaction
    
    def test_create_invoice_with_gst_disabled_customer(self, db: Session, admin_token: str):
        """Test creating invoice for customer with GST disabled"""
        # Create customer with GST disabled
        customer_data = {
            "type": "customer",
            "name": "No GST Customer",
            "gstin": None,
            "gst_enabled": False,
            "billing_address_line1": "123 Test Street",
            "billing_city": "Mumbai",
            "billing_state": "Maharashtra"
        }
        
        customer_response = client.post(
            "/api/parties",
            json=customer_data,
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        customer_id = customer_response.json()["id"]
        
        # Create supplier
        supplier_data = {
            "type": "vendor",
            "name": "Test Supplier",
            "gstin": "27AAPFU0939F1Z6",
            "gst_enabled": True,
            "billing_address_line1": "456 Supplier Street",
            "billing_city": "Mumbai",
            "billing_state": "Maharashtra"
        }
        
        supplier_response = client.post(
            "/api/parties",
            json=supplier_data,
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        supplier_id = supplier_response.json()["id"]
        
        # Create product
        product_data = {
            "name": "Test Product",
            "sales_price": 100.00,
            "gst_rate": 18.0,
            "hsn": "12345678"
        }
        
        product_response = client.post(
            "/api/products",
            json=product_data,
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        product_id = product_response.json()["id"]
        
        # Create invoice
        invoice_data = {
            "customer_id": customer_id,
            "supplier_id": supplier_id,
            "date": "2024-01-15T00:00:00Z",
            "terms": "Due on Receipt",
            "place_of_supply": "Maharashtra",
            "place_of_supply_state_code": "27",
            "bill_to_address": "123 Test Street, Mumbai",
            "ship_to_address": "123 Test Street, Mumbai",
            "items": [
                {
                    "product_id": product_id,
                    "qty": 2,
                    "rate": 100.00,
                    "discount": 0,
                    "discount_type": "Percentage"
                }
            ]
        }
        
        invoice_response = client.post(
            "/api/invoices",
            json=invoice_data,
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert invoice_response.status_code == 201
        data = invoice_response.json()
        
        # Verify GST is NOT calculated
        assert data["cgst"] == 0
        assert data["sgst"] == 0
        assert data["igst"] == 0
        assert data["grand_total"] == 200.00  # Only base amount
