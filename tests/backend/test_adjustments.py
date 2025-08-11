import pytest
from httpx import AsyncClient, ASGITransport


@pytest.mark.asyncio
async def test_manual_stock_adjustment():
    from backend.app.main import app
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        login = await ac.post("/api/auth/login", json={"username": "admin", "password": "admin123"})
        token = login.json()["access_token"]
        h = {"Authorization": f"Bearer {token}"}

        prod = (await ac.get('/api/products', headers=h)).json()[0]
        before = (await ac.get('/api/stock/summary', headers=h)).json()
        before_onhand = next(x['onhand'] for x in before if x['product_id'] == prod['id'])

        r = await ac.post('/api/stock/adjust', json={"product_id": prod['id'], "delta": 5}, headers=h)
        assert r.status_code == 201

        after = (await ac.get('/api/stock/summary', headers=h)).json()
        after_onhand = next(x['onhand'] for x in after if x['product_id'] == prod['id'])
        assert after_onhand == pytest.approx(before_onhand + 5)

