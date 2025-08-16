import pytest
from datetime import date, datetime
from decimal import Decimal
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from backend.app.main import app
from backend.app.models import Party, Product, Invoice, InvoiceItem, Purchase, PurchaseItem, CompanySettings
from backend.app.gst_reports import GSTReportGenerator, generate_gstr1_report, generate_gstr3b_report

client = TestClient(app)


class TestGSTReports:
    """Test cases for GST Report Generation"""
    
    def test_validate_data_for_gstr1_with_valid_data(self, db: Session):
        """Test GSTR-1 validation with valid data"""
        # Create test data
        customer = Party(
            type="customer",
            name="Test Customer",
            gstin="27AAPFU0939F1Z5",
            gst_enabled=True,
            billing_address_line1="123 Test Street",
            billing_city="Mumbai",
            billing_state="Maharashtra"
        )
        db.add(customer)
        db.flush()
        
        product = Product(
            name="Test Product",
            sales_price=100.00,
            hsn="12345678",
            gst_rate=18.0
        )
        db.add(product)
        db.flush()
        
        invoice = Invoice(
            customer_id=customer.id,
            supplier_id=customer.id,  # Using same party as supplier for test
            invoice_no="INV-001",
            date=date(2024, 1, 15),
            due_date=date(2024, 1, 15),
            place_of_supply="Maharashtra",
            place_of_supply_state_code="27",
            bill_to_address="123 Test Street",
            ship_to_address="123 Test Street",
            taxable_value=100.00,
            cgst=9.00,
            sgst=9.00,
            igst=0.00,
            grand_total=118.00
        )
        db.add(invoice)
        db.flush()
        
        invoice_item = InvoiceItem(
            invoice_id=invoice.id,
            product_id=product.id,
            description="Test Product",
            hsn_code="12345678",
            qty=1,
            rate=100.00,
            taxable_value=100.00,
            gst_rate=18.0,
            cgst=9.00,
            sgst=9.00,
            igst=0.00,
            amount=118.00
        )
        db.add(invoice_item)
        db.commit()
        
        # Test validation
        generator = GSTReportGenerator(db)
        errors = generator.validate_data_for_gstr1(date(2024, 1, 1), date(2024, 1, 31))
        
        assert len(errors) == 0
    
    def test_validate_data_for_gstr1_with_missing_hsn(self, db: Session):
        """Test GSTR-1 validation with missing HSN codes"""
        # Create test data without HSN
        customer = Party(
            type="customer",
            name="Test Customer",
            gstin="27AAPFU0939F1Z5",
            gst_enabled=True,
            billing_address_line1="123 Test Street",
            billing_city="Mumbai",
            billing_state="Maharashtra"
        )
        db.add(customer)
        db.flush()
        
        product = Product(
            name="Test Product",
            sales_price=100.00,
            gst_rate=18.0
        )
        db.add(product)
        db.flush()
        
        invoice = Invoice(
            customer_id=customer.id,
            supplier_id=customer.id,
            invoice_no="INV-001",
            date=date(2024, 1, 15),
            due_date=date(2024, 1, 15),
            place_of_supply="Maharashtra",
            place_of_supply_state_code="27",
            bill_to_address="123 Test Street",
            ship_to_address="123 Test Street",
            taxable_value=100.00,
            cgst=9.00,
            sgst=9.00,
            igst=0.00,
            grand_total=118.00
        )
        db.add(invoice)
        db.flush()
        
        invoice_item = InvoiceItem(
            invoice_id=invoice.id,
            product_id=product.id,
            description="Test Product",
            qty=1,
            rate=100.00,
            taxable_value=100.00,
            gst_rate=18.0,
            cgst=9.00,
            sgst=9.00,
            igst=0.00,
            amount=118.00
        )
        db.add(invoice_item)
        db.commit()
        
        # Test validation
        generator = GSTReportGenerator(db)
        errors = generator.validate_data_for_gstr1(date(2024, 1, 1), date(2024, 1, 31))
        
        assert len(errors) > 0
        assert "invoices without HSN codes" in errors[0]
    
    def test_generate_gstr1_data(self, db: Session):
        """Test GSTR-1 data generation"""
        # Create test data
        customer = Party(
            type="customer",
            name="Test Customer",
            gstin="27AAPFU0939F1Z5",
            gst_enabled=True,
            billing_address_line1="123 Test Street",
            billing_city="Mumbai",
            billing_state="Maharashtra"
        )
        db.add(customer)
        db.flush()
        
        product = Product(
            name="Test Product",
            sales_price=100.00,
            hsn="12345678",
            gst_rate=18.0
        )
        db.add(product)
        db.flush()
        
        invoice = Invoice(
            customer_id=customer.id,
            supplier_id=customer.id,
            invoice_no="INV-001",
            date=date(2024, 1, 15),
            due_date=date(2024, 1, 15),
            place_of_supply="Maharashtra",
            place_of_supply_state_code="27",
            bill_to_address="123 Test Street",
            ship_to_address="123 Test Street",
            taxable_value=100.00,
            cgst=9.00,
            sgst=9.00,
            igst=0.00,
            grand_total=118.00
        )
        db.add(invoice)
        db.flush()
        
        invoice_item = InvoiceItem(
            invoice_id=invoice.id,
            product_id=product.id,
            description="Test Product",
            hsn_code="12345678",
            qty=1,
            rate=100.00,
            taxable_value=100.00,
            gst_rate=18.0,
            cgst=9.00,
            sgst=9.00,
            igst=0.00,
            amount=118.00
        )
        db.add(invoice_item)
        db.commit()
        
        # Generate GSTR-1 data
        generator = GSTReportGenerator(db)
        data = generator.generate_gstr1_data(date(2024, 1, 1), date(2024, 1, 31))
        
        assert len(data) == 1
        row = data[0]
        assert row["GSTIN/UIN of Recipient"] == "27AAPFU0939F1Z5"
        assert row["Receiver Name"] == "Test Customer"
        assert row["Invoice Number"] == "INV-001"
        assert row["HSN/SAC"] == "12345678"
        assert row["Taxable Value"] == 100.0
    
    def test_generate_gstr3b_data(self, db: Session):
        """Test GSTR-3B data generation"""
        # Create test data
        customer = Party(
            type="customer",
            name="Test Customer",
            gstin="27AAPFU0939F1Z5",
            gst_enabled=True,
            billing_address_line1="123 Test Street",
            billing_city="Mumbai",
            billing_state="Maharashtra"
        )
        db.add(customer)
        db.flush()
        
        product = Product(
            name="Test Product",
            sales_price=100.00,
            hsn="12345678",
            gst_rate=18.0
        )
        db.add(product)
        db.flush()
        
        invoice = Invoice(
            customer_id=customer.id,
            supplier_id=customer.id,
            invoice_no="INV-001",
            date=date(2024, 1, 15),
            due_date=date(2024, 1, 15),
            place_of_supply="Maharashtra",
            place_of_supply_state_code="27",
            bill_to_address="123 Test Street",
            ship_to_address="123 Test Street",
            taxable_value=100.00,
            cgst=9.00,
            sgst=9.00,
            igst=0.00,
            grand_total=118.00
        )
        db.add(invoice)
        db.commit()
        
        # Generate GSTR-3B data
        generator = GSTReportGenerator(db)
        data = generator.generate_gstr3b_data(date(2024, 1, 1), date(2024, 1, 31))
        
        assert data["summary"]["total_taxable_value"] == 100.0
        assert data["summary"]["total_cgst"] == 9.0
        assert data["summary"]["total_sgst"] == 9.0
        assert data["summary"]["total_igst"] == 0.0
        assert data["details"]["invoices"] == 1
    
    def test_export_gstr1_csv(self, db: Session):
        """Test GSTR-1 CSV export"""
        # Create test data
        customer = Party(
            type="customer",
            name="Test Customer",
            gstin="27AAPFU0939F1Z5",
            gst_enabled=True,
            billing_address_line1="123 Test Street",
            billing_city="Mumbai",
            billing_state="Maharashtra"
        )
        db.add(customer)
        db.flush()
        
        product = Product(
            name="Test Product",
            sales_price=100.00,
            hsn="12345678",
            gst_rate=18.0
        )
        db.add(product)
        db.flush()
        
        invoice = Invoice(
            customer_id=customer.id,
            supplier_id=customer.id,
            invoice_no="INV-001",
            date=date(2024, 1, 15),
            due_date=date(2024, 1, 15),
            place_of_supply="Maharashtra",
            place_of_supply_state_code="27",
            bill_to_address="123 Test Street",
            ship_to_address="123 Test Street",
            taxable_value=100.00,
            cgst=9.00,
            sgst=9.00,
            igst=0.00,
            grand_total=118.00
        )
        db.add(invoice)
        db.flush()
        
        invoice_item = InvoiceItem(
            invoice_id=invoice.id,
            product_id=product.id,
            description="Test Product",
            hsn_code="12345678",
            qty=1,
            rate=100.00,
            taxable_value=100.00,
            gst_rate=18.0,
            cgst=9.00,
            sgst=9.00,
            igst=0.00,
            amount=118.00
        )
        db.add(invoice_item)
        db.commit()
        
        # Export CSV
        generator = GSTReportGenerator(db)
        csv_content = generator.export_gstr1_csv(date(2024, 1, 1), date(2024, 1, 31))
        
        assert csv_content is not None
        assert len(csv_content) > 0
        assert "GSTIN/UIN of Recipient" in csv_content
        assert "27AAPFU0939F1Z5" in csv_content


class TestGSTReportAPI:
    """Test cases for GST Report API endpoints"""
    
    def test_generate_gstr1_report_api_success(self, db: Session, admin_token: str):
        """Test successful GSTR-1 report generation via API"""
        # Create test data
        customer = Party(
            type="customer",
            name="Test Customer",
            gstin="27AAPFU0939F1Z5",
            gst_enabled=True,
            billing_address_line1="123 Test Street",
            billing_city="Mumbai",
            billing_state="Maharashtra"
        )
        db.add(customer)
        db.flush()
        
        product = Product(
            name="Test Product",
            sales_price=100.00,
            hsn="12345678",
            gst_rate=18.0
        )
        db.add(product)
        db.flush()
        
        invoice = Invoice(
            customer_id=customer.id,
            supplier_id=customer.id,
            invoice_no="INV-001",
            date=date(2024, 1, 15),
            due_date=date(2024, 1, 15),
            place_of_supply="Maharashtra",
            place_of_supply_state_code="27",
            bill_to_address="123 Test Street",
            ship_to_address="123 Test Street",
            taxable_value=100.00,
            cgst=9.00,
            sgst=9.00,
            igst=0.00,
            grand_total=118.00
        )
        db.add(invoice)
        db.flush()
        
        invoice_item = InvoiceItem(
            invoice_id=invoice.id,
            product_id=product.id,
            description="Test Product",
            hsn_code="12345678",
            qty=1,
            rate=100.00,
            taxable_value=100.00,
            gst_rate=18.0,
            cgst=9.00,
            sgst=9.00,
            igst=0.00,
            amount=118.00
        )
        db.add(invoice_item)
        db.commit()
        
        # Test API
        response = client.get(
            "/api/reports/gstr1",
            params={
                "start_date": "2024-01-01",
                "end_date": "2024-01-31",
                "format": "json"
            },
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert data["total_records"] == 1
        assert data["period"] == "2024-01-01 to 2024-01-31"
    
    def test_generate_gstr1_report_api_csv(self, db: Session, admin_token: str):
        """Test GSTR-1 report generation in CSV format via API"""
        # Create test data (same as above)
        customer = Party(
            type="customer",
            name="Test Customer",
            gstin="27AAPFU0939F1Z5",
            gst_enabled=True,
            billing_address_line1="123 Test Street",
            billing_city="Mumbai",
            billing_state="Maharashtra"
        )
        db.add(customer)
        db.flush()
        
        product = Product(
            name="Test Product",
            sales_price=100.00,
            hsn="12345678",
            gst_rate=18.0
        )
        db.add(product)
        db.flush()
        
        invoice = Invoice(
            customer_id=customer.id,
            supplier_id=customer.id,
            invoice_no="INV-001",
            date=date(2024, 1, 15),
            due_date=date(2024, 1, 15),
            place_of_supply="Maharashtra",
            place_of_supply_state_code="27",
            bill_to_address="123 Test Street",
            ship_to_address="123 Test Street",
            taxable_value=100.00,
            cgst=9.00,
            sgst=9.00,
            igst=0.00,
            grand_total=118.00
        )
        db.add(invoice)
        db.flush()
        
        invoice_item = InvoiceItem(
            invoice_id=invoice.id,
            product_id=product.id,
            description="Test Product",
            hsn_code="12345678",
            qty=1,
            rate=100.00,
            taxable_value=100.00,
            gst_rate=18.0,
            cgst=9.00,
            sgst=9.00,
            igst=0.00,
            amount=118.00
        )
        db.add(invoice_item)
        db.commit()
        
        # Test API with CSV format
        response = client.get(
            "/api/reports/gstr1",
            params={
                "start_date": "2024-01-01",
                "end_date": "2024-01-31",
                "format": "csv"
            },
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 200
        assert response.headers["content-type"] == "text/csv"
        assert "attachment" in response.headers["content-disposition"]
        assert "gstr1_2024-01-01_to_2024-01-31.csv" in response.headers["content-disposition"]
    
    def test_generate_gstr3b_report_api_success(self, db: Session, admin_token: str):
        """Test successful GSTR-3B report generation via API"""
        # Create test data
        customer = Party(
            type="customer",
            name="Test Customer",
            gstin="27AAPFU0939F1Z5",
            gst_enabled=True,
            billing_address_line1="123 Test Street",
            billing_city="Mumbai",
            billing_state="Maharashtra"
        )
        db.add(customer)
        db.flush()
        
        invoice = Invoice(
            customer_id=customer.id,
            supplier_id=customer.id,
            invoice_no="INV-001",
            date=date(2024, 1, 15),
            due_date=date(2024, 1, 15),
            place_of_supply="Maharashtra",
            place_of_supply_state_code="27",
            bill_to_address="123 Test Street",
            ship_to_address="123 Test Street",
            taxable_value=100.00,
            cgst=9.00,
            sgst=9.00,
            igst=0.00,
            grand_total=118.00
        )
        db.add(invoice)
        db.commit()
        
        # Test API
        response = client.get(
            "/api/reports/gstr3b",
            params={
                "start_date": "2024-01-01",
                "end_date": "2024-01-31",
                "format": "json"
            },
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert data["period"] == "2024-01-01 to 2024-01-31"
        assert "summary" in data["data"]
        assert "details" in data["data"]
    
    def test_validate_gst_data_api(self, db: Session, admin_token: str):
        """Test GST data validation via API"""
        # Create test data with missing HSN
        customer = Party(
            type="customer",
            name="Test Customer",
            gstin="27AAPFU0939F1Z5",
            gst_enabled=True,
            billing_address_line1="123 Test Street",
            billing_city="Mumbai",
            billing_state="Maharashtra"
        )
        db.add(customer)
        db.flush()
        
        product = Product(
            name="Test Product",
            sales_price=100.00,
            gst_rate=18.0
        )
        db.add(product)
        db.flush()
        
        invoice = Invoice(
            customer_id=customer.id,
            supplier_id=customer.id,
            invoice_no="INV-001",
            date=date(2024, 1, 15),
            due_date=date(2024, 1, 15),
            place_of_supply="Maharashtra",
            place_of_supply_state_code="27",
            bill_to_address="123 Test Street",
            ship_to_address="123 Test Street",
            taxable_value=100.00,
            cgst=9.00,
            sgst=9.00,
            igst=0.00,
            grand_total=118.00
        )
        db.add(invoice)
        db.flush()
        
        invoice_item = InvoiceItem(
            invoice_id=invoice.id,
            product_id=product.id,
            description="Test Product",
            qty=1,
            rate=100.00,
            taxable_value=100.00,
            gst_rate=18.0,
            cgst=9.00,
            sgst=9.00,
            igst=0.00,
            amount=118.00
        )
        db.add(invoice_item)
        db.commit()
        
        # Test validation API
        response = client.get(
            "/api/reports/gst-validation",
            params={
                "start_date": "2024-01-01",
                "end_date": "2024-01-31"
            },
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert data["gstr1_valid"] == False
        assert len(data["gstr1_errors"]) > 0
        assert "invoices without HSN codes" in data["gstr1_errors"][0]
