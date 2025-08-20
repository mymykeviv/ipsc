"""
Tenant Middleware for Multi-Tenant Architecture
Handles tenant identification, routing, and context injection
"""

import re
from typing import Optional
from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
import logging
from ..tenant_config import tenant_config_manager

logger = logging.getLogger(__name__)


class TenantMiddleware:
    """Middleware for tenant identification and routing"""
    
    def __init__(self):
        self.tenant_routing_enabled = True  # Can be controlled via environment variable
        
    async def __call__(self, request: Request, call_next):
        """Process request and inject tenant context"""
        if not self.tenant_routing_enabled:
            return await call_next(request)
        
        try:
            # Extract tenant ID from request
            tenant_id = self.extract_tenant_id(request)
            
            if not tenant_id:
                # For public endpoints, allow without tenant
                if self.is_public_endpoint(request.url.path):
                    return await call_next(request)
                
                raise HTTPException(
                    status_code=400, 
                    detail="Tenant ID required. Please provide X-Tenant-ID header or use subdomain."
                )
            
            # Validate tenant exists and is active
            tenant_config = await tenant_config_manager.get_tenant_config(tenant_id)
            if not tenant_config:
                raise HTTPException(
                    status_code=404, 
                    detail=f"Tenant '{tenant_id}' not found"
                )
            
            if not tenant_config.is_active:
                raise HTTPException(
                    status_code=403, 
                    detail=f"Tenant '{tenant_id}' is inactive"
                )
            
            # Inject tenant context into request state
            request.state.tenant_id = tenant_id
            request.state.tenant_config = tenant_config
            
            # Add tenant info to response headers for debugging
            response = await call_next(request)
            response.headers["X-Tenant-ID"] = tenant_id
            response.headers["X-Tenant-Domain"] = tenant_config.domain
            
            return response
            
        except HTTPException:
            # Re-raise HTTP exceptions
            raise
        except Exception as e:
            logger.error(f"Tenant middleware error: {e}")
            return JSONResponse(
                status_code=500,
                content={"detail": "Internal server error in tenant routing"}
            )
    
    def extract_tenant_id(self, request: Request) -> Optional[str]:
        """Extract tenant ID from request headers or subdomain"""
        
        # Method 1: Extract from X-Tenant-ID header
        tenant_header = request.headers.get("X-Tenant-ID")
        if tenant_header:
            return tenant_header.strip()
        
        # Method 2: Extract from subdomain
        host = request.headers.get("host", "")
        if "." in host:
            subdomain = host.split(".")[0]
            # Validate subdomain format
            if re.match(r"^[a-zA-Z0-9_-]+$", subdomain):
                return subdomain
        
        # Method 3: Extract from query parameter (for testing)
        tenant_param = request.query_params.get("tenant_id")
        if tenant_param:
            return tenant_param.strip()
        
        return None
    
    def is_public_endpoint(self, path: str) -> bool:
        """Check if endpoint is public (doesn't require tenant)"""
        public_paths = [
            "/docs",
            "/redoc", 
            "/openapi.json",
            "/health",
            "/api/health",
            "/api/version",
            "/api/auth/login",
            "/api/auth/register",
            "/api/tenants/list"  # Allow listing tenants
        ]
        
        return any(path.startswith(public_path) for public_path in public_paths)


class FeatureAccessMiddleware:
    """Middleware for feature access control"""
    
    def __init__(self):
        self.feature_path_mapping = {
            # Dental features
            "/api/patients": ["patient_management"],
            "/api/treatments": ["treatment_tracking"],
            "/api/dental-supplies": ["dental_supplies"],
            
            # Manufacturing features
            "/api/bom": ["bom_management"],
            "/api/production": ["production_tracking"],
            "/api/materials": ["material_management"],
            
            # Common features (available to all)
            "/api/products": [],
            "/api/invoices": [],
            "/api/purchases": [],
            "/api/payments": [],
            "/api/expenses": [],
            "/api/parties": [],
            "/api/reports": [],
        }
    
    async def __call__(self, request: Request, call_next):
        """Check feature access for tenant"""
        tenant_id = getattr(request.state, 'tenant_id', None)
        if not tenant_id:
            return await call_next(request)
        
        path = request.url.path
        
        # Check if path requires specific features
        required_features = self.feature_path_mapping.get(path, [])
        
        if required_features:
            # Check if tenant has access to required features
            for feature in required_features:
                has_access = await tenant_config_manager.has_feature(tenant_id, feature)
                if not has_access:
                    raise HTTPException(
                        status_code=403,
                        detail=f"Feature '{feature}' not available for tenant '{tenant_id}'"
                    )
        
        return await call_next(request)


# Global middleware instances
tenant_middleware = TenantMiddleware()
feature_access_middleware = FeatureAccessMiddleware()
