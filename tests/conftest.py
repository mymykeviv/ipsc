"""
Shared test fixtures for backend tests
"""
import pytest
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from backend.app.db import Base
from backend.app.seed import run_seed
from fastapi.testclient import TestClient
from backend.app.main import create_app
from backend.app.db import get_db
from fastapi import Depends

# Use in-memory database for tests
TEST_DATABASE_URL = "sqlite:///:memory:"

# Create test database engine
test_engine = create_engine(TEST_DATABASE_URL, echo=False)
TestingSessionLocal = sessionmaker(bind=test_engine, autoflush=False, autocommit=False)

def get_test_db():
    """Test database dependency"""
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

@pytest.fixture(scope="session")
def test_app():
    """Create a test app with in-memory database"""
    # Set testing environment
    os.environ["TESTING"] = "1"
    
    # Create app with test engine
    app = create_app(database_engine=test_engine)
    
    # Override the database dependency for testing
    app.dependency_overrides[get_db] = get_test_db
    
    return app

@pytest.fixture
def client(test_app):
    """Create a test client"""
    return TestClient(test_app)

@pytest.fixture(scope="function")
def db():
    """Create a fresh database session for each test"""
    # Create session
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        # Clean up tables after each test
        Base.metadata.drop_all(bind=test_engine)
        # Recreate tables for next test
        Base.metadata.create_all(bind=test_engine)
        run_seed()
