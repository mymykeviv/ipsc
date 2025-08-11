import pytest
from httpx import AsyncClient, ASGITransport


@pytest.mark.asyncio
async def test_email_invoice_stub():
    from backend.app.main import app
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        login = await ac.post("/api/auth/login", json={"username": "admin", "password": "admin123"})
        token = login.json()["access_token"]
        h = {"Authorization": f"Bearer {token}"}

        parties = (await ac.get('/api/parties', headers=h)).json()
        cust = next(p for p in parties if p['type'] == 'customer')
        prod = (await ac.get('/api/products', headers=h)).json()[0]
        inv = await ac.post('/api/invoices', json={
            'customer_id': cust['id'],
            'items': [{'product_id': prod['id'], 'qty': 1, 'rate': float(prod['price'])}],
        }, headers=h)
        inv_id = inv.json()['id']

        # send email (stubbed to 202)
        r = await ac.post(f'/api/invoices/{inv_id}/email', json={"to": "customer@example.com"}, headers=h)
        assert r.status_code == 202

