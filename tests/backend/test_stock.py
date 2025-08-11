import pytest
from httpx import AsyncClient, ASGITransport


@pytest.mark.asyncio
async def test_stock_summary_changes_with_invoice_and_purchase():
    from backend.app.main import app
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # login
        login = await ac.post("/api/auth/login", json={"username": "admin", "password": "admin123"})
        token = login.json()["access_token"]
        h = {"Authorization": f"Bearer {token}"}

        # select a product and a customer/vendor
        products = (await ac.get('/api/products', headers=h)).json()
        prod = products[0]
        parties = (await ac.get('/api/parties', headers=h)).json()
        customer = next(p for p in parties if p['type'] == 'customer')
        vendor = next(p for p in parties if p['type'] == 'vendor')

        before = (await ac.get('/api/stock/summary', headers=h)).json()
        before_onhand = next(x['onhand'] for x in before if x['product_id'] == prod['id'])

        # create invoice (out)
        qty = 2
        await ac.post('/api/invoices', json={
            'customer_id': customer['id'],
            'items': [{'product_id': prod['id'], 'qty': qty, 'rate': float(prod['price'])}],
        }, headers=h)

        after_inv = (await ac.get('/api/stock/summary', headers=h)).json()
        after_inv_onhand = next(x['onhand'] for x in after_inv if x['product_id'] == prod['id'])
        assert after_inv_onhand == pytest.approx(before_onhand - qty)

        # create purchase (in)
        qty_in = 3
        p = await ac.post('/api/purchases', json={
            'vendor_id': vendor['id'],
            'items': [{'product_id': prod['id'], 'qty': qty_in, 'rate': float(prod['price'])}],
        }, headers=h)
        assert p.status_code == 201

        after_pur = (await ac.get('/api/stock/summary', headers=h)).json()
        after_pur_onhand = next(x['onhand'] for x in after_pur if x['product_id'] == prod['id'])
        assert after_pur_onhand == pytest.approx(after_inv_onhand + qty_in)

