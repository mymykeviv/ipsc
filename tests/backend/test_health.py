import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_health_endpoint():
    from backend.app.main import app

    async with AsyncClient(app=app, base_url="http://test") as ac:
        response = await ac.get("/health")

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "version" in data
    assert "build_date" in data
    assert "environment" in data
    assert "multi_tenant_enabled" in data
    assert "security_enabled" in data
    assert "database_optimization_enabled" in data

