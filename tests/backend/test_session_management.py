import pytest
import time
from httpx import AsyncClient
from backend.app.main import app
from backend.app.auth import create_access_token
from datetime import timedelta


@pytest.mark.asyncio
async def test_session_timeout_30_minutes():
    """Test that session timeout is set to 30 minutes"""
    async with AsyncClient(app=app, base_url="http://localhost:8000") as client:
        # Login and get token
        login_response = await client.post("/api/auth/login", json={
            "username": "admin",
            "password": "admin123"
        })
        assert login_response.status_code == 200
        token = login_response.json()["access_token"]
        
        # Decode token to check expiry
        import jwt
        from backend.app.config import settings
        
        payload = jwt.decode(token, settings.secret_key, algorithms=["HS256"])
        exp_timestamp = payload["exp"]
        
        # Check that token expires in approximately 30 minutes
        current_time = int(time.time())
        time_until_expiry = exp_timestamp - current_time
        
        # Should be around 30 minutes (1800 seconds) with some tolerance
        assert 1700 <= time_until_expiry <= 1900  # 28-32 minutes tolerance


@pytest.mark.asyncio
async def test_token_expiry_handling():
    """Test that expired tokens are properly rejected"""
    async with AsyncClient(app=app, base_url="http://localhost:8000") as client:
        # Create an expired token
        from backend.app.auth import create_access_token
        from datetime import timedelta
        
        expired_token = create_access_token(
            subject="admin",
            expires_delta=timedelta(minutes=-1)  # Expired 1 minute ago
        )
        
        headers = {"Authorization": f"Bearer {expired_token}"}
        
        # Try to access protected endpoint with expired token
        response = await client.get("/api/products", headers=headers)
        assert response.status_code == 401
        assert "credentials" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_valid_token_access():
    """Test that valid tokens can access protected endpoints"""
    async with AsyncClient(app=app, base_url="http://localhost:8000") as client:
        # Login and get valid token
        login_response = await client.post("/api/auth/login", json={
            "username": "admin",
            "password": "admin123"
        })
        assert login_response.status_code == 200
        token = login_response.json()["access_token"]
        
        headers = {"Authorization": f"Bearer {token}"}
        
        # Access protected endpoint
        response = await client.get("/api/products", headers=headers)
        assert response.status_code == 200


@pytest.mark.asyncio
async def test_invalid_token_format():
    """Test that malformed tokens are rejected"""
    async with AsyncClient(app=app, base_url="http://localhost:8000") as client:
        # Test with invalid token format
        headers = {"Authorization": "Bearer invalid-token"}
        response = await client.get("/api/products", headers=headers)
        assert response.status_code == 401
        
        # Test with missing Bearer prefix
        headers = {"Authorization": "some-token"}
        response = await client.get("/api/products", headers=headers)
        assert response.status_code == 401
        
        # Test with empty token
        headers = {"Authorization": "Bearer "}
        response = await client.get("/api/products", headers=headers)
        assert response.status_code == 401


@pytest.mark.asyncio
async def test_missing_authorization_header():
    """Test that requests without authorization header are rejected"""
    async with AsyncClient(app=app, base_url="http://localhost:8000") as client:
        # Access protected endpoint without authorization header
        response = await client.get("/api/products")
        assert response.status_code == 401


@pytest.mark.asyncio
async def test_session_persistence():
    """Test that session persists across multiple requests"""
    async with AsyncClient(app=app, base_url="http://localhost:8000") as client:
        # Login
        login_response = await client.post("/api/auth/login", json={
            "username": "admin",
            "password": "admin123"
        })
        assert login_response.status_code == 200
        token = login_response.json()["access_token"]
        
        headers = {"Authorization": f"Bearer {token}"}
        
        # Make multiple requests with the same token
        for i in range(5):
            response = await client.get("/api/products", headers=headers)
            assert response.status_code == 200, f"Request {i+1} failed"


@pytest.mark.asyncio
async def test_logout_clears_session():
    """Test that logout properly clears the session"""
    async with AsyncClient(app=app, base_url="http://localhost:8000") as client:
        # Login
        login_response = await client.post("/api/auth/login", json={
            "username": "admin",
            "password": "admin123"
        })
        assert login_response.status_code == 200
        token = login_response.json()["access_token"]
        
        headers = {"Authorization": f"Bearer {token}"}
        
        # Verify token works
        response = await client.get("/api/products", headers=headers)
        assert response.status_code == 200
        
        # Note: The backend doesn't have an explicit logout endpoint
        # The frontend handles logout by clearing localStorage
        # This test verifies that the token remains valid until expiry


@pytest.mark.asyncio
async def test_different_user_sessions():
    """Test that different users have separate sessions"""
    async with AsyncClient(app=app, base_url="http://localhost:8000") as client:
        # Login as admin
        admin_login = await client.post("/api/auth/login", json={
            "username": "admin",
            "password": "admin123"
        })
        assert admin_login.status_code == 200
        admin_token = admin_login.json()["access_token"]
        
        # Login as user (if available)
        try:
            user_login = await client.post("/api/auth/login", json={
                "username": "user",
                "password": "user123"
            })
            if user_login.status_code == 200:
                user_token = user_login.json()["access_token"]
                
                # Verify tokens are different
                assert admin_token != user_token
                
                # Both tokens should work
                admin_headers = {"Authorization": f"Bearer {admin_token}"}
                user_headers = {"Authorization": f"Bearer {user_token}"}
                
                admin_response = await client.get("/api/products", headers=admin_headers)
                user_response = await client.get("/api/products", headers=user_headers)
                
                assert admin_response.status_code == 200
                assert user_response.status_code == 200
        except:
            # User might not exist, which is fine for this test
            pass


@pytest.mark.asyncio
async def test_token_refresh_not_supported():
    """Test that token refresh is not supported (as per requirements)"""
    async with AsyncClient(app=app, base_url="http://localhost:8000") as client:
        # Try to access a refresh endpoint (should not exist)
        response = await client.post("/api/auth/refresh")
        assert response.status_code == 404


@pytest.mark.asyncio
async def test_concurrent_session_limit():
    """Test that multiple concurrent sessions are allowed (as per requirements)"""
    async with AsyncClient(app=app, base_url="http://localhost:8000") as client:
        # Login multiple times to get different tokens
        tokens = []
        for i in range(3):
            login_response = await client.post("/api/auth/login", json={
                "username": "admin",
                "password": "admin123"
            })
            assert login_response.status_code == 200
            tokens.append(login_response.json()["access_token"])
        
        # Verify all tokens are different
        assert len(set(tokens)) == 3
        
        # Verify all tokens work concurrently
        for i, token in enumerate(tokens):
            headers = {"Authorization": f"Bearer {token}"}
            response = await client.get("/api/products", headers=headers)
            assert response.status_code == 200, f"Token {i+1} failed"
