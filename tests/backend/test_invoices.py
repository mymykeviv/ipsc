import pytest
from httpx import AsyncClient, ASGITransport


@pytest.mark.asyncio
async def test_create_invoice_b2b_intra_state():
    from backend.app.main import app
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # login
        login = await ac.post("/api/auth/login", json={"username": "admin", "password": "admin123"})
        token = login.json()["access_token"]
        h = {"Authorization": f"Bearer {token}"}

        # pick a customer and products
        parties = await ac.get('/api/parties', headers=h)
        cust = [p for p in parties.json() if p['type'] == 'customer' and p['gstin']][0]
        products = await ac.get('/api/products', headers=h)
        prod = products.json()[0]

        payload = {
            "customer_id": cust['id'],
            "date": "2024-01-15",
            "place_of_supply": cust.get('billing_state', 'Maharashtra'),
            "place_of_supply_state_code": "27",  # Maharashtra
            "bill_to_address": f"{cust.get('billing_address_line1', 'Test Address')}, {cust.get('billing_city', 'Mumbai')}",
            "ship_to_address": f"{cust.get('shipping_address_line1', cust.get('billing_address_line1', 'Test Address'))}, {cust.get('shipping_city', cust.get('billing_city', 'Mumbai'))}",
            "items": [
                {"product_id": prod['id'], "qty": 2, "rate": float(prod['sales_price']), "discount": 0, "discount_type": "Percentage"}
            ]
        }

        r = await ac.post('/api/invoices', json=payload, headers=h)
        assert r.status_code == 201, r.text
        inv = r.json()
        assert inv['taxable_value'] > 0
        assert (inv['cgst'] + inv['sgst'] > 0) or inv['igst'] > 0
        pdf = await ac.get(f"/api/invoices/{inv['id']}/pdf", headers=h)
        assert pdf.status_code == 200
        assert pdf.headers['content-type'] == 'application/pdf'

