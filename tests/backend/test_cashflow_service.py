"""
Tests for CashflowService - Testing consolidated cashflow data from source tables
"""
import pytest
from datetime import datetime, date
from decimal import Decimal
from sqlalchemy.orm import Session
from backend.app.profitpath_service import ProfitPathService
from backend.app.models import Payment, PurchasePayment, Expense, Invoice, Purchase, Party, Product


class TestCashflowService:
    """Test cases for CashflowService"""
    
    def test_get_cashflow_summary_empty_database(self, db_session: Session):
        """Test cashflow summary with empty database"""
        service = ProfitPathService(db_session)
        summary = service.get_cashflow_summary()
        
        assert summary["total_income"] == 0.0
        assert summary["total_outflow"] == 0.0
        assert summary["net_cashflow"] == 0.0
        assert summary["income_count"] == 0
        assert summary["purchase_payment_count"] == 0
        assert summary["expense_count"] == 0
        assert summary["total_transactions"] == 0
    
    def test_get_cashflow_summary_with_data(self, db_session: Session):
        """Test cashflow summary with sample data"""
        # Create test data
        customer = Party(name="Test Customer", gstin="123456789012345", party_type="Customer")
        vendor = Party(name="Test Vendor", gstin="987654321098765", party_type="Vendor")
        db_session.add_all([customer, vendor])
        db_session.flush()
        
        # Create invoice and payment
        invoice = Invoice(
            customer_id=customer.id,
            invoice_no="INV-001",
            grand_total=Decimal("1000.00"),
            paid_amount=Decimal("600.00"),
            balance_amount=Decimal("400.00")
        )
        db_session.add(invoice)
        db_session.flush()
        
        payment = Payment(
            invoice_id=invoice.id,
            payment_amount=Decimal("600.00"),
            payment_method="Bank Transfer",
            account_head="Bank"
        )
        db_session.add(payment)
        
        # Create purchase and payment
        purchase = Purchase(
            vendor_id=vendor.id,
            purchase_no="PUR-001",
            grand_total=Decimal("500.00"),
            paid_amount=Decimal("300.00"),
            balance_amount=Decimal("200.00")
        )
        db_session.add(purchase)
        db_session.flush()
        
        purchase_payment = PurchasePayment(
            purchase_id=purchase.id,
            payment_amount=Decimal("300.00"),
            payment_method="Cash",
            account_head="Cash"
        )
        db_session.add(purchase_payment)
        
        # Create expense
        expense = Expense(
            expense_type="Office Supplies",
            category="Indirect",
            description="Stationery",
            total_amount=Decimal("100.00"),
            payment_method="Cash",
            account_head="Cash"
        )
        db_session.add(expense)
        
        db_session.commit()
        
        # Test summary
        service = ProfitPathService(db_session)
        summary = service.get_cashflow_summary()
        
        assert summary["total_income"] == 600.0
        assert summary["total_outflow"] == 400.0  # 300 + 100
        assert summary["net_cashflow"] == 200.0
        assert summary["income_count"] == 1
        assert summary["purchase_payment_count"] == 1
        assert summary["expense_count"] == 1
        assert summary["total_transactions"] == 3
    
    def test_get_cashflow_transactions_empty(self, db_session: Session):
        """Test cashflow transactions with empty database"""
        service = ProfitPathService(db_session)
        result = service.get_cashflow_transactions()
        
        assert result["transactions"] == []
        assert result["total_count"] == 0
        assert result["page"] == 1
        assert result["limit"] == 25
        assert result["total_pages"] == 0
    
    def test_get_cashflow_transactions_with_data(self, db_session: Session):
        """Test cashflow transactions with sample data"""
        # Create test data
        customer = Party(name="Test Customer", gstin="123456789012345", party_type="Customer")
        vendor = Party(name="Test Vendor", gstin="987654321098765", party_type="Vendor")
        db_session.add_all([customer, vendor])
        db_session.flush()
        
        # Create invoice and payment
        invoice = Invoice(
            customer_id=customer.id,
            invoice_no="INV-001",
            grand_total=Decimal("1000.00")
        )
        db_session.add(invoice)
        db_session.flush()
        
        payment = Payment(
            invoice_id=invoice.id,
            payment_amount=Decimal("600.00"),
            payment_method="Bank Transfer",
            account_head="Bank",
            reference_number="REF001"
        )
        db_session.add(payment)
        
        # Create purchase and payment
        purchase = Purchase(
            vendor_id=vendor.id,
            purchase_no="PUR-001",
            grand_total=Decimal("500.00")
        )
        db_session.add(purchase)
        db_session.flush()
        
        purchase_payment = PurchasePayment(
            purchase_id=purchase.id,
            payment_amount=Decimal("300.00"),
            payment_method="Cash",
            account_head="Cash",
            reference_number="REF002"
        )
        db_session.add(purchase_payment)
        
        db_session.commit()
        
        # Test transactions
        service = ProfitPathService(db_session)
        result = service.get_cashflow_transactions()
        
        assert result["total_count"] == 2
        assert len(result["transactions"]) == 2
        
        # Check inflow transaction (invoice payment)
        inflow_txn = next(t for t in result["transactions"] if t["type"] == "inflow")
        assert inflow_txn["type"] == "inflow"
        assert inflow_txn["amount"] == 600.0
        assert inflow_txn["source_type"] == "invoice_payment"
        assert inflow_txn["reference_document"] == "INV-001"
        assert inflow_txn["party_name"] == "Test Customer"
        
        # Check outflow transaction (purchase payment)
        outflow_txn = next(t for t in result["transactions"] if t["type"] == "outflow")
        assert outflow_txn["type"] == "outflow"
        assert outflow_txn["amount"] == 300.0
        assert outflow_txn["source_type"] == "purchase_payment"
        assert outflow_txn["reference_document"] == "PUR-001"
        assert outflow_txn["party_name"] == "Test Vendor"
    
    def test_get_cashflow_transactions_with_filters(self, db_session: Session):
        """Test cashflow transactions with filters"""
        # Create test data
        customer = Party(name="Test Customer", gstin="123456789012345", party_type="Customer")
        vendor = Party(name="Test Vendor", gstin="987654321098765", party_type="Vendor")
        db_session.add_all([customer, vendor])
        db_session.flush()
        
        # Create invoice and payment
        invoice = Invoice(
            customer_id=customer.id,
            invoice_no="INV-001",
            grand_total=Decimal("1000.00")
        )
        db_session.add(invoice)
        db_session.flush()
        
        payment = Payment(
            invoice_id=invoice.id,
            payment_amount=Decimal("600.00"),
            payment_method="Bank Transfer",
            account_head="Bank"
        )
        db_session.add(payment)
        
        # Create purchase and payment
        purchase = Purchase(
            vendor_id=vendor.id,
            purchase_no="PUR-001",
            grand_total=Decimal("500.00")
        )
        db_session.add(purchase)
        db_session.flush()
        
        purchase_payment = PurchasePayment(
            purchase_id=purchase.id,
            payment_amount=Decimal("300.00"),
            payment_method="Cash",
            account_head="Cash"
        )
        db_session.add(purchase_payment)
        
        db_session.commit()
        
        # Test type filter
        service = ProfitPathService(db_session)
        
        # Test inflow filter
        inflow_result = service.get_cashflow_transactions(type_filter="inflow")
        assert inflow_result["total_count"] == 1
        assert all(t["type"] == "inflow" for t in inflow_result["transactions"])
        
        # Test outflow filter
        outflow_result = service.get_cashflow_transactions(type_filter="outflow")
        assert outflow_result["total_count"] == 1
        assert all(t["type"] == "outflow" for t in outflow_result["transactions"])
        
        # Test search filter
        search_result = service.get_cashflow_transactions(search="Customer")
        assert search_result["total_count"] == 1
        assert "Customer" in search_result["transactions"][0]["party_name"]
    
    def test_get_pending_payments_empty(self, db_session: Session):
        """Test pending payments with empty database"""
        service = ProfitPathService(db_session)
        result = service.get_pending_payments()
        
        assert result["pending_invoices"] == []
        assert result["pending_purchases"] == []
        assert result["total_pending_invoices"] == 0.0
        assert result["total_pending_purchases"] == 0.0
        assert result["total_pending"] == 0.0
    
    def test_get_pending_payments_with_data(self, db_session: Session):
        """Test pending payments with sample data"""
        # Create test data
        customer = Party(name="Test Customer", gstin="123456789012345", party_type="Customer")
        vendor = Party(name="Test Vendor", gstin="987654321098765", party_type="Vendor")
        db_session.add_all([customer, vendor])
        db_session.flush()
        
        # Create pending invoice
        pending_invoice = Invoice(
            customer_id=customer.id,
            invoice_no="INV-001",
            grand_total=Decimal("1000.00"),
            paid_amount=Decimal("400.00"),
            balance_amount=Decimal("600.00"),
            status="Partially Paid"
        )
        db_session.add(pending_invoice)
        
        # Create pending purchase
        pending_purchase = Purchase(
            vendor_id=vendor.id,
            purchase_no="PUR-001",
            grand_total=Decimal("500.00"),
            paid_amount=Decimal("200.00"),
            balance_amount=Decimal("300.00"),
            status="Partially Paid"
        )
        db_session.add(pending_purchase)
        
        db_session.commit()
        
        # Test pending payments
        service = ProfitPathService(db_session)
        result = service.get_pending_payments()
        
        assert len(result["pending_invoices"]) == 1
        assert len(result["pending_purchases"]) == 1
        assert result["total_pending_invoices"] == 600.0
        assert result["total_pending_purchases"] == 300.0
        assert result["total_pending"] == 900.0
        
        # Check invoice details
        invoice = result["pending_invoices"][0]
        assert invoice["document_no"] == "INV-001"
        assert invoice["pending_amount"] == 600.0
        assert invoice["party_name"] == "Test Customer"
        assert invoice["document_type"] == "invoice"
        
        # Check purchase details
        purchase = result["pending_purchases"][0]
        assert purchase["document_no"] == "PUR-001"
        assert purchase["pending_amount"] == 300.0
        assert purchase["party_name"] == "Test Vendor"
        assert purchase["document_type"] == "purchase"
    
    def test_get_financial_year_summary(self, db_session: Session):
        """Test financial year summary"""
        # Create test data for FY 2024-25
        customer = Party(name="Test Customer", gstin="123456789012345", party_type="Customer")
        db_session.add(customer)
        db_session.flush()
        
        # Create invoice and payment in FY 2024-25
        invoice = Invoice(
            customer_id=customer.id,
            invoice_no="INV-001",
            grand_total=Decimal("1000.00")
        )
        db_session.add(invoice)
        db_session.flush()
        
        payment = Payment(
            invoice_id=invoice.id,
            payment_amount=Decimal("1000.00"),
            payment_method="Bank Transfer",
            account_head="Bank",
            payment_date=datetime(2024, 6, 15)  # FY 2024-25
        )
        db_session.add(payment)
        
        db_session.commit()
        
        # Test financial year summary
        service = ProfitPathService(db_session)
        result = service.get_financial_year_summary("2024-25")
        
        assert result["total_income"] == 1000.0
        assert result["total_outflow"] == 0.0
        assert result["net_cashflow"] == 1000.0
    
    def test_get_expense_history_by_financial_year(self, db_session: Session):
        """Test expense history by financial year"""
        # Create expense in FY 2024-25
        expense = Expense(
            expense_type="Office Supplies",
            category="Indirect",
            description="Stationery",
            total_amount=Decimal("100.00"),
            payment_method="Cash",
            account_head="Cash",
            expense_date=datetime(2024, 6, 15)  # FY 2024-25
        )
        db_session.add(expense)
        db_session.commit()
        
        # Test expense history
        service = ProfitPathService(db_session)
        result = service.get_expense_history_by_financial_year("2024-25")
        
        assert len(result) == 1
        expense_record = result[0]
        assert expense_record["expense_type"] == "Office Supplies"
        assert expense_record["amount"] == 100.0
        assert expense_record["payment_method"] == "Cash"


class TestCashflowServiceIntegration:
    """Integration tests for CashflowService with API endpoints"""
    
    def test_cashflow_summary_api(self, client, auth_headers):
        """Test cashflow summary API endpoint"""
        response = client.get("/api/cashflow/summary", headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert "total_income" in data
        assert "total_outflow" in data
        assert "net_cashflow" in data
        assert "total_transactions" in data
    
    def test_cashflow_transactions_api(self, client, auth_headers):
        """Test cashflow transactions API endpoint"""
        response = client.get("/api/cashflow/transactions", headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert "transactions" in data
        assert "total_count" in data
        assert "page" in data
        assert "limit" in data
        assert "total_pages" in data
    
    def test_pending_payments_api(self, client, auth_headers):
        """Test pending payments API endpoint"""
        response = client.get("/api/cashflow/pending-payments", headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert "pending_invoices" in data
        assert "pending_purchases" in data
        assert "total_pending" in data
    
    def test_financial_year_summary_api(self, client, auth_headers):
        """Test financial year summary API endpoint"""
        response = client.get("/api/cashflow/financial-year/2024-25", headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert "total_income" in data
        assert "total_outflow" in data
        assert "net_cashflow" in data
    
    def test_expense_history_api(self, client, auth_headers):
        """Test expense history API endpoint"""
        response = client.get("/api/cashflow/expenses/2024-25", headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
