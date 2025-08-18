"""
Pytest configuration and fixtures for backend tests
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool

from fastapi import FastAPI
from app.routers import api

# Create a test app without running seed
app = FastAPI()
app.include_router(api, prefix="/api")
from app.models import Base, User, Party, Product, CompanySettings, Role
from app.auth import create_access_token


# Create in-memory SQLite database for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="session")
def db_engine():
    """Create database engine for testing"""
    Base.metadata.create_all(bind=engine)
    yield engine
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db_session(db_engine):
    """Create a new database session for a test"""
    connection = db_engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)
    
    yield session
    
    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture
def db(db_session):
    """Alias for db_session for backward compatibility"""
    return db_session


@pytest.fixture
def client(db_session, test_user):
    """Create a test client with database session"""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
    
    app.dependency_overrides = {}
    app.dependency_overrides[get_db] = override_get_db
    
    with TestClient(app) as test_client:
        yield test_client
    
    app.dependency_overrides.clear()


@pytest.fixture
def auth_headers(client, test_user):
    """Create authentication headers for testing"""
    # Login using the actual login endpoint
    login_data = {
        "username": "admin",
        "password": "admin123"
    }
    response = client.post("/api/auth/login", json=login_data)
    assert response.status_code == 200
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def test_role(db_session):
    """Create a test role"""
    role = Role(name="admin")
    db_session.add(role)
    db_session.commit()
    db_session.refresh(role)
    return role


@pytest.fixture
def test_user(db_session, test_role):
    """Create a test user"""
    from passlib.context import CryptContext
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    
    user = User(
        username="admin",
        password_hash=pwd_context.hash("admin123"),  # Properly hash the password
        role_id=test_role.id
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def test_customer(db_session):
    """Create a test customer"""
    customer = Party(
        name="Test Customer",
        type="customer",
        gstin="22AAAAA0000A1Z5",
        gst_enabled=True,
        contact_number="1234567890",
        email="customer@test.com",
        billing_address_line1="Test Address",
        billing_city="Test City",
        billing_state="Test State",
        billing_country="India"
    )
    db_session.add(customer)
    db_session.commit()
    db_session.refresh(customer)
    return customer


@pytest.fixture
def test_supplier(db_session):
    """Create a test supplier"""
    supplier = Party(
        name="Test Supplier",
        type="vendor",
        gstin="27AAAAA0000A1Z5",
        gst_enabled=True,
        contact_number="0987654321",
        email="supplier@test.com",
        billing_address_line1="Supplier Address",
        billing_city="Supplier City",
        billing_state="Supplier State",
        billing_country="India"
    )
    db_session.add(supplier)
    db_session.commit()
    db_session.refresh(supplier)
    return supplier


@pytest.fixture
def test_product(db_session):
    """Create a test product"""
    product = Product(
        name="Test Product",
        description="Test Description",
        category="Electronics",
        item_type="tradable",
        hsn="85171200",
        gst_rate=18.0,
        stock=100,
        purchase_price=500.0,
        sales_price=750.0,
        supplier="Test Supplier"
    )
    db_session.add(product)
    db_session.commit()
    db_session.refresh(product)
    return product


@pytest.fixture
def test_company_settings(db_session):
    """Create test company settings"""
    settings = CompanySettings(
        name="Test Company",
        gstin="22AAAAA0000A1Z5",
        state="Test State",
        state_code="TS",
        invoice_series="TEST",
        gst_enabled_by_default=True,
        require_gstin_validation=True
    )
    db_session.add(settings)
    db_session.commit()
    db_session.refresh(settings)
    return settings


# Import the get_db function from the app
from app.db import get_db
