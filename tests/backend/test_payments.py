import pytest
from httpx import AsyncClient, ASGITransport


@pytest.mark.asyncio
async def test_invoice_payments_flow():
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
        assert inv.status_code == 201
        inv_id = inv.json()['id']

        # create payment
        pay = await ac.post(f'/api/invoices/{inv_id}/payments', json={
            'amount': 50.0,
            'method': 'UPI',
            'head': 'Bank'
        }, headers=h)
        assert pay.status_code == 201

        # list payments and outstanding
        lst = await ac.get(f'/api/invoices/{inv_id}/payments', headers=h)
        assert lst.status_code == 200
        data = lst.json()
        assert data['total_paid'] >= 50.0
        assert data['outstanding'] >= 0.0

