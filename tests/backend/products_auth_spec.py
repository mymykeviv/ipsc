import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from backend.app.models import Role, User, Tenant
from backend.app.auth import get_password_hash
from backend.app.db import Base


def seed_roles_users(db: Session):
    # Roles (get or create)
    def get_or_create_role(name: str) -> Role:
        role = db.query(Role).filter(Role.name == name).first()
        if role:
            return role
        role = Role(name=name)
        db.add(role)
        db.flush()
        return role

    admin_role = get_or_create_role("Admin")
    store_role = get_or_create_role("Store")
    sales_role = get_or_create_role("Sales")

    # Tenant (get or create)
    tenant = db.query(Tenant).filter(Tenant.slug == "default").first()
    if not tenant:
        tenant = Tenant(name="Default Organization", slug="default", is_active=True, is_trial=False)
        db.add(tenant)
        db.flush()

    # Users (get or create by username)
    def ensure_user(username: str, password: str, role_id: int):
        user = db.query(User).filter(User.username == username).first()
        if user:
            return user
        user = User(
            username=username,
            password_hash=get_password_hash(password),
            role_id=role_id,
            tenant_id=tenant.id,
        )
        db.add(user)
        return user

    ensure_user("admin", "adminpass", admin_role.id)
    ensure_user("store", "storepass", store_role.id)
    ensure_user("sales", "salespass", sales_role.id)
    db.commit()


def login(client: TestClient, username: str, password: str) -> str:
    resp = client.post(
        "/api/auth/login",
        json={"username": username, "password": password},
    )
    assert resp.status_code == 200, resp.text
    data = resp.json()
    # Backend issues a raw token string? Many apps return {access_token, token_type}
    # Inspect common patterns; if it's a raw string, use it; otherwise get data["access_token"].
    if isinstance(data, dict) and "access_token" in data:
        return data["access_token"]
    if isinstance(data, str):
        return data
    pytest.fail(f"Unexpected login response: {data}")


def product_payload(name: str = "Spec Product"):
    return {
        "name": name,
        "item_type": "tradable",
        "sales_price": 100,
        "unit": "Pcs",
    }


@pytest.fixture(autouse=True)
def setup_seed(db: Session):
    # Ensure schema exists for this test function via conftest; then seed roles/users
    # Create all tables for the bound engine if not present
    Base.metadata.create_all(bind=db.get_bind())
    seed_roles_users(db)


def test_admin_can_create_product(client: TestClient):
    token = login(client, "admin", "adminpass")
    resp = client.post(
        "/api/products",
        headers={"Authorization": f"Bearer {token}"},
        json=product_payload("Admin Product"),
    )
    assert resp.status_code == 201, resp.text
    body = resp.json()
    assert body["name"] == "Admin Product"


def test_store_can_create_product(client: TestClient):
    token = login(client, "store", "storepass")
    resp = client.post(
        "/api/products",
        headers={"Authorization": f"Bearer {token}"},
        json=product_payload("Store Product"),
    )
    assert resp.status_code == 201, resp.text
    body = resp.json()
    assert body["name"] == "Store Product"


def test_sales_cannot_create_product(client: TestClient):
    token = login(client, "sales", "salespass")
    resp = client.post(
        "/api/products",
        headers={"Authorization": f"Bearer {token}"},
        json=product_payload("Sales Product"),
    )
    assert resp.status_code == 403, resp.text


def test_unauthenticated_cannot_create_product(client: TestClient):
    resp = client.post(
        "/api/products",
        json=product_payload("No Auth Product"),
    )
    assert resp.status_code == 401, resp.text
