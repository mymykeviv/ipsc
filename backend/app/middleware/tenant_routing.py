"""
Enhanced Multi-Tenant Routing Middleware
Handles tenant routing, authentication, and data isolation
"""

import re
import logging
from typing import Optional, Dict, Any
from fastapi import Request, HTTPException, Response, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from ..db import get_db
from ..tenant_service import tenant_service
from ..models import Tenant, TenantUser, User
from ..config import is_public_endpoint, get_required_feature
from ..utils.error_handling import (
    create_unauthorized_response,
    create_not_found_response,
    create_forbidden_response,
    handle_api_error
)
from datetime import datetime

logger = logging.getLogger(__name__)


class TenantRoutingMiddleware:
    """Enhanced middleware for tenant routing and context management"""
    
    def __init__(self, app=None):  # Fixed: Added app parameter for ASGI compliance
        self.app = app
        self.subdomain_pattern = re.compile(r'^([^.]+)\.')
        self.logger = logging.getLogger(__name__)
    
    async def __call__(self, scope, receive, send):
        """ASGI-compliant middleware call"""
        if scope["type"] != "http":
            if self.app:
                await self.app(scope, receive, send)
            return
        
        request = Request(scope, receive)
        await self.process_request(request, scope, receive, send)
    
    async def process_request(self, request: Request, scope, receive, send):
        """Process the request with tenant routing logic"""
        try:
            # Extract tenant ID from various sources
            tenant_id = await self.extract_tenant_id(request)
            
            if not tenant_id:
                # For non-tenant-specific endpoints (health check, etc.)
                if is_public_endpoint(request.url.path):
                    if self.app:
                        await self.app(scope, receive, send)
                    return
                else:
                    response = create_unauthorized_response("Tenant ID required")
                    await response(scope, receive, send)
                    return
            
            # Get database session
            db = next(get_db())
            
            # Validate tenant exists and is active
            tenant = tenant_service.get_tenant_by_slug(db, tenant_id)
            if not tenant:
                response = create_not_found_response("Tenant", tenant_id)
                await response(scope, receive, send)
                return
            
            if not tenant.is_active:
                response = create_forbidden_response(f"Tenant '{tenant_id}' is not active")
                await response(scope, receive, send)
                return
            
            # Check if tenant is in trial and trial has expired
            if tenant.is_trial and tenant.trial_end_date and tenant.trial_end_date < datetime.utcnow():
                response = create_forbidden_response(f"Trial period for tenant '{tenant_id}' has expired")
                await response(scope, receive, send)
                return
            
            # Set tenant context
            request.state.tenant_id = tenant.id
            request.state.tenant_slug = tenant.slug
            request.state.tenant = tenant
            
            # Continue with request processing
            if self.app:
                await self.app(scope, receive, send)
            
        except Exception as e:
            self.logger.error(f"Tenant routing middleware error: {e}")
            response = handle_api_error(e)
            await response(scope, receive, send)
    
    async def extract_tenant_id(self, request: Request) -> Optional[str]:
        """Extract tenant ID from request"""
        # Method 1: Extract from subdomain
        host = request.headers.get("host", "")
        if "." in host:
            subdomain_match = self.subdomain_pattern.match(host)
            if subdomain_match:
                tenant_id = subdomain_match.group(1)
                if tenant_id not in ["www", "api", "localhost", "127", "0"]:
                    return tenant_id
        
        # Method 2: Extract from X-Tenant-ID header
        tenant_id = request.headers.get("X-Tenant-ID")
        if tenant_id:
            return tenant_id
        
        # Method 3: Extract from X-Tenant-Slug header
        tenant_slug = request.headers.get("X-Tenant-Slug")
        if tenant_slug:
            return tenant_slug
        
        # Method 4: Extract from query parameter (for development/testing)
        tenant_id = request.query_params.get("tenant_id")
        if tenant_id:
            return tenant_id
        
        # Method 5: Extract from path parameter (for API routes)
        path_parts = request.url.path.split('/')
        if len(path_parts) > 2 and path_parts[1] == 'api':
            potential_tenant = path_parts[2]
            if re.match(r'^[a-z0-9-]+$', potential_tenant):
                return potential_tenant
        
        return None


class TenantDataIsolationMiddleware:
    """Middleware for ensuring data isolation between tenants"""
    
    def __init__(self, app=None):  # Fixed: Added app parameter for ASGI compliance
        self.app = app
        self.logger = logging.getLogger(__name__)
    
    async def __call__(self, scope, receive, send):
        """ASGI-compliant middleware call"""
        if scope["type"] != "http":
            if self.app:
                await self.app(scope, receive, send)
            return
        
        request = Request(scope, receive)
        await self.process_request(request, scope, receive, send)
    
    async def process_request(self, request: Request, scope, receive, send):
        """Process the request with data isolation logic"""
        try:
            # Skip for public endpoints
            if is_public_endpoint(request.url.path):
                if self.app:
                    await self.app(scope, receive, send)
                return
            
            # Get tenant context
            tenant_id = getattr(request.state, 'tenant_id', None)
            if not tenant_id:
                if self.app:
                    await self.app(scope, receive, send)
                return
            
            # For GET requests, ensure tenant_id is added to query filters
            if request.method == "GET":
                # This will be handled by the service layer
                pass
            
            # For POST/PUT/DELETE requests, ensure tenant_id is set
            if request.method in ["POST", "PUT", "PATCH", "DELETE"]:
                # The tenant_id will be set in the service layer
                pass
            
            if self.app:
                await self.app(scope, receive, send)
            
        except Exception as e:
            self.logger.error(f"Tenant data isolation middleware error: {e}")
            if self.app:
                await self.app(scope, receive, send)


class TenantFeatureAccessMiddleware:
    """Middleware for feature access control based on tenant settings"""
    
    def __init__(self, app=None):  # Fixed: Added app parameter for ASGI compliance
        self.app = app
        self.logger = logging.getLogger(__name__)
    
    async def __call__(self, scope, receive, send):
        """ASGI-compliant middleware call"""
        if scope["type"] != "http":
            if self.app:
                await self.app(scope, receive, send)
            return
        
        request = Request(scope, receive)
        await self.process_request(request, scope, receive, send)
    
    async def process_request(self, request: Request, scope, receive, send):
        """Process the request with feature access control"""
        try:
            # Skip for public endpoints
            if is_public_endpoint(request.url.path):
                if self.app:
                    await self.app(scope, receive, send)
                return
            
            # Get tenant context
            tenant = getattr(request.state, 'tenant', None)
            if not tenant:
                if self.app:
                    await self.app(scope, receive, send)
                return
            
            # Check if path requires feature access
            required_feature = get_required_feature(request.url.path)
            if required_feature:
                # Check tenant settings for feature access
                db = next(get_db())
                feature_enabled = tenant_service.get_tenant_setting(
                    db, tenant.id, "features", required_feature
                )
                
                if not feature_enabled or feature_enabled.lower() != "true":
                    response = create_forbidden_response(
                        f"Feature '{required_feature}' is not available for this tenant",
                        required_feature
                    )
                    await response(scope, receive, send)
                    return
            
            if self.app:
                await self.app(scope, receive, send)
            
        except Exception as e:
            self.logger.error(f"Tenant feature access middleware error: {e}")
            if self.app:
                await self.app(scope, receive, send)


# ASGI-compliant middleware functions for FastAPI
async def tenant_routing_middleware(request: Request, call_next):
    """ASGI-compliant middleware function for tenant routing"""
    try:
        # Extract tenant ID from various sources
        tenant_id = await extract_tenant_id(request)
        
        if not tenant_id:
            # For non-tenant-specific endpoints (health check, etc.)
            if is_public_endpoint(request.url.path):
                return await call_next(request)
            else:
                return create_unauthorized_response("Tenant ID required")
        
        # Get database session
        db = next(get_db())
        
        # Validate tenant exists and is active
        tenant = tenant_service.get_tenant_by_slug(db, tenant_id)
        if not tenant:
            return create_not_found_response("Tenant", tenant_id)
        
        if not tenant.is_active:
            return create_forbidden_response(f"Tenant '{tenant_id}' is not active")
        
        # Check if tenant is in trial and trial has expired
        if tenant.is_trial and tenant.trial_end_date and tenant.trial_end_date < datetime.utcnow():
            return create_forbidden_response(f"Trial period for tenant '{tenant_id}' has expired")
        
        # Set tenant context
        request.state.tenant_id = tenant.id
        request.state.tenant_slug = tenant.slug
        request.state.tenant = tenant
        
        # Continue with request processing
        response = await call_next(request)
        
        # Add tenant info to response headers
        response.headers["X-Tenant-ID"] = str(tenant.id)
        response.headers["X-Tenant-Slug"] = tenant.slug
        response.headers["X-Tenant-Name"] = tenant.name
        
        return response
        
    except Exception as e:
        logger.error(f"Tenant routing middleware error: {e}")
        return handle_api_error(e)

async def tenant_feature_access_middleware(request: Request, call_next):
    """ASGI-compliant middleware function for feature access"""
    try:
        # Skip for public endpoints
        if is_public_endpoint(request.url.path):
            return await call_next(request)
        
        # Get tenant context
        tenant = getattr(request.state, 'tenant', None)
        if not tenant:
            return await call_next(request)
        
        # Check if path requires feature access
        required_feature = get_required_feature(request.url.path)
        if required_feature:
            # Check tenant settings for feature access
            db = next(get_db())
            feature_enabled = tenant_service.get_tenant_setting(
                db, tenant.id, "features", required_feature
            )
            
            if not feature_enabled or feature_enabled.lower() != "true":
                return create_forbidden_response(
                    f"Feature '{required_feature}' is not available for this tenant",
                    required_feature
                )
        
        return await call_next(request)
        
    except Exception as e:
        logger.error(f"Tenant feature access middleware error: {e}")
        return await call_next(request)

async def tenant_data_isolation_middleware(request: Request, call_next):
    """ASGI-compliant middleware function for data isolation"""
    try:
        # Skip for public endpoints
        if is_public_endpoint(request.url.path):
            return await call_next(request)
        
        # Get tenant context
        tenant_id = getattr(request.state, 'tenant_id', None)
        if not tenant_id:
            return await call_next(request)
        
        # For GET requests, ensure tenant_id is added to query filters
        if request.method == "GET":
            # This will be handled by the service layer
            pass
        
        # For POST/PUT/DELETE requests, ensure tenant_id is set
        if request.method in ["POST", "PUT", "PATCH", "DELETE"]:
            # The tenant_id will be set in the service layer
            pass
        
        return await call_next(request)
        
    except Exception as e:
        logger.error(f"Tenant data isolation middleware error: {e}")
        return await call_next(request)


# Helper functions for middleware
async def extract_tenant_id(request: Request) -> Optional[str]:
    """Extract tenant ID from request"""
    subdomain_pattern = re.compile(r'^([^.]+)\.')
    
    # Method 1: Extract from subdomain
    host = request.headers.get("host", "")
    if "." in host:
        subdomain_match = subdomain_pattern.match(host)
        if subdomain_match:
            tenant_id = subdomain_match.group(1)
            if tenant_id not in ["www", "api", "localhost", "127", "0"]:
                return tenant_id
    
    # Method 2: Extract from X-Tenant-ID header
    tenant_id = request.headers.get("X-Tenant-ID")
    if tenant_id:
        return tenant_id
    
    # Method 3: Extract from X-Tenant-Slug header
    tenant_slug = request.headers.get("X-Tenant-Slug")
    if tenant_slug:
        return tenant_slug
    
    # Method 4: Extract from query parameter (for development/testing)
    tenant_id = request.query_params.get("tenant_id")
    if tenant_id:
        return tenant_id
    
    # Method 5: Extract from path parameter (for API routes)
    path_parts = request.url.path.split('/')
    if len(path_parts) > 2 and path_parts[1] == 'api':
        potential_tenant = path_parts[2]
        if re.match(r'^[a-z0-9-]+$', potential_tenant):
            return potential_tenant
    
    return None


# Dependency functions for use in FastAPI routes
def get_current_tenant(request: Request) -> Tenant:
    """Get current tenant from request state"""
    tenant = getattr(request.state, 'tenant', None)
    if not tenant:
        raise HTTPException(status_code=400, detail="Tenant context not found")
    return tenant


def get_current_tenant_id(request: Request) -> int:
    """Get current tenant ID from request state"""
    tenant_id = getattr(request.state, 'tenant_id', None)
    if not tenant_id:
        raise HTTPException(status_code=400, detail="Tenant context not found")
    return tenant_id


def require_tenant_feature(feature: str):
    """Dependency to require specific tenant feature"""
    def dependency(request: Request, db: Session = Depends(get_db)):
        tenant = get_current_tenant(request)
        feature_enabled = tenant_service.get_tenant_setting(
            db, tenant.id, "features", feature
        )
        
        if not feature_enabled or feature_enabled.lower() != "true":
            raise HTTPException(
                status_code=403,
                detail=f"Feature '{feature}' is not available for this tenant"
            )
        
        return True
    
    return dependency


# Global middleware instances
tenant_routing_middleware = TenantRoutingMiddleware()
tenant_data_isolation_middleware = TenantDataIsolationMiddleware()
tenant_feature_access_middleware = TenantFeatureAccessMiddleware()
