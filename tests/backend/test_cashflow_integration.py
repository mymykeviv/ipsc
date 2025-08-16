"""
Integration tests for Cashflow functionality - Ensuring no breaking changes
"""
import pytest
from datetime import datetime, date
from decimal import Decimal
from sqlalchemy.orm import Session
from backend.app.models import Payment, PurchasePayment, Expense, Invoice, Purchase, Party, Product
from backend.app.cashflow_service import CashflowService


class TestCashflowIntegration:
    """Integration tests to ensure cashflow changes don't break existing functionality"""
    
    def test_cashflow_summary_api_compatibility(self, client, auth_headers):
        """Test that cashflow summary API returns expected format"""
        response = client.get("/api/cashflow/summary", headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        
        # Check required fields exist
        assert "period" in data
        assert "income" in data
        assert "expenses" in data
        assert "cashflow" in data
        
        # Check period structure
        assert "start_date" in data["period"]
        assert "end_date" in data["period"]
        
        # Check income structure
        assert "total_invoice_amount" in data["income"]
        assert "total_payments_received" in data["income"]
        
        # Check expenses structure
        assert "total_expenses" in data["expenses"]
        assert "total_purchase_payments" in data["expenses"]
        assert "total_outflow" in data["expenses"]
        
        # Check cashflow structure
        assert "net_cashflow" in data["cashflow"]
        assert "cash_inflow" in data["cashflow"]
        assert "cash_outflow" in data["cashflow"]
        
        # Check data types
        assert isinstance(data["income"]["total_invoice_amount"], (int, float))
        assert isinstance(data["income"]["total_payments_received"], (int, float))
        assert isinstance(data["expenses"]["total_expenses"], (int, float))
        assert isinstance(data["expenses"]["total_purchase_payments"], (int, float))
        assert isinstance(data["cashflow"]["net_cashflow"], (int, float))
    
    def test_cashflow_transactions_api_compatibility(self, client, auth_headers):
        """Test that cashflow transactions API returns expected format"""
        response = client.get("/api/cashflow/transactions", headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        
        # Check pagination structure
        assert "transactions" in data
        assert "total_count" in data
        assert "page" in data
        assert "limit" in data
        assert "total_pages" in data
        
        # Check data types
        assert isinstance(data["transactions"], list)
        assert isinstance(data["total_count"], int)
        assert isinstance(data["page"], int)
        assert isinstance(data["limit"], int)
        assert isinstance(data["total_pages"], int)
        
        # If there are transactions, check their structure
        if data["transactions"]:
            transaction = data["transactions"][0]
            required_fields = [
                "id", "transaction_date", "type", "description", 
                "payment_method", "amount", "account_head", "source_type",
                "source_id", "reference_document", "party_name", "created_at"
            ]
            
            for field in required_fields:
                assert field in transaction, f"Missing field: {field}"
            
            # Check type values
            assert transaction["type"] in ["inflow", "outflow"]
            assert isinstance(transaction["amount"], (int, float))
            assert isinstance(transaction["source_id"], int)
    
    def test_pending_payments_api_compatibility(self, client, auth_headers):
        """Test that pending payments API returns expected format"""
        response = client.get("/api/cashflow/pending-payments", headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        
        # Check structure
        assert "pending_invoices" in data
        assert "pending_purchases" in data
        assert "total_pending_invoices" in data
        assert "total_pending_purchases" in data
        assert "total_pending" in data
        
        # Check data types
        assert isinstance(data["pending_invoices"], list)
        assert isinstance(data["pending_purchases"], list)
        assert isinstance(data["total_pending_invoices"], (int, float))
        assert isinstance(data["total_pending_purchases"], (int, float))
        assert isinstance(data["total_pending"], (int, float))
    
    def test_financial_year_summary_api_compatibility(self, client, auth_headers):
        """Test that financial year summary API returns expected format"""
        response = client.get("/api/cashflow/financial-year/2024-25", headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        
        # Check structure (should be similar to cashflow summary)
        assert "total_income" in data
        assert "total_outflow" in data
        assert "net_cashflow" in data
        
        # Check data types
        assert isinstance(data["total_income"], (int, float))
        assert isinstance(data["total_outflow"], (int, float))
        assert isinstance(data["net_cashflow"], (int, float))
    
    def test_expense_history_api_compatibility(self, client, auth_headers):
        """Test that expense history API returns expected format"""
        response = client.get("/api/cashflow/expenses/2024-25", headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        
        # Should return a list
        assert isinstance(data, list)
        
        # If there are expenses, check their structure
        if data:
            expense = data[0]
            required_fields = ["expense_type", "amount", "payment_method"]
            
            for field in required_fields:
                assert field in expense, f"Missing field: {field}"
            
            assert isinstance(expense["amount"], (int, float))
    
    def test_cashflow_data_consistency(self, db_session: Session):
        """Test that cashflow data is consistent across different endpoints"""
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
        
        # Test consistency
        service = CashflowService(db_session)
        
        # Test summary
        summary = service.get_cashflow_summary()
        assert summary["total_income"] == 600.0
        assert summary["total_outflow"] == 100.0
        assert summary["net_cashflow"] == 500.0
        
        # Test transactions
        transactions = service.get_cashflow_transactions()
        assert transactions["total_count"] == 2
        
        # Verify transaction types
        inflow_count = sum(1 for t in transactions["transactions"] if t["type"] == "inflow")
        outflow_count = sum(1 for t in transactions["transactions"] if t["type"] == "outflow")
        assert inflow_count == 1
        assert outflow_count == 1
        
        # Test pending payments
        pending = service.get_pending_payments()
        assert pending["total_pending_invoices"] == 400.0  # 1000 - 600
        assert pending["total_pending"] == 400.0
    
    def test_cashflow_with_filters(self, db_session: Session):
        """Test cashflow functionality with various filters"""
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
        
        service = CashflowService(db_session)
        
        # Test type filter
        inflow_transactions = service.get_cashflow_transactions(type_filter="inflow")
        assert inflow_transactions["total_count"] == 1
        assert all(t["type"] == "inflow" for t in inflow_transactions["transactions"])
        
        outflow_transactions = service.get_cashflow_transactions(type_filter="outflow")
        assert outflow_transactions["total_count"] == 1
        assert all(t["type"] == "outflow" for t in outflow_transactions["transactions"])
        
        # Test search filter
        search_transactions = service.get_cashflow_transactions(search="Customer")
        assert search_transactions["total_count"] == 1
        assert "Customer" in search_transactions["transactions"][0]["party_name"]
        
        # Test pagination
        paginated = service.get_cashflow_transactions(page=1, limit=1)
        assert len(paginated["transactions"]) == 1
        assert paginated["total_count"] == 2
        assert paginated["total_pages"] == 2
    
    def test_cashflow_edge_cases(self, db_session: Session):
        """Test cashflow functionality with edge cases"""
        service = CashflowService(db_session)
        
        # Test with empty database
        summary = service.get_cashflow_summary()
        assert summary["total_income"] == 0.0
        assert summary["total_outflow"] == 0.0
        assert summary["net_cashflow"] == 0.0
        
        transactions = service.get_cashflow_transactions()
        assert transactions["total_count"] == 0
        assert transactions["transactions"] == []
        
        pending = service.get_pending_payments()
        assert pending["total_pending"] == 0.0
        assert pending["pending_invoices"] == []
        assert pending["pending_purchases"] == []
        
        # Test with date filters
        start_date = date(2020, 1, 1)
        end_date = date(2020, 12, 31)
        filtered_summary = service.get_cashflow_summary(start_date, end_date)
        assert filtered_summary["total_income"] == 0.0
        assert filtered_summary["total_outflow"] == 0.0
    
    def test_cashflow_service_error_handling(self, db_session: Session):
        """Test error handling in cashflow service"""
        service = CashflowService(db_session)
        
        # Test with invalid financial year format
        try:
            result = service.get_financial_year_summary("invalid-year")
            # Should handle gracefully or raise appropriate error
        except Exception as e:
            # Expected behavior - should handle invalid input
            pass
        
        # Test with invalid date ranges
        try:
            result = service.get_cashflow_summary(
                start_date=date(2025, 12, 31),
                end_date=date(2025, 1, 1)  # End before start
            )
            # Should handle gracefully
        except Exception as e:
            # Expected behavior
            pass


class TestCashflowBackwardCompatibility:
    """Tests to ensure backward compatibility with existing functionality"""
    
    def test_existing_payment_flows_still_work(self, client, auth_headers, db_session: Session):
        """Test that existing payment flows still work after cashflow changes"""
        # Create test data
        customer = Party(name="Test Customer", gstin="123456789012345", party_type="Customer")
        db_session.add(customer)
        db_session.flush()
        
        invoice = Invoice(
            customer_id=customer.id,
            invoice_no="INV-002",
            grand_total=Decimal("500.00"),
            paid_amount=Decimal("0.00"),
            balance_amount=Decimal("500.00")
        )
        db_session.add(invoice)
        db_session.commit()
        
        # Test payment creation
        payment_data = {
            "amount": 300.0,
            "method": "Bank Transfer",
            "account_head": "Bank",
            "reference_number": "TEST123",
            "notes": "Test payment"
        }
        
        response = client.post(
            f"/api/invoices/{invoice.id}/payments",
            json=payment_data,
            headers=auth_headers
        )
        
        assert response.status_code == 201
        
        # Verify payment was created
        payment_response = client.get(
            f"/api/invoices/{invoice.id}/payments",
            headers=auth_headers
        )
        assert payment_response.status_code == 200
        
        payments = payment_response.json()
        assert len(payments) == 1
        assert payments[0]["payment_amount"] == 300.0
        
        # Verify cashflow data is updated
        cashflow_response = client.get("/api/cashflow/summary", headers=auth_headers)
        assert cashflow_response.status_code == 200
        
        cashflow_data = cashflow_response.json()
        assert cashflow_data["income"]["total_payments_received"] >= 300.0
    
    def test_existing_expense_flows_still_work(self, client, auth_headers):
        """Test that existing expense flows still work after cashflow changes"""
        # Test expense creation
        expense_data = {
            "expense_type": "Test Expense",
            "category": "Direct",
            "description": "Test expense for compatibility",
            "total_amount": 150.0,
            "payment_method": "Cash",
            "account_head": "Cash"
        }
        
        response = client.post(
            "/api/expenses",
            json=expense_data,
            headers=auth_headers
        )
        
        assert response.status_code == 201
        
        # Verify expense was created
        expenses_response = client.get("/api/expenses", headers=auth_headers)
        assert expenses_response.status_code == 200
        
        expenses = expenses_response.json()
        assert len(expenses) > 0
        
        # Verify cashflow data is updated
        cashflow_response = client.get("/api/cashflow/summary", headers=auth_headers)
        assert cashflow_response.status_code == 200
        
        cashflow_data = cashflow_response.json()
        assert cashflow_data["expenses"]["total_expenses"] >= 150.0
