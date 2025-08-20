import pytest
from datetime import datetime
from app.models import Product, StockLedgerEntry


class TestStockCRUD:
    """Test stock CRUD operations"""
    
    def test_create_product_with_stock(self, client, db_session, sample_product_data):
        """Test creating product with initial stock"""
        response = client.post("/api/products/", json=sample_product_data)
        
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == sample_product_data["name"]
        assert data["stock_quantity"] == sample_product_data["stock_quantity"]
    
    def test_get_product_stock(self, client, db_session, sample_product_data):
        """Test retrieving product stock information"""
        # Create product
        response = client.post("/api/products/", json=sample_product_data)
        product_id = response.json()["id"]
        
        # Get stock information
        response = client.get(f"/api/products/{product_id}/stock")
        
        assert response.status_code == 200
        data = response.json()
        assert data["product_id"] == product_id
        assert data["current_stock"] == sample_product_data["stock_quantity"]
    
    def test_update_product_stock(self, client, db_session, sample_product_data):
        """Test updating product stock"""
        # Create product
        response = client.post("/api/products/", json=sample_product_data)
        product_id = response.json()["id"]
        
        # Update stock
        update_data = {"stock_quantity": 75}
        response = client.put(f"/api/products/{product_id}", json=update_data)
        
        assert response.status_code == 200
        data = response.json()
        assert data["stock_quantity"] == 75
    
    def test_list_products_with_stock(self, client, db_session, sample_product_data):
        """Test listing products with stock information"""
        # Create multiple products
        for i in range(3):
            product_data = {**sample_product_data}
            product_data["name"] = f"Product {i+1}"
            product_data["stock_quantity"] = 10 * (i + 1)
            client.post("/api/products/", json=product_data)
        
        # List products
        response = client.get("/api/products/")
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 3
        
        # Verify stock quantities
        stock_quantities = [p["stock_quantity"] for p in data if p["name"].startswith("Product")]
        assert 10 in stock_quantities
        assert 20 in stock_quantities
        assert 30 in stock_quantities


class TestStockAdjustments:
    """Test stock adjustment functionality"""
    
    def test_create_stock_adjustment_in(self, client, db_session, sample_stock_adjustment_data):
        """Test creating stock adjustment (incoming)"""
        # Create product first
        product_data = {
            "name": "Test Product",
            "description": "Test Description",
            "category": "Test Category",
            "unit_price": 100.00,
            "cost_price": 80.00,
            "stock_quantity": 50,
            "sku": "TEST001"
        }
        product_response = client.post("/api/products/", json=product_data)
        product_id = product_response.json()["id"]
        
        # Create stock adjustment
        adjustment_data = {
            **sample_stock_adjustment_data,
            "product_id": product_id,
            "adjustment_type": "in",
            "quantity": 10
        }
        
        response = client.post("/api/stock/adjustments/", json=adjustment_data)
        
        assert response.status_code == 201
        data = response.json()
        assert data["product_id"] == product_id
        assert data["adjustment_type"] == "in"
        assert data["quantity"] == 10
        
        # Verify stock is updated
        stock_response = client.get(f"/api/products/{product_id}/stock")
        assert stock_response.json()["current_stock"] == 60  # 50 + 10
    
    def test_create_stock_adjustment_out(self, client, db_session, sample_stock_adjustment_data):
        """Test creating stock adjustment (outgoing)"""
        # Create product with stock
        product_data = {
            "name": "Test Product",
            "description": "Test Description",
            "category": "Test Category",
            "unit_price": 100.00,
            "cost_price": 80.00,
            "stock_quantity": 50,
            "sku": "TEST001"
        }
        product_response = client.post("/api/products/", json=product_data)
        product_id = product_response.json()["id"]
        
        # Create stock adjustment (outgoing)
        adjustment_data = {
            **sample_stock_adjustment_data,
            "product_id": product_id,
            "adjustment_type": "out",
            "quantity": 5
        }
        
        response = client.post("/api/stock/adjustments/", json=adjustment_data)
        
        assert response.status_code == 201
        data = response.json()
        assert data["adjustment_type"] == "out"
        assert data["quantity"] == 5
        
        # Verify stock is updated
        stock_response = client.get(f"/api/products/{product_id}/stock")
        assert stock_response.json()["current_stock"] == 45  # 50 - 5
    
    def test_stock_adjustment_insufficient_stock(self, client, db_session, sample_stock_adjustment_data):
        """Test stock adjustment with insufficient stock"""
        # Create product with low stock
        product_data = {
            "name": "Test Product",
            "description": "Test Description",
            "category": "Test Category",
            "unit_price": 100.00,
            "cost_price": 80.00,
            "stock_quantity": 5,
            "sku": "TEST001"
        }
        product_response = client.post("/api/products/", json=product_data)
        product_id = product_response.json()["id"]
        
        # Try to adjust out more than available
        adjustment_data = {
            **sample_stock_adjustment_data,
            "product_id": product_id,
            "adjustment_type": "out",
            "quantity": 10  # More than available (5)
        }
        
        response = client.post("/api/stock/adjustments/", json=adjustment_data)
        
        assert response.status_code == 400
        data = response.json()
        assert "insufficient" in data["detail"].lower()
    
    def test_stock_adjustment_negative_quantity(self, client, db_session, sample_stock_adjustment_data):
        """Test stock adjustment with negative quantity"""
        # Create product
        product_data = {
            "name": "Test Product",
            "description": "Test Description",
            "category": "Test Category",
            "unit_price": 100.00,
            "cost_price": 80.00,
            "stock_quantity": 50,
            "sku": "TEST001"
        }
        product_response = client.post("/api/products/", json=product_data)
        product_id = product_response.json()["id"]
        
        # Try to adjust with negative quantity
        adjustment_data = {
            **sample_stock_adjustment_data,
            "product_id": product_id,
            "adjustment_type": "in",
            "quantity": -5
        }
        
        response = client.post("/api/stock/adjustments/", json=adjustment_data)
        
        assert response.status_code == 422


class TestStockMovementHistory:
    """Test stock movement history functionality"""
    
    def test_get_stock_movement_history(self, client, db_session, sample_stock_adjustment_data):
        """Test retrieving stock movement history"""
        # Create product and adjustments
        product_data = {
            "name": "Test Product",
            "description": "Test Description",
            "category": "Test Category",
            "unit_price": 100.00,
            "cost_price": 80.00,
            "stock_quantity": 50,
            "sku": "TEST001"
        }
        product_response = client.post("/api/products/", json=product_data)
        product_id = product_response.json()["id"]
        
        # Create multiple adjustments
        adjustments = [
            {"adjustment_type": "in", "quantity": 10, "reason": "Initial stock"},
            {"adjustment_type": "out", "quantity": 5, "reason": "Sale"},
            {"adjustment_type": "in", "quantity": 15, "reason": "Restock"}
        ]
        
        for adj in adjustments:
            adjustment_data = {
                **sample_stock_adjustment_data,
                "product_id": product_id,
                **adj
            }
            client.post("/api/stock/adjustments/", json=adjustment_data)
        
        # Get movement history
        response = client.get(f"/api/stock/movement-history?product_id={product_id}")
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 3  # Should have 3 movements
        
        # Verify movement types
        movement_types = [m["adjustment_type"] for m in data]
        assert "in" in movement_types
        assert "out" in movement_types
    
    def test_filter_stock_movement_by_date_range(self, client, db_session, sample_stock_adjustment_data):
        """Test filtering stock movement by date range"""
        # Create product and adjustments with different dates
        product_data = {
            "name": "Test Product",
            "description": "Test Description",
            "category": "Test Category",
            "unit_price": 100.00,
            "cost_price": 80.00,
            "stock_quantity": 50,
            "sku": "TEST001"
        }
        product_response = client.post("/api/products/", json=product_data)
        product_id = product_response.json()["id"]
        
        # Create adjustments with different dates
        dates = ["2024-01-01", "2024-01-15", "2024-02-01"]
        for date in dates:
            adjustment_data = {
                **sample_stock_adjustment_data,
                "product_id": product_id,
                "adjustment_date": date,
                "adjustment_type": "in",
                "quantity": 10
            }
            client.post("/api/stock/adjustments/", json=adjustment_data)
        
        # Filter by date range
        response = client.get(
            f"/api/stock/movement-history?product_id={product_id}&start_date=2024-01-01&end_date=2024-01-31"
        )
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2  # Should find movements from January


class TestStockValidation:
    """Test stock validation"""
    
    def test_product_with_negative_stock(self, client, sample_product_data):
        """Test creating product with negative stock"""
        product_data = {
            **sample_product_data,
            "stock_quantity": -10
        }
        
        response = client.post("/api/products/", json=product_data)
        
        assert response.status_code == 422
    
    def test_stock_adjustment_invalid_type(self, client, db_session, sample_stock_adjustment_data):
        """Test stock adjustment with invalid type"""
        # Create product
        product_data = {
            "name": "Test Product",
            "description": "Test Description",
            "category": "Test Category",
            "unit_price": 100.00,
            "cost_price": 80.00,
            "stock_quantity": 50,
            "sku": "TEST001"
        }
        product_response = client.post("/api/products/", json=product_data)
        product_id = product_response.json()["id"]
        
        # Try invalid adjustment type
        adjustment_data = {
            **sample_stock_adjustment_data,
            "product_id": product_id,
            "adjustment_type": "invalid_type",
            "quantity": 10
        }
        
        response = client.post("/api/stock/adjustments/", json=adjustment_data)
        
        assert response.status_code == 422
