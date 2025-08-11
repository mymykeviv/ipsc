"""
End-to-end test for the login functionality to ensure authentication works correctly.
"""
import pytest
from httpx import AsyncClient
from backend.app.main import app


@pytest.mark.asyncio
async def test_login_flow_e2e():
    """Test the complete login flow: login -> get token -> access protected endpoint."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        # Test login with correct credentials
        login_response = await client.post(
            "/api/auth/login",
            json={"username": "admin", "password": "admin123"}
        )
        assert login_response.status_code == 200
        data = login_response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        
        token = data["access_token"]
        
        # Test accessing protected endpoint with token
        products_response = await client.get(
            "/api/products",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert products_response.status_code == 200
        products = products_response.json()
        assert isinstance(products, list)
        assert len(products) >= 2  # We have at least 2 seed products
        
        # Verify product structure
        if products:
            product = products[0]
            assert "id" in product
            assert "name" in product
            assert "sku" in product
            assert "hsn" in product
            assert "uom" in product
            assert "gst_rate" in product
            assert "price" in product


@pytest.mark.asyncio
async def test_login_with_invalid_credentials():
    """Test login with invalid credentials."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.post(
            "/api/auth/login",
            json={"username": "admin", "password": "wrongpassword"}
        )
        assert response.status_code == 401
        assert response.json()["detail"] == "Invalid credentials"


@pytest.mark.asyncio
async def test_access_protected_endpoint_without_token():
    """Test accessing protected endpoint without authentication token."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/api/products")
        assert response.status_code == 401
