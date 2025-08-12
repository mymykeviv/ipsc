import pytest
from httpx import AsyncClient
from sqlalchemy.orm import Session
from backend.app.models import Product, StockLedgerEntry
from backend.app.db import get_db
from backend.app.main import app


@pytest.mark.asyncio
async def test_stock_adjustment_add():
    """Test adding stock to a product"""
    async with AsyncClient(app=app, base_url="http://localhost:8000") as client:
        # Login first
        login_response = await client.post("/api/auth/login", json={
            "username": "admin",
            "password": "admin123"
        })
        assert login_response.status_code == 200
        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Get a product
        products_response = await client.get("/api/products", headers=headers)
        assert products_response.status_code == 200
        products = products_response.json()
        assert len(products) > 0
        product = products[0]
        initial_stock = product["stock"]
        
        # Add stock
        adjustment_response = await client.post("/api/stock/adjust", headers=headers, json={
            "product_id": product["id"],
            "quantity": 10,
            "adjustment_type": "add",
            "date_of_adjustment": "2024-01-15",
            "reference_bill_number": "BILL001",
            "supplier": "Test Supplier",
            "category": "Test Category",
            "notes": "Test stock addition"
        })
        
        assert adjustment_response.status_code == 201
        result = adjustment_response.json()
        assert result["ok"] is True
        assert result["new_stock"] == initial_stock + 10
        
        # Verify stock ledger entry
        stock_response = await client.get("/api/stock/summary", headers=headers)
        assert stock_response.status_code == 200
        stock_summary = stock_response.json()
        product_stock = next((item for item in stock_summary if item["product_id"] == product["id"]), None)
        assert product_stock is not None
        assert product_stock["onhand"] == initial_stock + 10


@pytest.mark.asyncio
async def test_stock_adjustment_reduce():
    """Test reducing stock from a product"""
    async with AsyncClient(app=app, base_url="http://localhost:8000") as client:
        # Login first
        login_response = await client.post("/api/auth/login", json={
            "username": "admin",
            "password": "admin123"
        })
        assert login_response.status_code == 200
        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Get a product with sufficient stock
        products_response = await client.get("/api/products", headers=headers)
        assert products_response.status_code == 200
        products = products_response.json()
        assert len(products) > 0
        
        # Find a product with stock > 5
        product = None
        for p in products:
            if p["stock"] >= 5:
                product = p
                break
        
        if not product:
            # Add stock first if needed
            product = products[0]
            await client.post("/api/stock/adjust", headers=headers, json={
                "product_id": product["id"],
                "quantity": 10,
                "adjustment_type": "add",
                "date_of_adjustment": "2024-01-15",
                "reference_bill_number": "BILL001",
                "supplier": "Test Supplier",
                "category": "Test Category",
                "notes": "Test stock addition"
            })
            initial_stock = product["stock"] + 10
        else:
            initial_stock = product["stock"]
        
        # Reduce stock
        adjustment_response = await client.post("/api/stock/adjust", headers=headers, json={
            "product_id": product["id"],
            "quantity": 3,
            "adjustment_type": "reduce",
            "date_of_adjustment": "2024-01-15",
            "reference_bill_number": "CONSUME001",
            "supplier": "",
            "category": "Consumption",
            "notes": "Test stock reduction"
        })
        
        assert adjustment_response.status_code == 201
        result = adjustment_response.json()
        assert result["ok"] is True
        assert result["new_stock"] == initial_stock - 3


@pytest.mark.asyncio
async def test_stock_adjustment_validation_errors():
    """Test stock adjustment validation errors"""
    async with AsyncClient(app=app, base_url="http://localhost:8000") as client:
        # Login first
        login_response = await client.post("/api/auth/login", json={
            "username": "admin",
            "password": "admin123"
        })
        assert login_response.status_code == 200
        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Get a product
        products_response = await client.get("/api/products", headers=headers)
        assert products_response.status_code == 200
        products = products_response.json()
        assert len(products) > 0
        product = products[0]
        
        # Test invalid quantity (negative)
        response = await client.post("/api/stock/adjust", headers=headers, json={
            "product_id": product["id"],
            "quantity": -5,
            "adjustment_type": "add",
            "date_of_adjustment": "2024-01-15"
        })
        assert response.status_code == 400
        assert "quantity" in response.json()["detail"].lower()
        
        # Test invalid quantity (too large)
        response = await client.post("/api/stock/adjust", headers=headers, json={
            "product_id": product["id"],
            "quantity": 1000000,
            "adjustment_type": "add",
            "date_of_adjustment": "2024-01-15"
        })
        assert response.status_code == 400
        assert "quantity" in response.json()["detail"].lower()
        
        # Test invalid adjustment type
        response = await client.post("/api/stock/adjust", headers=headers, json={
            "product_id": product["id"],
            "quantity": 5,
            "adjustment_type": "invalid",
            "date_of_adjustment": "2024-01-15"
        })
        assert response.status_code == 400  # Bad request error
        
        # Test invalid product ID
        response = await client.post("/api/stock/adjust", headers=headers, json={
            "product_id": 99999,
            "quantity": 5,
            "adjustment_type": "add",
            "date_of_adjustment": "2024-01-15"
        })
        assert response.status_code == 404
        assert "product" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_stock_adjustment_insufficient_stock():
    """Test reducing stock when insufficient stock available"""
    async with AsyncClient(app=app, base_url="http://localhost:8000") as client:
        # Login first
        login_response = await client.post("/api/auth/login", json={
            "username": "admin",
            "password": "admin123"
        })
        assert login_response.status_code == 200
        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Get a product
        products_response = await client.get("/api/products", headers=headers)
        assert products_response.status_code == 200
        products = products_response.json()
        assert len(products) > 0
        product = products[0]
        current_stock = product["stock"]
        
        # Try to reduce more stock than available
        adjustment_response = await client.post("/api/stock/adjust", headers=headers, json={
            "product_id": product["id"],
            "quantity": current_stock + 10,
            "adjustment_type": "reduce",
            "date_of_adjustment": "2024-01-15",
            "notes": "Test insufficient stock"
        })
        
        assert adjustment_response.status_code == 400
        assert "cannot reduce stock below 0" in adjustment_response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_stock_adjustment_field_validations():
    """Test field length validations for stock adjustment"""
    async with AsyncClient(app=app, base_url="http://localhost:8000") as client:
        # Login first
        login_response = await client.post("/api/auth/login", json={
            "username": "admin",
            "password": "admin123"
        })
        assert login_response.status_code == 200
        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Get a product
        products_response = await client.get("/api/products", headers=headers)
        assert products_response.status_code == 200
        products = products_response.json()
        assert len(products) > 0
        product = products[0]
        
        # Test reference bill number too long
        response = await client.post("/api/stock/adjust", headers=headers, json={
            "product_id": product["id"],
            "quantity": 5,
            "adjustment_type": "add",
            "date_of_adjustment": "2024-01-15",
            "reference_bill_number": "A" * 15  # Too long
        })
        assert response.status_code == 400
        assert "reference bill number" in response.json()["detail"].lower()
        
        # Test supplier too long
        response = await client.post("/api/stock/adjust", headers=headers, json={
            "product_id": product["id"],
            "quantity": 5,
            "adjustment_type": "add",
            "date_of_adjustment": "2024-01-15",
            "supplier": "A" * 60  # Too long
        })
        assert response.status_code == 400
        assert "supplier" in response.json()["detail"].lower()
        
        # Test category too long
        response = await client.post("/api/stock/adjust", headers=headers, json={
            "product_id": product["id"],
            "quantity": 5,
            "adjustment_type": "add",
            "date_of_adjustment": "2024-01-15",
            "category": "A" * 60  # Too long
        })
        assert response.status_code == 400
        assert "category" in response.json()["detail"].lower()
        
        # Test notes too long
        response = await client.post("/api/stock/adjust", headers=headers, json={
            "product_id": product["id"],
            "quantity": 5,
            "adjustment_type": "add",
            "date_of_adjustment": "2024-01-15",
            "notes": "A" * 250  # Too long
        })
        assert response.status_code == 400
        assert "notes" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_stock_summary_accuracy():
    """Test that stock summary accurately reflects all adjustments"""
    async with AsyncClient(app=app, base_url="http://localhost:8000") as client:
        # Login first
        login_response = await client.post("/api/auth/login", json={
            "username": "admin",
            "password": "admin123"
        })
        assert login_response.status_code == 200
        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Get a product
        products_response = await client.get("/api/products", headers=headers)
        assert products_response.status_code == 200
        products = products_response.json()
        assert len(products) > 0
        product = products[0]
        initial_stock = product["stock"]
        
        # Make multiple adjustments
        adjustments = [
            {"quantity": 10, "type": "add"},
            {"quantity": 5, "type": "reduce"},
            {"quantity": 3, "type": "add"},
            {"quantity": 2, "type": "reduce"}
        ]
        
        expected_stock = initial_stock
        for adj in adjustments:
            await client.post("/api/stock/adjust", headers=headers, json={
                "product_id": product["id"],
                "quantity": adj["quantity"],
                "adjustment_type": adj["type"],
                "date_of_adjustment": "2024-01-15",
                "notes": f"Test adjustment {adj['type']} {adj['quantity']}"
            })
            
            if adj["type"] == "add":
                expected_stock += adj["quantity"]
            else:
                expected_stock -= adj["quantity"]
        
        # Verify final stock
        stock_response = await client.get("/api/stock/summary", headers=headers)
        assert stock_response.status_code == 200
        stock_summary = stock_response.json()
        product_stock = next((item for item in stock_summary if item["product_id"] == product["id"]), None)
        assert product_stock is not None
        assert product_stock["onhand"] == expected_stock
