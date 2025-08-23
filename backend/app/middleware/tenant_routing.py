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
import os

logger = logging.getLogger(__name__)

# Check if multi-tenant mode is enabled
MULTI_TENANT_ENABLED = os.getenv('MULTI_TENANT_ENABLED', 'false').lower() == 'true'
DEFAULT_TENANT_SLUG = os.getenv('DEFAULT_TENANT_SLUG', 'default')


# ASGI-compliant middleware functions for FastAPI
async def tenant_routing_middleware(request: Request, call_next):
    """ASGI-compliant middleware function for tenant routing"""
    try:
        # First check if this is a public endpoint - if so, skip tenant routing
        if is_public_endpoint(request.url.path):
            return await call_next(request)
        
        # Get database session
        db = next(get_db())
        
        # Determine tenant context
        tenant = await get_tenant_context(request, db)
        
        if not tenant:
            # If no tenant found and multi-tenant is disabled, create/use default tenant
            if not MULTI_TENANT_ENABLED:
                tenant = await ensure_default_tenant(db)
            else:
                return create_unauthorized_response("Tenant ID required")
        
        if not tenant.is_active:
            return create_forbidden_response(f"Tenant '{tenant.slug}' is not active")
        
        # Check if tenant is in trial and trial has expired
        if tenant.is_trial and tenant.trial_end_date and tenant.trial_end_date < datetime.utcnow():
            return create_forbidden_response(f"Trial period for tenant '{tenant.slug}' has expired")
        
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
async def get_tenant_context(request: Request, db: Session) -> Optional[Tenant]:
    """Get tenant context from request"""
    # Method 1: Extract from subdomain
    tenant = await extract_tenant_from_subdomain(request, db)
    if tenant:
        return tenant
    
    # Method 2: Extract from headers
    tenant = await extract_tenant_from_headers(request, db)
    if tenant:
        return tenant
    
    # Method 3: Extract from query parameter (for development/testing)
    tenant = await extract_tenant_from_query(request, db)
    if tenant:
        return tenant
    
    # Method 4: Extract from path parameter (for API routes with tenant prefix)
    tenant = await extract_tenant_from_path(request, db)
    if tenant:
        return tenant
    
    return None

async def extract_tenant_from_subdomain(request: Request, db: Session) -> Optional[Tenant]:
    """Extract tenant from subdomain"""
    subdomain_pattern = re.compile(r'^([^.]+)\.')
    host = request.headers.get("host", "")
    
    if "." in host:
        subdomain_match = subdomain_pattern.match(host)
        if subdomain_match:
            tenant_slug = subdomain_match.group(1)
            if tenant_slug not in ["www", "api", "localhost", "127", "0"]:
                return tenant_service.get_tenant_by_slug(db, tenant_slug)
    
    return None

async def extract_tenant_from_headers(request: Request, db: Session) -> Optional[Tenant]:
    """Extract tenant from headers"""
    # Check X-Tenant-ID header
    tenant_id = request.headers.get("X-Tenant-ID")
    if tenant_id:
        try:
            return db.query(Tenant).filter(Tenant.id == int(tenant_id)).first()
        except (ValueError, TypeError):
            pass
    
    # Check X-Tenant-Slug header
    tenant_slug = request.headers.get("X-Tenant-Slug")
    if tenant_slug:
        return tenant_service.get_tenant_by_slug(db, tenant_slug)
    
    return None

async def extract_tenant_from_query(request: Request, db: Session) -> Optional[Tenant]:
    """Extract tenant from query parameters"""
    tenant_id = request.query_params.get("tenant_id")
    if tenant_id:
        try:
            return db.query(Tenant).filter(Tenant.id == int(tenant_id)).first()
        except (ValueError, TypeError):
            pass
    
    tenant_slug = request.query_params.get("tenant_slug")
    if tenant_slug:
        return tenant_service.get_tenant_by_slug(db, tenant_slug)
    
    return None

async def extract_tenant_from_path(request: Request, db: Session) -> Optional[Tenant]:
    """Extract tenant from path parameters (only for explicit tenant routes)"""
    path_parts = request.url.path.split('/')
    
    # Only extract tenant from paths like /api/tenant/{tenant_slug}/...
    if len(path_parts) > 3 and path_parts[1] == 'api' and path_parts[2] == 'tenant':
        tenant_slug = path_parts[3]
        if re.match(r'^[a-z0-9-]+$', tenant_slug):
            return tenant_service.get_tenant_by_slug(db, tenant_slug)
    
    return None

async def ensure_default_tenant(db: Session) -> Tenant:
    """Ensure default tenant exists and return it"""
    # Try to find existing default tenant
    default_tenant = tenant_service.get_tenant_by_slug(db, DEFAULT_TENANT_SLUG)
    
    if not default_tenant:
        # Create default tenant if it doesn't exist
        logger.info(f"Creating default tenant with slug: {DEFAULT_TENANT_SLUG}")
        default_tenant = Tenant(
            name="Default Organization",
            slug=DEFAULT_TENANT_SLUG,
            is_active=True,
            is_trial=False,
            trial_end_date=None
        )
        db.add(default_tenant)
        db.commit()
        db.refresh(default_tenant)
        logger.info(f"Created default tenant with ID: {default_tenant.id}")
    
    return default_tenant


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
