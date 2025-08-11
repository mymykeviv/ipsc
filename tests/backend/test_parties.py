import pytest
from httpx import AsyncClient, ASGITransport


@pytest.mark.asyncio
async def test_parties_crud():
    from backend.app.main import app
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        login = await ac.post("/api/auth/login", json={"username": "admin", "password": "admin123"})
        token = login.json()["access_token"]
        h = {"Authorization": f"Bearer {token}"}

        # list existing
        r = await ac.get('/api/parties', headers=h)
        assert r.status_code == 200
        base_count = len(r.json())

        # create
        payload = {"type":"customer","name":"Test Customer","gstin":None,"state":"Karnataka"}
        c = await ac.post('/api/parties', json=payload, headers=h)
        assert c.status_code == 201
        pid = c.json()['id']

        # update
        u = await ac.put(f'/api/parties/{pid}', json={"name":"Updated Customer"}, headers=h)
        assert u.status_code == 200
        assert u.json()['name'] == 'Updated Customer'

        # delete
        d = await ac.delete(f'/api/parties/{pid}', headers=h)
        assert d.status_code == 204

        # confirm list size restored
        r2 = await ac.get('/api/parties', headers=h)
        assert len(r2.json()) == base_count

