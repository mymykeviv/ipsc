"""
Shared test fixtures for backend tests
"""
import pytest
import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session
from backend.app.db import Base
from fastapi.testclient import TestClient
from backend.app.main import create_app
from backend.app.db import get_db
from fastapi import Depends
from sqlalchemy.engine.url import make_url

# Optional test seed import (may not exist in some environments)
try:
    from backend.app.test_seed import run_test_seed, clear_test_data  # type: ignore
except Exception:
    run_test_seed = None  # type: ignore
    clear_test_data = None  # type: ignore

# Use PostgreSQL for tests (as in app). Allow override via TEST_DATABASE_URL.
TEST_DATABASE_URL = os.getenv(
    "TEST_DATABASE_URL",
    "postgresql+psycopg://postgres:postgres@localhost:5432/profitpath_test",
)

# Create test database engine
def ensure_test_database(database_url: str):
    """Create the Postgres test database if it doesn't exist."""
    url = make_url(database_url)
    db_name = url.database
    # Connect to default 'postgres' DB
    server_url = url.set(database="postgres")
    server_engine = create_engine(server_url, echo=False)
    try:
        with server_engine.connect().execution_options(isolation_level="AUTOCOMMIT") as conn:
            # Try create DB; if exists, ignore error
            try:
                conn.execute(text(f'CREATE DATABASE "{db_name}"'))
            except Exception as e:
                # Likely already exists or insufficient permissions; ignore if exists
                if "already exists" not in str(e):
                    raise
    finally:
        server_engine.dispose()

ensure_test_database(TEST_DATABASE_URL)

test_engine = create_engine(
    TEST_DATABASE_URL,
    echo=False,
)
TestingSessionLocal = sessionmaker(bind=test_engine, autoflush=False, autocommit=False)

@pytest.fixture(scope="session", autouse=True)
def setup_db_schema():
    """Create all tables once for the test session."""
    Base.metadata.create_all(bind=test_engine)
    yield

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
    os.environ["ENVIRONMENT"] = "testing"
    
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
        # Optionally reseed if a global seed function exists
        if callable(run_test_seed):
            try:
                run_test_seed()  # type: ignore
            except Exception as e:
                print(f"Warning: Test seed data could not be loaded: {e}")
