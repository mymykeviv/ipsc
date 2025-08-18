"""
Pytest configuration and fixtures for backend tests
"""
import pytest
import asyncio
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
import os
import sys

# Add the app directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app.main import create_app
from app.db import Base, get_db
from app.config import TestingSettings
import os


# Test database configuration
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="session")
def test_settings():
    """Test settings fixture"""
    return TestingSettings()


@pytest.fixture(scope="function")
def db_session():
    """Create a fresh database session for each test"""
    # Create tables
    Base.metadata.create_all(bind=engine)
    
    # Create session
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        # Drop tables after test
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db_session):
    """Create a test client with a fresh database"""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
    
    # Set testing environment
    os.environ["ENVIRONMENT"] = "testing"
    app = create_app()
    app.dependency_overrides[get_db] = override_get_db
    
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def auth_headers():
    """Authentication headers for testing"""
    return {"Authorization": "Bearer test-token"}


@pytest.fixture
def sample_user_data():
    """Sample user data for testing"""
    return {
        "username": "testuser",
        "email": "test@example.com",
        "password": "testpassword123",
        "full_name": "Test User"
    }


@pytest.fixture
def sample_invoice_data():
    """Sample invoice data for testing"""
    return {
        "customer_name": "Test Customer",
        "customer_email": "customer@example.com",
        "customer_phone": "+1234567890",
        "customer_address": "123 Test St, Test City",
        "invoice_date": "2024-01-01",
        "due_date": "2024-01-31",
        "items": [
            {
                "description": "Test Item 1",
                "quantity": 2,
                "unit_price": 100.00,
                "tax_rate": 10.0
            }
        ],
        "notes": "Test invoice notes"
    }


@pytest.fixture
def sample_product_data():
    """Sample product data for testing"""
    return {
        "name": "Test Product",
        "description": "Test product description",
        "category": "Test Category",
        "unit_price": 100.00,
        "cost_price": 80.00,
        "stock_quantity": 50,
        "sku": "TEST001",
        "barcode": "1234567890123"
    }


@pytest.fixture
def sample_payment_data():
    """Sample payment data for testing"""
    return {
        "invoice_id": 1,
        "amount": 100.00,
        "payment_date": "2024-01-15",
        "payment_method": "cash",
        "reference_number": "PAY001",
        "notes": "Test payment"
    }


@pytest.fixture
def sample_stock_adjustment_data():
    """Sample stock adjustment data for testing"""
    return {
        "product_id": 1,
        "adjustment_type": "in",
        "quantity": 10,
        "reason": "Initial stock",
        "adjustment_date": "2024-01-01",
        "notes": "Test stock adjustment"
    }
