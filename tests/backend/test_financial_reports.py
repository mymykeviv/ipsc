"""
Tests for Financial Reports functionality
"""
import pytest
from datetime import datetime, date, timedelta
from decimal import Decimal
from sqlalchemy.orm import Session

from app.models import (
    Invoice, InvoiceItem, Purchase, PurchaseItem, Payment, PurchasePayment, 
    Expense, Party, Product
)
from app.financial_reports import FinancialReports, ReportType


class TestFinancialReports:
    """Test financial reports functionality"""
    
    def test_profit_loss_statement(self, db: Session):
        """Test profit and loss statement generation"""
        # Create test data
        customer = Party(name="Test Customer", gstin="123456789012345", party_type="Customer")
        vendor = Party(name="Test Vendor", gstin="987654321098765", party_type="Vendor")
        db.add_all([customer, vendor])
        db.flush()
        
        # Create invoice (revenue)
        invoice = Invoice(
            customer_id=customer.id,
            supplier_id=vendor.id,
            invoice_no="INV-001",
            grand_total=Decimal("1000.00"),
            status="Paid",
            due_date=datetime.now()
        )
        db.add(invoice)
        db.flush()
        
        # Create purchase (COGS)
        purchase = Purchase(
            vendor_id=vendor.id,
            purchase_no="PUR-001",
            grand_total=Decimal("600.00"),
            status="Paid",
            due_date=datetime.now()
        )
        db.add(purchase)
        db.flush()
        
        # Create expense
        expense = Expense(
            expense_date=datetime.now(),
            expense_type="Office Rent",
            category="Office",
            description="Monthly office rent",
            amount=Decimal("200.00"),
            payment_method="Bank Transfer",
            account_head="Bank",
            total_amount=Decimal("200.00")
        )
        db.add(expense)
        db.commit()
        
        reports = FinancialReports(db)
        pl_statement = reports.generate_profit_loss_statement()
        
        assert pl_statement["report_type"] == "profit_loss"
        assert pl_statement["revenue"]["total_revenue"] == 1000.0
        assert pl_statement["cost_of_goods_sold"]["total_cogs"] == 600.0
        assert pl_statement["gross_profit"]["amount"] == 400.0
        assert pl_statement["operating_expenses"]["total_expenses"] == 200.0
        assert pl_statement["operating_profit"]["amount"] == 200.0
        assert pl_statement["net_profit_before_tax"] == 200.0
        assert pl_statement["tax"] == 50.0  # 25% of 200
        assert pl_statement["net_profit_after_tax"] == 150.0
    
    def test_balance_sheet(self, db: Session):
        """Test balance sheet generation"""
        # Create test data
        customer = Party(name="Test Customer", gstin="123456789012345", party_type="Customer")
        vendor = Party(name="Test Vendor", gstin="987654321098765", party_type="Vendor")
        db.add_all([customer, vendor])
        db.flush()
        
        # Create product with stock
        product = Product(
            name="Test Product",
            sales_price=Decimal("100.00"),
            purchase_price=Decimal("60.00"),
            stock=10,
            sku="TEST001"
        )
        db.add(product)
        db.flush()
        
        # Create invoice with balance (accounts receivable)
        invoice = Invoice(
            customer_id=customer.id,
            supplier_id=vendor.id,
            invoice_no="INV-001",
            grand_total=Decimal("500.00"),
            balance_amount=Decimal("300.00"),
            status="Partially Paid",
            due_date=datetime.now()
        )
        db.add(invoice)
        db.flush()
        
        # Create purchase with balance (accounts payable)
        purchase = Purchase(
            vendor_id=vendor.id,
            purchase_no="PUR-001",
            grand_total=Decimal("400.00"),
            balance_amount=Decimal("200.00"),
            status="Partially Paid",
            due_date=datetime.now()
        )
        db.add(purchase)
        db.flush()
        
        # Create payment (cash)
        payment = Payment(
            invoice_id=invoice.id,
            payment_amount=Decimal("200.00"),
            payment_method="Cash",
            account_head="Cash"
        )
        db.add(payment)
        db.commit()
        
        reports = FinancialReports(db)
        balance_sheet = reports.generate_balance_sheet()
        
        assert balance_sheet["report_type"] == "balance_sheet"
        assert balance_sheet["assets"]["total_assets"] > 0
        assert balance_sheet["liabilities"]["total_liabilities"] > 0
        assert balance_sheet["equity"]["total_equity"] > 0
        
        # Check that assets = liabilities + equity
        total_assets = balance_sheet["assets"]["total_assets"]
        total_liabilities = balance_sheet["liabilities"]["total_liabilities"]
        total_equity = balance_sheet["equity"]["total_equity"]
        assert abs(total_assets - (total_liabilities + total_equity)) < 0.01
    
    def test_cash_flow_statement(self, db: Session):
        """Test cash flow statement generation"""
        # Create test data
        customer = Party(name="Test Customer", gstin="123456789012345", party_type="Customer")
        vendor = Party(name="Test Vendor", gstin="987654321098765", party_type="Vendor")
        db.add_all([customer, vendor])
        db.flush()
        
        # Create invoice and payment
        invoice = Invoice(
            customer_id=customer.id,
            supplier_id=vendor.id,
            invoice_no="INV-001",
            grand_total=Decimal("1000.00"),
            status="Paid",
            due_date=datetime.now()
        )
        db.add(invoice)
        db.flush()
        
        payment = Payment(
            invoice_id=invoice.id,
            payment_amount=Decimal("1000.00"),
            payment_method="Bank Transfer",
            account_head="Bank"
        )
        db.add(payment)
        
        # Create purchase and payment
        purchase = Purchase(
            vendor_id=vendor.id,
            purchase_no="PUR-001",
            grand_total=Decimal("600.00"),
            status="Paid",
            due_date=datetime.now()
        )
        db.add(purchase)
        db.flush()
        
        purchase_payment = PurchasePayment(
            purchase_id=purchase.id,
            payment_amount=Decimal("600.00"),
            payment_method="Bank Transfer",
            account_head="Bank"
        )
        db.add(purchase_payment)
        
        # Create expense
        expense = Expense(
            expense_date=datetime.now(),
            expense_type="Office Rent",
            category="Office",
            description="Monthly office rent",
            amount=Decimal("200.00"),
            payment_method="Cash",
            account_head="Cash",
            total_amount=Decimal("200.00")
        )
        db.add(expense)
        db.commit()
        
        reports = FinancialReports(db)
        cash_flow = reports.generate_cash_flow_statement()
        
        assert cash_flow["report_type"] == "cash_flow"
        assert cash_flow["operating_activities"]["net_cash_flow"] == 200.0  # 1000 - 600 - 200
        assert cash_flow["investing_activities"]["net_cash_flow"] == 0.0
        assert cash_flow["financing_activities"]["net_cash_flow"] == 0.0
        assert cash_flow["net_cash_flow"] == 200.0
        assert cash_flow["cash_balances"]["opening_balance"] >= 0
        assert cash_flow["cash_balances"]["closing_balance"] >= 0
    
    def test_empty_database(self, db: Session):
        """Test with empty database"""
        reports = FinancialReports(db)
        
        # Test P&L with empty data
        pl_statement = reports.generate_profit_loss_statement()
        assert pl_statement["revenue"]["total_revenue"] == 0.0
        assert pl_statement["cost_of_goods_sold"]["total_cogs"] == 0.0
        assert pl_statement["net_profit_after_tax"] == 0.0
        
        # Test balance sheet with empty data
        balance_sheet = reports.generate_balance_sheet()
        assert balance_sheet["assets"]["total_assets"] == 0.0
        assert balance_sheet["liabilities"]["total_liabilities"] == 0.0
        assert balance_sheet["equity"]["total_equity"] == 0.0
        
        # Test cash flow with empty data
        cash_flow = reports.generate_cash_flow_statement()
        assert cash_flow["operating_activities"]["net_cash_flow"] == 0.0
        assert cash_flow["net_cash_flow"] == 0.0
    
    def test_date_filtering(self, db: Session):
        """Test date filtering in reports"""
        # Create test data with specific dates
        customer = Party(name="Test Customer", gstin="123456789012345", party_type="Customer")
        db.add(customer)
        db.flush()
        
        # Create invoice in current month
        invoice = Invoice(
            customer_id=customer.id,
            supplier_id=customer.id,
            invoice_no="INV-001",
            grand_total=Decimal("1000.00"),
            status="Paid",
            due_date=datetime.now()
        )
        db.add(invoice)
        db.commit()
        
        reports = FinancialReports(db)
        
        # Test with date range
        start_date = date.today().replace(day=1)
        end_date = date.today()
        
        pl_statement = reports.generate_profit_loss_statement(start_date, end_date)
        assert pl_statement["revenue"]["total_revenue"] == 1000.0
        
        # Test with date range that excludes the invoice
        past_start = start_date - timedelta(days=30)
        past_end = start_date - timedelta(days=1)
        
        pl_statement_past = reports.generate_profit_loss_statement(past_start, past_end)
        assert pl_statement_past["revenue"]["total_revenue"] == 0.0


class TestFinancialReportsAPI:
    """Test financial reports API endpoints"""
    
    def test_get_profit_loss_statement_api(self, client, auth_headers):
        """Test profit and loss statement API endpoint"""
        response = client.get("/api/financial-reports/profit-loss", headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert data["report_type"] == "profit_loss"
        assert "revenue" in data
        assert "cost_of_goods_sold" in data
        assert "gross_profit" in data
        assert "operating_expenses" in data
        assert "net_profit_after_tax" in data
    
    def test_get_balance_sheet_api(self, client, auth_headers):
        """Test balance sheet API endpoint"""
        response = client.get("/api/financial-reports/balance-sheet", headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert data["report_type"] == "balance_sheet"
        assert "assets" in data
        assert "liabilities" in data
        assert "equity" in data
        
        # Check that assets = liabilities + equity
        total_assets = data["assets"]["total_assets"]
        total_liabilities = data["liabilities"]["total_liabilities"]
        total_equity = data["equity"]["total_equity"]
        assert abs(total_assets - (total_liabilities + total_equity)) < 0.01
    
    def test_get_cash_flow_statement_api(self, client, auth_headers):
        """Test cash flow statement API endpoint"""
        response = client.get("/api/financial-reports/cash-flow", headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert data["report_type"] == "cash_flow"
        assert "operating_activities" in data
        assert "investing_activities" in data
        assert "financing_activities" in data
        assert "net_cash_flow" in data
        assert "cash_balances" in data
    
    def test_get_financial_summary_api(self, client, auth_headers):
        """Test financial summary API endpoint"""
        response = client.get("/api/financial-reports/summary", headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert "period" in data
        assert "profit_loss" in data
        assert "balance_sheet" in data
        assert "cash_flow" in data
        assert "key_metrics" in data
        
        # Check key metrics
        metrics = data["key_metrics"]
        assert "revenue" in metrics
        assert "net_profit" in metrics
        assert "total_assets" in metrics
        assert "total_liabilities" in metrics
        assert "net_cash_flow" in metrics
        assert "cash_balance" in metrics
    
    def test_date_parameters(self, client, auth_headers):
        """Test date parameters in API endpoints"""
        # Test with date parameters
        response = client.get(
            "/api/financial-reports/profit-loss?start_date=2024-01-01&end_date=2024-12-31",
            headers=auth_headers
        )
        assert response.status_code == 200
        
        # Test with invalid date format
        response = client.get(
            "/api/financial-reports/profit-loss?start_date=invalid-date",
            headers=auth_headers
        )
        assert response.status_code == 422  # Validation error
    
    def test_balance_sheet_date_parameter(self, client, auth_headers):
        """Test balance sheet with date parameter"""
        response = client.get(
            "/api/financial-reports/balance-sheet?as_of_date=2024-12-31",
            headers=auth_headers
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["as_of_date"] == "2024-12-31"
