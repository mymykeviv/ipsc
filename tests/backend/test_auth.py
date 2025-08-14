import pytest
from httpx import AsyncClient, ASGITransport


@pytest.mark.asyncio
async def test_login_returns_token(test_app):
    transport = ASGITransport(app=test_app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.post("/api/auth/login", json={"username": "admin", "password": "admin123"})
        assert resp.status_code == 200, resp.text
        data = resp.json()
        assert "access_token" in data and data["token_type"] == "bearer"

