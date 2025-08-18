import pytest
from fastapi.testclient import TestClient
from app.auth import create_access_token, verify_password, get_password_hash
from app.models import User, Role


class TestAuthentication:
    """Test authentication functionality"""
    
    def test_password_hashing(self):
        """Test password hashing and verification"""
        password = "testpassword123"
        hashed = get_password_hash(password)
        
        assert hashed != password
        assert verify_password(password, hashed)
        assert not verify_password("wrongpassword", hashed)
    
    def test_create_access_token(self):
        """Test JWT token creation"""
        user_data = {"sub": "testuser", "role": "admin"}
        token = create_access_token(user_data)
        
        assert isinstance(token, str)
        assert len(token) > 0
    
    def test_login_success(self, client, db_session):
        """Test successful login"""
        # Create test user
        role = Role(name="admin")
        db_session.add(role)
        db_session.commit()
        
        user = User(
            username="testuser",
            password_hash=get_password_hash("testpass123"),
            role_id=role.id
        )
        db_session.add(user)
        db_session.commit()
        
        # Test login
        response = client.post("/api/auth/login", json={
            "username": "testuser",
            "password": "testpass123"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "token_type" in data
        assert data["token_type"] == "bearer"
    
    def test_login_invalid_credentials(self, client):
        """Test login with invalid credentials"""
        response = client.post("/api/auth/login", json={
            "username": "nonexistent",
            "password": "wrongpass"
        })
        
        assert response.status_code == 401
        data = response.json()
        assert "detail" in data
    
    def test_login_missing_fields(self, client):
        """Test login with missing fields"""
        response = client.post("/api/auth/login", json={
            "username": "testuser"
            # Missing password
        })
        
        assert response.status_code == 422
    
    def test_protected_endpoint_without_token(self, client):
        """Test accessing protected endpoint without token"""
        response = client.get("/api/users/me")
        
        assert response.status_code == 401
    
    def test_protected_endpoint_with_invalid_token(self, client):
        """Test accessing protected endpoint with invalid token"""
        response = client.get(
            "/api/users/me",
            headers={"Authorization": "Bearer invalid-token"}
        )
        
        assert response.status_code == 401
    
    def test_protected_endpoint_with_valid_token(self, client, db_session):
        """Test accessing protected endpoint with valid token"""
        # Create test user and get token
        role = Role(name="admin")
        db_session.add(role)
        db_session.commit()
        
        user = User(
            username="testuser",
            password_hash=get_password_hash("testpass123"),
            role_id=role.id
        )
        db_session.add(user)
        db_session.commit()
        
        # Login to get token
        login_response = client.post("/api/auth/login", json={
            "username": "testuser",
            "password": "testpass123"
        })
        token = login_response.json()["access_token"]
        
        # Test protected endpoint
        response = client.get(
            "/api/users/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["username"] == "testuser"


class TestUserRegistration:
    """Test user registration functionality"""
    
    def test_register_success(self, client, db_session):
        """Test successful user registration"""
        response = client.post("/api/auth/register", json={
            "username": "newuser",
            "email": "newuser@example.com",
            "password": "newpass123",
            "full_name": "New User"
        })
        
        assert response.status_code == 201
        data = response.json()
        assert data["username"] == "newuser"
        assert data["email"] == "newuser@example.com"
        assert "password" not in data  # Password should not be returned
    
    def test_register_duplicate_username(self, client, db_session):
        """Test registration with duplicate username"""
        # Create existing user
        role = Role(name="user")
        db_session.add(role)
        db_session.commit()
        
        user = User(
            username="existinguser",
            password_hash=get_password_hash("pass123"),
            role_id=role.id
        )
        db_session.add(user)
        db_session.commit()
        
        # Try to register with same username
        response = client.post("/api/auth/register", json={
            "username": "existinguser",
            "email": "different@example.com",
            "password": "newpass123",
            "full_name": "Different User"
        })
        
        assert response.status_code == 400
        data = response.json()
        assert "username" in data["detail"].lower()
    
    def test_register_invalid_email(self, client):
        """Test registration with invalid email"""
        response = client.post("/api/auth/register", json={
            "username": "testuser",
            "email": "invalid-email",
            "password": "pass123",
            "full_name": "Test User"
        })
        
        assert response.status_code == 422
    
    def test_register_weak_password(self, client):
        """Test registration with weak password"""
        response = client.post("/api/auth/register", json={
            "username": "testuser",
            "email": "test@example.com",
            "password": "123",  # Too short
            "full_name": "Test User"
        })
        
        assert response.status_code == 422
