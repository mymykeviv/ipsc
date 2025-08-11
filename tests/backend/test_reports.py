import pytest
from httpx import AsyncClient, ASGITransport
from datetime import date


@pytest.mark.asyncio
async def test_gst_report_json_and_csv():
    from backend.app.main import app
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # login
        login = await ac.post("/api/auth/login", json={"username": "admin", "password": "admin123"})
        token = login.json()["access_token"]
        h = {"Authorization": f"Bearer {token}"}

        # ensure at least one invoice exists
        parties = await ac.get('/api/parties', headers=h)
        cust = [p for p in parties.json() if p['type'] == 'customer'][0]
        products = await ac.get('/api/products', headers=h)
        prod = products.json()[0]
        await ac.post('/api/invoices', json={
            'customer_id': cust['id'],
            'items': [{'product_id': prod['id'], 'qty': 1, 'rate': float(prod['price'])}],
        }, headers=h)

        frm = date.today().replace(day=1).isoformat()
        to = date.today().isoformat()

        r = await ac.get(f"/api/reports/gst-summary?from={frm}&to={to}", headers=h)
        assert r.status_code == 200
        data = r.json()
        assert 'taxable_value' in data and 'grand_total' in data and 'rate_breakup' in data
        assert isinstance(data['rate_breakup'], list)

        c = await ac.get(f"/api/reports/gst-summary.csv?from={frm}&to={to}", headers=h)
        assert c.status_code == 200
        assert c.headers['content-type'].startswith('text/csv')

