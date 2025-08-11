import pytest
import re
from httpx import AsyncClient
from backend.app.main import app


@pytest.mark.asyncio
async def test_product_creation_with_item_types():
    """Test creating products with different item types"""
    async with AsyncClient(app=app, base_url="http://localhost:8000") as client:
        # Login as admin
        login_response = await client.post("/api/auth/login", json={
            "username": "admin",
            "password": "admin123"
        })
        assert login_response.status_code == 200
        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Test tradable item
        tradable_product = {
            "name": "Test Tradable Product",
            "description": "A tradable product",
            "item_type": "tradable",
            "sales_price": 100.00,
            "purchase_price": 80.00,
            "stock": 50,
            "sku": "TRAD001",
            "unit": "Pcs",
            "supplier": "Test Supplier",
            "category": "Test Category",
            "gst_rate": 18.0
        }
        
        response = await client.post("/api/products", headers=headers, json=tradable_product)
        assert response.status_code == 201
        product = response.json()
        assert product["item_type"] == "tradable"
        assert product["name"] == "Test Tradable Product"
        
        # Test consumable item
        consumable_product = {
            "name": "Test Consumable Product",
            "description": "A consumable product",
            "item_type": "consumable",
            "sales_price": 50.00,
            "purchase_price": 40.00,
            "stock": 100,
            "sku": "CONS001",
            "unit": "Kg",
            "supplier": "Test Supplier",
            "category": "Consumables",
            "gst_rate": 12.0
        }
        
        response = await client.post("/api/products", headers=headers, json=consumable_product)
        assert response.status_code == 201
        product = response.json()
        assert product["item_type"] == "consumable"
        
        # Test manufactured item
        manufactured_product = {
            "name": "Test Manufactured Product",
            "description": "A manufactured product",
            "item_type": "manufactured",
            "sales_price": 200.00,
            "purchase_price": None,  # Manufactured items may not have purchase price
            "stock": 25,
            "sku": "MANU001",
            "unit": "Pcs",
            "supplier": None,
            "category": "Manufactured",
            "gst_rate": 18.0
        }
        
        response = await client.post("/api/products", headers=headers, json=manufactured_product)
        assert response.status_code == 201
        product = response.json()
        assert product["item_type"] == "manufactured"


@pytest.mark.asyncio
async def test_product_validation_errors():
    """Test product creation validation errors"""
    async with AsyncClient(app=app, base_url="http://localhost:8000") as client:
        # Login as admin
        login_response = await client.post("/api/auth/login", json={
            "username": "admin",
            "password": "admin123"
        })
        assert login_response.status_code == 200
        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Test name validation (too long)
        product_data = {
            "name": "A" * 101,  # Too long
            "sales_price": 100.00,
            "gst_rate": 18.0
        }
        response = await client.post("/api/products", headers=headers, json=product_data)
        assert response.status_code == 400
        assert "name" in response.json()["detail"].lower()
        
        # Test name validation (invalid characters)
        product_data = {
            "name": "Product@#$%",  # Invalid characters
            "sales_price": 100.00,
            "gst_rate": 18.0
        }
        response = await client.post("/api/products", headers=headers, json=product_data)
        assert response.status_code == 400
        assert "name" in response.json()["detail"].lower()
        
        # Test description validation (too long)
        product_data = {
            "name": "Valid Product",
            "description": "A" * 201,  # Too long
            "sales_price": 100.00,
            "gst_rate": 18.0
        }
        response = await client.post("/api/products", headers=headers, json=product_data)
        assert response.status_code == 400
        assert "description" in response.json()["detail"].lower()
        
        # Test sales price validation (negative)
        product_data = {
            "name": "Valid Product",
            "sales_price": -10.00,
            "gst_rate": 18.0
        }
        response = await client.post("/api/products", headers=headers, json=product_data)
        assert response.status_code == 400
        assert "sales_price" in response.json()["detail"].lower()
        
        # Test sales price validation (too high)
        product_data = {
            "name": "Valid Product",
            "sales_price": 1000000.00,  # Too high
            "gst_rate": 18.0
        }
        response = await client.post("/api/products", headers=headers, json=product_data)
        assert response.status_code == 400
        assert "sales_price" in response.json()["detail"].lower()
        
        # Test stock validation (negative)
        product_data = {
            "name": "Valid Product",
            "sales_price": 100.00,
            "stock": -5,
            "gst_rate": 18.0
        }
        response = await client.post("/api/products", headers=headers, json=product_data)
        assert response.status_code == 400
        assert "stock" in response.json()["detail"].lower()
        
        # Test stock validation (not integer)
        product_data = {
            "name": "Valid Product",
            "sales_price": 100.00,
            "stock": 5.5,  # Should be integer
            "gst_rate": 18.0
        }
        response = await client.post("/api/products", headers=headers, json=product_data)
        assert response.status_code == 422  # Validation error
        
        # Test SKU validation (too long)
        product_data = {
            "name": "Valid Product",
            "sales_price": 100.00,
            "sku": "A" * 51,  # Too long
            "gst_rate": 18.0
        }
        response = await client.post("/api/products", headers=headers, json=product_data)
        assert response.status_code == 400
        assert "sku" in response.json()["detail"].lower()
        
        # Test supplier validation (too long)
        product_data = {
            "name": "Valid Product",
            "sales_price": 100.00,
            "supplier": "A" * 101,  # Too long
            "gst_rate": 18.0
        }
        response = await client.post("/api/products", headers=headers, json=product_data)
        assert response.status_code == 400
        assert "supplier" in response.json()["detail"].lower()
        
        # Test category validation (too long)
        product_data = {
            "name": "Valid Product",
            "sales_price": 100.00,
            "category": "A" * 101,  # Too long
            "gst_rate": 18.0
        }
        response = await client.post("/api/products", headers=headers, json=product_data)
        assert response.status_code == 400
        assert "category" in response.json()["detail"].lower()
        
        # Test invalid item type
        product_data = {
            "name": "Valid Product",
            "sales_price": 100.00,
            "item_type": "invalid_type",
            "gst_rate": 18.0
        }
        response = await client.post("/api/products", headers=headers, json=product_data)
        assert response.status_code == 400
        assert "item_type" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_product_update_validation():
    """Test product update validation"""
    async with AsyncClient(app=app, base_url="http://localhost:8000") as client:
        # Login as admin
        login_response = await client.post("/api/auth/login", json={
            "username": "admin",
            "password": "admin123"
        })
        assert login_response.status_code == 200
        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Create a product first
        product_data = {
            "name": "Test Product for Update",
            "sales_price": 100.00,
            "gst_rate": 18.0
        }
        create_response = await client.post("/api/products", headers=headers, json=product_data)
        assert create_response.status_code == 201
        product_id = create_response.json()["id"]
        
        # Test updating with invalid data
        update_data = {
            "name": "A" * 101,  # Too long
            "sales_price": -10.00  # Negative
        }
        response = await client.put(f"/api/products/{product_id}", headers=headers, json=update_data)
        assert response.status_code == 400
        assert "name" in response.json()["detail"].lower() or "sales_price" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_product_toggle_status():
    """Test toggling product active status"""
    async with AsyncClient(app=app, base_url="http://localhost:8000") as client:
        # Login as admin
        login_response = await client.post("/api/auth/login", json={
            "username": "admin",
            "password": "admin123"
        })
        assert login_response.status_code == 200
        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Create a product
        product_data = {
            "name": "Test Product for Toggle",
            "sales_price": 100.00,
            "gst_rate": 18.0
        }
        create_response = await client.post("/api/products", headers=headers, json=product_data)
        assert create_response.status_code == 201
        product_id = create_response.json()["id"]
        assert create_response.json()["is_active"] is True
        
        # Toggle to inactive
        toggle_response = await client.patch(f"/api/products/{product_id}/toggle", headers=headers)
        assert toggle_response.status_code == 200
        assert toggle_response.json()["is_active"] is False
        
        # Toggle back to active
        toggle_response = await client.patch(f"/api/products/{product_id}/toggle", headers=headers)
        assert toggle_response.status_code == 200
        assert toggle_response.json()["is_active"] is True


@pytest.mark.asyncio
async def test_product_listing_with_filters():
    """Test product listing with various filters"""
    async with AsyncClient(app=app, base_url="http://localhost:8000") as client:
        # Login
        login_response = await client.post("/api/auth/login", json={
            "username": "admin",
            "password": "admin123"
        })
        assert login_response.status_code == 200
        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Get all products
        response = await client.get("/api/products", headers=headers)
        assert response.status_code == 200
        products = response.json()
        assert len(products) > 0
        
        # Verify all products have required fields
        for product in products:
            assert "id" in product
            assert "name" in product
            assert "item_type" in product
            assert "sales_price" in product
            assert "stock" in product
            assert "unit" in product
            assert "gst_rate" in product
            assert "is_active" in product
            
            # Verify item_type is valid
            assert product["item_type"] in ["tradable", "consumable", "manufactured"]
            
            # Verify stock is integer
            assert isinstance(product["stock"], int)
            
            # Verify sales_price is positive
            assert product["sales_price"] > 0


@pytest.mark.asyncio
async def test_product_sku_uniqueness():
    """Test that SKU uniqueness is enforced"""
    async with AsyncClient(app=app, base_url="http://localhost:8000") as client:
        # Login as admin
        login_response = await client.post("/api/auth/login", json={
            "username": "admin",
            "password": "admin123"
        })
        assert login_response.status_code == 200
        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Create first product with SKU
        product1_data = {
            "name": "Product 1",
            "sales_price": 100.00,
            "sku": "UNIQUE001",
            "gst_rate": 18.0
        }
        response1 = await client.post("/api/products", headers=headers, json=product1_data)
        assert response1.status_code == 201
        
        # Try to create second product with same SKU
        product2_data = {
            "name": "Product 2",
            "sales_price": 200.00,
            "sku": "UNIQUE001",  # Same SKU
            "gst_rate": 18.0
        }
        response2 = await client.post("/api/products", headers=headers, json=product2_data)
        assert response2.status_code == 400
        assert "sku" in response2.json()["detail"].lower() or "unique" in response2.json()["detail"].lower()


@pytest.mark.asyncio
async def test_product_default_values():
    """Test that products are created with correct default values"""
    async with AsyncClient(app=app, base_url="http://localhost:8000") as client:
        # Login as admin
        login_response = await client.post("/api/auth/login", json={
            "username": "admin",
            "password": "admin123"
        })
        assert login_response.status_code == 200
        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Create product with minimal data
        product_data = {
            "name": "Minimal Product",
            "sales_price": 100.00,
            "gst_rate": 18.0
        }
        response = await client.post("/api/products", headers=headers, json=product_data)
        assert response.status_code == 201
        product = response.json()
        
        # Verify default values
        assert product["item_type"] == "tradable"
        assert product["stock"] == 0
        assert product["unit"] == "Pcs"
        assert product["is_active"] is True
        assert product["description"] is None
        assert product["purchase_price"] is None
        assert product["sku"] is None
        assert product["supplier"] is None
        assert product["category"] is None
        assert product["notes"] is None
        assert product["hsn"] is None
