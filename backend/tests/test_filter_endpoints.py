import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.models import Product, Party, Invoice, Purchase, Expense, User, Role
from datetime import datetime, date

class TestFilterEndpoints:
    """Comprehensive tests for all filter endpoints"""
    
    def test_products_filter_endpoint(self, client: TestClient, auth_headers: dict, test_product: Product):
        """Test products filter endpoint with various filter combinations"""
        
        # Test basic filtering
        response = client.get("/api/products?search=test", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data) > 0
        
        # Test status filter
        response = client.get("/api/products?status=active", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert all(product.get('is_active', False) for product in data)
        
        # Test category filter
        response = client.get("/api/products?category=Electronics", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert all(product.get('category') == 'Electronics' for product in data)
        
        # Test multiple filters
        response = client.get("/api/products?status=active&category=Electronics&gst_rate=18", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert all(
            product.get('is_active', False) and 
            product.get('category') == 'Electronics' and 
            product.get('gst_rate') == 18.0 
            for product in data
        )
        
        # Test price range filter
        response = client.get("/api/products?price_min=100&price_max=1000", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert all(
            100 <= product.get('sales_price', 0) <= 1000 
            for product in data
        )
        
        # Test stock level filter
        response = client.get("/api/products?stock_level=low_stock", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert all(product.get('stock', 0) < 10 for product in data)

    def test_invoices_filter_endpoint(self, client: TestClient, auth_headers: dict, test_customer: Party):
        """Test invoices filter endpoint with various filter combinations"""
        
        # Test basic filtering
        response = client.get("/api/invoices?search=test", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert 'invoices' in data
        
        # Test status filter
        response = client.get("/api/invoices?status=Paid", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert all(invoice.get('status') == 'Paid' for invoice in data['invoices'])
        
        # Test payment status filter
        response = client.get("/api/invoices?payment_status=unpaid", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert all(invoice.get('payment_status') == 'unpaid' for invoice in data['invoices'])
        
        # Test amount range filter
        response = client.get("/api/invoices?amount_min=1000&amount_max=5000", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert all(
            1000 <= invoice.get('grand_total', 0) <= 5000 
            for invoice in data['invoices']
        )
        
        # Test date range filter
        response = client.get("/api/invoices?date_from=2024-01-01&date_to=2024-12-31", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data['invoices']) >= 0  # May be empty depending on test data

    def test_purchases_filter_endpoint(self, client: TestClient, auth_headers: dict, test_supplier: Party):
        """Test purchases filter endpoint with various filter combinations"""
        
        # Test basic filtering
        response = client.get("/api/purchases?search=test", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert 'purchases' in data
        
        # Test status filter
        response = client.get("/api/purchases?status=Paid", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert all(purchase.get('status') == 'Paid' for purchase in data['purchases'])
        
        # Test vendor filter
        response = client.get(f"/api/purchases?vendor_id={test_supplier.id}", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert all(purchase.get('vendor_id') == test_supplier.id for purchase in data['purchases'])
        
        # Test amount range filter
        response = client.get("/api/purchases?amount_min=1000&amount_max=5000", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert all(
            1000 <= purchase.get('grand_total', 0) <= 5000 
            for purchase in data['purchases']
        )

    def test_expenses_filter_endpoint(self, client: TestClient, auth_headers: dict):
        """Test expenses filter endpoint with various filter combinations"""
        
        # Test basic filtering
        response = client.get("/api/expenses?search=test", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert 'expenses' in data
        
        # Test category filter
        response = client.get("/api/expenses?category=Direct/COGS", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert all(expense.get('category') == 'Direct/COGS' for expense in data['expenses'])
        
        # Test expense type filter
        response = client.get("/api/expenses?expense_type=Salary", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert all(expense.get('expense_type') == 'Salary' for expense in data['expenses'])
        
        # Test amount range filter
        response = client.get("/api/expenses?amount_min=100&amount_max=1000", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert all(
            100 <= expense.get('amount', 0) <= 1000 
            for expense in data['expenses']
        )

    def test_cashflow_transactions_filter_endpoint(self, client: TestClient, auth_headers: dict):
        """Test cashflow transactions filter endpoint with various filter combinations"""
        
        # Test basic filtering
        response = client.get("/api/cashflow/transactions?search=test", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert 'transactions' in data
        
        # Test type filter
        response = client.get("/api/cashflow/transactions?type_filter=inflow", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert all(transaction.get('type') == 'inflow' for transaction in data['transactions'])
        
        # Test payment method filter
        response = client.get("/api/cashflow/transactions?payment_method=Cash", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert all(transaction.get('payment_method') == 'Cash' for transaction in data['transactions'])
        
        # Test amount range filter
        response = client.get("/api/cashflow/transactions?amount_min=100&amount_max=1000", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert all(
            100 <= transaction.get('amount', 0) <= 1000 
            for transaction in data['transactions']
        )

    def test_stock_history_filter_endpoint(self, client: TestClient, auth_headers: dict, test_product: Product):
        """Test stock history filter endpoint with various filter combinations"""
        
        # Test basic filtering
        response = client.get("/api/stock/history", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        
        # Test product filter
        response = client.get(f"/api/stock/history?product_id={test_product.id}", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert all(entry.get('product_id') == test_product.id for entry in data)
        
        # Test entry type filter
        response = client.get("/api/stock/history?entry_type=in", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert all(entry.get('entry_type') == 'in' for entry in data)

    def test_invoice_payments_filter_endpoint(self, client: TestClient, auth_headers: dict):
        """Test invoice payments filter endpoint with various filter combinations"""
        
        # Test basic filtering
        response = client.get("/api/invoice-payments", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        
        # Test payment method filter
        response = client.get("/api/invoice-payments?payment_method=Cash", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert all(payment.get('payment_method') == 'Cash' for payment in data)
        
        # Test amount range filter
        response = client.get("/api/invoice-payments?amount_min=100&amount_max=1000", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert all(
            100 <= payment.get('payment_amount', 0) <= 1000 
            for payment in data
        )

    def test_purchase_payments_filter_endpoint(self, client: TestClient, auth_headers: dict):
        """Test purchase payments filter endpoint with various filter combinations"""
        
        # Test basic filtering
        response = client.get("/api/purchase-payments", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        
        # Test payment method filter
        response = client.get("/api/purchase-payments?payment_method=Cash", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert all(payment.get('method') == 'Cash' for payment in data)
        
        # Test amount range filter
        response = client.get("/api/purchase-payments?amount_min=100&amount_max=1000", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert all(
            100 <= payment.get('amount', 0) <= 1000 
            for payment in data
        )

    def test_filter_combinations(self, client: TestClient, auth_headers: dict):
        """Test complex filter combinations across endpoints"""
        
        # Test products with multiple filters
        response = client.get(
            "/api/products?status=active&category=Electronics&gst_rate=18&price_min=100&price_max=1000&stock_level=in_stock",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        
        # Test invoices with multiple filters
        response = client.get(
            "/api/invoices?status=Paid&payment_status=paid&amount_min=1000&amount_max=5000&date_from=2024-01-01&date_to=2024-12-31",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert 'invoices' in data
        
        # Test cashflow with multiple filters
        response = client.get(
            "/api/cashflow/transactions?type_filter=inflow&payment_method=Cash&amount_min=100&amount_max=1000",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert 'transactions' in data

    def test_filter_validation(self, client: TestClient, auth_headers: dict):
        """Test filter parameter validation"""
        
        # Test invalid status
        response = client.get("/api/products?status=invalid_status", headers=auth_headers)
        assert response.status_code == 200  # Should handle gracefully
        data = response.json()
        assert len(data) == 0  # Should return empty results
        
        # Test invalid date format
        response = client.get("/api/invoices?date_from=invalid-date", headers=auth_headers)
        assert response.status_code == 422  # Should return validation error
        
        # Test invalid amount range
        response = client.get("/api/products?price_min=abc&price_max=def", headers=auth_headers)
        assert response.status_code == 422  # Should return validation error
        
        # Test negative amounts
        response = client.get("/api/products?price_min=-100", headers=auth_headers)
        assert response.status_code == 200  # Should handle gracefully

    def test_filter_performance(self, client: TestClient, auth_headers: dict):
        """Test filter endpoint performance"""
        
        import time
        
        # Test products filter performance
        start_time = time.time()
        response = client.get("/api/products?search=test&status=active&category=Electronics", headers=auth_headers)
        end_time = time.time()
        
        assert response.status_code == 200
        assert end_time - start_time < 1.0  # Should respond within 1 second
        
        # Test invoices filter performance
        start_time = time.time()
        response = client.get("/api/invoices?status=Paid&payment_status=paid", headers=auth_headers)
        end_time = time.time()
        
        assert response.status_code == 200
        assert end_time - start_time < 1.0  # Should respond within 1 second

    def test_filter_pagination(self, client: TestClient, auth_headers: dict):
        """Test filter endpoints with pagination"""
        
        # Test products with pagination
        response = client.get("/api/products?page=1&limit=5", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data) <= 5
        
        # Test invoices with pagination
        response = client.get("/api/invoices?page=1&limit=10", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data['invoices']) <= 10
        assert 'total_count' in data
        assert 'total_pages' in data

    def test_filter_sorting(self, client: TestClient, auth_headers: dict):
        """Test filter endpoints with sorting"""
        
        # Test products with sorting
        response = client.get("/api/products?sort_by=name&sort_order=asc", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data) > 0
        
        # Test invoices with sorting
        response = client.get("/api/invoices?sort_by=date&sort_order=desc", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data['invoices']) > 0

    def test_filter_error_handling(self, client: TestClient, auth_headers: dict):
        """Test filter endpoint error handling"""
        
        # Test without authentication
        response = client.get("/api/products?search=test")
        assert response.status_code == 401
        
        # Test with invalid filter parameters
        response = client.get("/api/products?invalid_param=value", headers=auth_headers)
        assert response.status_code == 200  # Should ignore invalid parameters
        
        # Test with malformed query parameters
        response = client.get("/api/products?search=", headers=auth_headers)
        assert response.status_code == 200  # Should handle empty search

    def test_filter_data_consistency(self, client: TestClient, auth_headers: dict, test_product: Product):
        """Test filter data consistency across endpoints"""
        
        # Test that filtered products maintain data integrity
        response = client.get(f"/api/products?search={test_product.name}", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        
        if len(data) > 0:
            product = data[0]
            assert product['id'] == test_product.id
            assert product['name'] == test_product.name
            assert product['category'] == test_product.category
            assert product['gst_rate'] == test_product.gst_rate
            assert product['sales_price'] == test_product.sales_price
            assert product['stock'] == test_product.stock

    def test_filter_edge_cases(self, client: TestClient, auth_headers: dict):
        """Test filter edge cases"""
        
        # Test with very large search terms
        large_search = "a" * 1000
        response = client.get(f"/api/products?search={large_search}", headers=auth_headers)
        assert response.status_code == 200
        
        # Test with special characters in search
        special_search = "test@#$%^&*()"
        response = client.get(f"/api/products?search={special_search}", headers=auth_headers)
        assert response.status_code == 200
        
        # Test with empty filter values
        response = client.get("/api/products?status=&category=", headers=auth_headers)
        assert response.status_code == 200
        
        # Test with whitespace in search
        response = client.get("/api/products?search=   test   ", headers=auth_headers)
        assert response.status_code == 200
