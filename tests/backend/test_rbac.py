from passlib.context import CryptContext
from backend.app.db import SessionLocal
from backend.app.models import Role, User
import pytest
from httpx import AsyncClient, ASGITransport


pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")


def ensure_sales_user():
    db = SessionLocal()
    try:
        sales_role = db.query(Role).filter_by(name="Sales").first()
        user = db.query(User).filter_by(username="sales").first()
        if not user:
            db.add(User(username="sales", password_hash=pwd.hash("sales123"), role_id=sales_role.id))
            db.commit()
    finally:
        db.close()


@pytest.mark.asyncio
async def test_product_write_requires_admin():
    from backend.app.main import app
    ensure_sales_user()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # login as sales
        login = await ac.post("/api/auth/login", json={"username": "sales", "password": "sales123"})
        token = login.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        # attempt create
        payload = {"name":"X","sku":"RBAC-1","hsn":"7308","uom":"NOS","gst_rate":18.0,"price":10.0}
        r = await ac.post("/api/products", json=payload, headers=headers)
        assert r.status_code == 403

