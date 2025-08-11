import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_health_endpoint():
    from backend.app.main import app

    async with AsyncClient(app=app, base_url="http://test") as ac:
        response = await ac.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

