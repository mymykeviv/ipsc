import pytest
from httpx import AsyncClient, ASGITransport


@pytest.mark.asyncio
async def test_list_products_requires_auth():
    async with AsyncClient(base_url="http://localhost:8000") as ac:
        r = await ac.get("/api/products")
        assert r.status_code == 401


@pytest.mark.asyncio
async def test_list_products_with_token():
    async with AsyncClient(base_url="http://localhost:8000") as ac:
        login = await ac.post("/api/auth/login", json={"username": "admin", "password": "admin123"})
        print(f"Login response: {login.text}")
        token = login.json()["access_token"]
        r = await ac.get("/api/products", headers={"Authorization": f"Bearer {token}"})
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        assert len(data) >= 2


@pytest.mark.asyncio
async def test_create_update_delete_product():
    async with AsyncClient(base_url="http://localhost:8000") as ac:
        login = await ac.post("/api/auth/login", json={"username": "admin", "password": "admin123"})
        token = login.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # create
        payload = {
            "name": "Test Widget",
            "description": "Test product for testing",
            "sku": "TWD-001",
            "hsn": "8409",
            "unit": "NOS",
            "gst_rate": 18.0,
            "sales_price": 99.0,
            "purchase_price": 80.0,
            "stock": 0,
            "supplier": "Test Supplier",
            "category": "Test Category"
        }
        r = await ac.post("/api/products", json=payload, headers=headers)
        assert r.status_code == 201, r.text
        created = r.json()
        assert created["sku"] == "TWD-001"

        pid = created["id"]

        # update
        upd = await ac.put(f"/api/products/{pid}", json={"sales_price": 125.0}, headers=headers)
        assert upd.status_code == 200
        assert upd.json()["sales_price"] == 125.0

        # toggle product (instead of delete)
        toggle = await ac.patch(f"/api/products/{pid}/toggle", headers=headers)
        assert toggle.status_code == 200
        assert toggle.json()["is_active"] == False

