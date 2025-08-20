"""
Multi-Tenant Middleware System
Handles tenant routing, feature access control, and tenant context management
"""

import re
from typing import Optional
from fastapi import Request, HTTPException, Response
from fastapi.responses import JSONResponse
import logging
from ..tenant_config import tenant_config_manager

logger = logging.getLogger(__name__)


class TenantMiddleware:
    """Middleware for tenant routing and context management"""
    
    def __init__(self):
        self.subdomain_pattern = re.compile(r'^([^.]+)\.')
    
    async def __call__(self, request: Request, call_next):
        """Extract tenant ID and set tenant context"""
        try:
            # Extract tenant ID from various sources
            tenant_id = self.extract_tenant_id(request)
            
            if not tenant_id:
                # For non-tenant-specific endpoints (health check, etc.)
                if self.is_public_endpoint(request.url.path):
                    return await call_next(request)
                else:
                    return JSONResponse(
                        status_code=400,
                        content={"error": "Tenant ID required", "detail": "Please provide tenant ID via subdomain or X-Tenant-ID header"}
                    )
            
            # Validate tenant exists
            tenant_config = await tenant_config_manager.get_tenant_config(tenant_id)
            if not tenant_config:
                return JSONResponse(
                    status_code=404,
                    content={"error": "Tenant not found", "detail": f"Tenant {tenant_id} does not exist"}
                )
            
            if not tenant_config.is_active:
                return JSONResponse(
                    status_code=403,
                    content={"error": "Tenant inactive", "detail": f"Tenant {tenant_id} is not active"}
                )
            
            # Set tenant context
            request.state.tenant_id = tenant_id
            request.state.tenant_config = tenant_config
            
            # Continue with request processing
            response = await call_next(request)
            
            # Add tenant info to response headers for debugging
            response.headers["X-Tenant-ID"] = tenant_id
            response.headers["X-Tenant-Domain"] = tenant_config.domain
            
            return response
            
        except Exception as e:
            logger.error(f"Tenant middleware error: {e}")
            return JSONResponse(
                status_code=500,
                content={"error": "Internal server error", "detail": "Tenant routing failed"}
            )
    
    def extract_tenant_id(self, request: Request) -> Optional[str]:
        """Extract tenant ID from request"""
        # Method 1: Extract from subdomain
        host = request.headers.get("host", "")
        if "." in host:
            subdomain_match = self.subdomain_pattern.match(host)
            if subdomain_match:
                tenant_id = subdomain_match.group(1)
                if tenant_id not in ["www", "api", "localhost"]:
                    return tenant_id
        
        # Method 2: Extract from X-Tenant-ID header
        tenant_id = request.headers.get("X-Tenant-ID")
        if tenant_id:
            return tenant_id
        
        # Method 3: Extract from query parameter (for development/testing)
        tenant_id = request.query_params.get("tenant_id")
        if tenant_id:
            return tenant_id
        
        return None
    
    def is_public_endpoint(self, path: str) -> bool:
        """Check if endpoint is public (doesn't require tenant)"""
        public_paths = [
            "/health",
            "/docs",
            "/openapi.json",
            "/favicon.ico",
            "/api/health",
            "/api/docs",
            "/api/openapi.json"
        ]
        return any(path.startswith(public_path) for public_path in public_paths)


class FeatureAccessMiddleware:
    """Middleware for feature access control"""
    
    def __init__(self):
        # Define feature-to-path mappings
        self.feature_paths = {
            'patient_management': [
                '/api/patients',
                '/api/treatments',
                '/api/appointments'
            ],
            'treatment_tracking': [
                '/api/treatments',
                '/api/treatment-history',
                '/api/patient-treatments'
            ],
            'dental_supplies': [
                '/api/dental-supplies',
                '/api/supply-inventory',
                '/api/supply-orders'
            ],
            'bom_management': [
                '/api/bom',
                '/api/bill-of-materials',
                '/api/bom-components'
            ],
            'production_tracking': [
                '/api/production',
                '/api/production-orders',
                '/api/production-status'
            ],
            'material_management': [
                '/api/materials',
                '/api/material-requirements',
                '/api/material-inventory'
            ]
        }
    
    async def __call__(self, request: Request, call_next):
        """Check feature access for tenant"""
        try:
            # Skip for public endpoints
            if self.is_public_endpoint(request.url.path):
                return await call_next(request)
            
            # Get tenant context
            tenant_id = getattr(request.state, 'tenant_id', None)
            if not tenant_id:
                return await call_next(request)
            
            # Check if path requires feature access
            required_feature = self.get_required_feature(request.url.path)
            if required_feature:
                has_access = await tenant_config_manager.has_feature(tenant_id, required_feature)
                if not has_access:
                    return JSONResponse(
                        status_code=403,
                        content={
                            "error": "Feature not available",
                            "detail": f"Feature '{required_feature}' is not available for this tenant"
                        }
                    )
            
            return await call_next(request)
            
        except Exception as e:
            logger.error(f"Feature access middleware error: {e}")
            return await call_next(request)
    
    def get_required_feature(self, path: str) -> Optional[str]:
        """Get required feature for path"""
        for feature, paths in self.feature_paths.items():
            if any(path.startswith(feature_path) for feature_path in paths):
                return feature
        return None
    
    def is_public_endpoint(self, path: str) -> bool:
        """Check if endpoint is public"""
        public_paths = [
            "/health",
            "/docs",
            "/openapi.json",
            "/favicon.ico",
            "/api/health",
            "/api/docs",
            "/api/openapi.json"
        ]
        return any(path.startswith(public_path) for public_path in public_paths)


# Global middleware instances
tenant_middleware = TenantMiddleware()
feature_access_middleware = FeatureAccessMiddleware()
