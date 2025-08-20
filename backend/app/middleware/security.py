"""
Security Middleware for Multi-Tenant Architecture
Handles rate limiting, input sanitization, audit logging, and security monitoring
"""

import asyncio
import logging
import time
from typing import Optional, Dict, Any
from fastapi import Request, Response, HTTPException
from fastapi.responses import JSONResponse
from ..security_manager import security_manager
from ..tenant_config import tenant_config_manager

logger = logging.getLogger(__name__)


class SecurityMiddleware:
    """Security middleware for request processing"""
    
    def __init__(self):
        self.request_counters: Dict[str, int] = {}
        self.last_cleanup = time.time()
    
    async def __call__(self, request: Request, call_next):
        """Process request with security checks"""
        start_time = time.time()
        
        try:
            # Get tenant context
            tenant_id = getattr(request.state, 'tenant_id', None)
            user_id = getattr(request.state, 'user_id', None)
            
            # Skip security checks for public endpoints
            if self._is_public_endpoint(request.url.path):
                return await call_next(request)
            
            # Rate limiting check
            if not await self._check_rate_limit(request, tenant_id, user_id):
                return JSONResponse(
                    status_code=429,
                    content={
                        "error": "Rate limit exceeded",
                        "detail": "Too many requests. Please try again later."
                    }
                )
            
            # Input sanitization
            await self._sanitize_request_data(request)
            
            # Security event logging
            await self._log_request_event(request, tenant_id, user_id, "REQUEST_STARTED")
            
            # Process request
            response = await call_next(request)
            
            # Add security headers
            response = await self._add_security_headers(response)
            
            # Log request completion
            execution_time = time.time() - start_time
            await self._log_request_completion(request, tenant_id, user_id, execution_time)
            
            return response
            
        except Exception as e:
            # Log security error
            await self._log_security_error(request, tenant_id, user_id, str(e))
            raise
    
    def _is_public_endpoint(self, path: str) -> bool:
        """Check if endpoint is public (exempt from security checks)"""
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
    
    async def _check_rate_limit(self, request: Request, tenant_id: Optional[str], 
                               user_id: Optional[str]) -> bool:
        """Check rate limiting for request"""
        try:
            if not tenant_id:
                return True  # Allow if no tenant context
            
            # Determine action type based on request
            action = self._get_action_type(request)
            
            # Check rate limit
            return await security_manager.check_rate_limit(tenant_id, user_id, action)
            
        except Exception as e:
            logger.error(f"Rate limit check failed: {e}")
            return True  # Allow if rate limiting fails
    
    def _get_action_type(self, request: Request) -> str:
        """Determine action type for rate limiting"""
        path = request.url.path
        method = request.method
        
        if path.startswith("/api/auth"):
            return "login"
        elif path.startswith("/api/reports"):
            return "report_generation"
        elif path.startswith("/api/upload") or "upload" in path:
            return "file_upload"
        elif method in ["POST", "PUT", "DELETE"]:
            return "api_call"
        else:
            return "api_call"
    
    async def _sanitize_request_data(self, request: Request):
        """Sanitize request data to prevent injection attacks"""
        try:
            # Sanitize query parameters
            if request.query_params:
                sanitized_params = {}
                for key, value in request.query_params.items():
                    sanitized_value = await security_manager.sanitize_input(value)
                    sanitized_params[key] = sanitized_value
                
                # Update request query params (if possible)
                request._query_params = sanitized_params
            
            # Note: Body sanitization would need to be done in individual endpoints
            # as the body is consumed during request processing
            
        except Exception as e:
            logger.error(f"Failed to sanitize request data: {e}")
    
    async def _log_request_event(self, request: Request, tenant_id: Optional[str], 
                                user_id: Optional[str], event_type: str):
        """Log security event for request"""
        try:
            if not tenant_id:
                return
            
            details = {
                'method': request.method,
                'path': request.url.path,
                'user_agent': request.headers.get('user-agent', ''),
                'ip_address': self._get_client_ip(request),
                'referer': request.headers.get('referer', '')
            }
            
            await security_manager.log_security_event(
                event_type, tenant_id, user_id, details, "INFO"
            )
            
        except Exception as e:
            logger.error(f"Failed to log request event: {e}")
    
    async def _log_request_completion(self, request: Request, tenant_id: Optional[str], 
                                     user_id: Optional[str], execution_time: float):
        """Log request completion with performance metrics"""
        try:
            if not tenant_id:
                return
            
            details = {
                'method': request.method,
                'path': request.url.path,
                'execution_time': execution_time,
                'status_code': 200  # Will be updated if available
            }
            
            # Log slow requests
            severity = "WARNING" if execution_time > 1.0 else "INFO"
            
            await security_manager.log_security_event(
                "REQUEST_COMPLETED", tenant_id, user_id, details, severity
            )
            
        except Exception as e:
            logger.error(f"Failed to log request completion: {e}")
    
    async def _log_security_error(self, request: Request, tenant_id: Optional[str], 
                                 user_id: Optional[str], error: str):
        """Log security error"""
        try:
            if not tenant_id:
                return
            
            details = {
                'method': request.method,
                'path': request.url.path,
                'error': error,
                'ip_address': self._get_client_ip(request)
            }
            
            await security_manager.log_security_event(
                "SECURITY_ERROR", tenant_id, user_id, details, "ERROR"
            )
            
        except Exception as e:
            logger.error(f"Failed to log security error: {e}")
    
    async def _add_security_headers(self, response: Response) -> Response:
        """Add security headers to response"""
        try:
            # Security headers
            response.headers["X-Content-Type-Options"] = "nosniff"
            response.headers["X-Frame-Options"] = "DENY"
            response.headers["X-XSS-Protection"] = "1; mode=block"
            response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
            response.headers["Content-Security-Policy"] = "default-src 'self'"
            
            # Remove server information
            if "server" in response.headers:
                del response.headers["server"]
            
            return response
            
        except Exception as e:
            logger.error(f"Failed to add security headers: {e}")
            return response
    
    def _get_client_ip(self, request: Request) -> str:
        """Get client IP address"""
        try:
            # Check for forwarded headers
            forwarded_for = request.headers.get("X-Forwarded-For")
            if forwarded_for:
                return forwarded_for.split(",")[0].strip()
            
            real_ip = request.headers.get("X-Real-IP")
            if real_ip:
                return real_ip
            
            # Fallback to direct connection
            return request.client.host if request.client else "unknown"
            
        except Exception as e:
            logger.error(f"Failed to get client IP: {e}")
            return "unknown"


class AuditMiddleware:
    """Audit logging middleware for data access tracking"""
    
    def __init__(self):
        self.audit_enabled = True
    
    async def __call__(self, request: Request, call_next):
        """Process request with audit logging"""
        try:
            # Get tenant and user context
            tenant_id = getattr(request.state, 'tenant_id', None)
            user_id = getattr(request.state, 'user_id', None)
            
            # Skip audit for public endpoints
            if self._is_public_endpoint(request.url.path):
                return await call_next(request)
            
            # Log data access events
            await self._log_data_access(request, tenant_id, user_id)
            
            # Process request
            response = await call_next(request)
            
            return response
            
        except Exception as e:
            logger.error(f"Audit middleware error: {e}")
            return await call_next(request)
    
    def _is_public_endpoint(self, path: str) -> bool:
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
    
    async def _log_data_access(self, request: Request, tenant_id: Optional[str], 
                              user_id: Optional[str]):
        """Log data access events"""
        try:
            if not tenant_id or not user_id:
                return
            
            path = request.url.path
            method = request.method
            
            # Determine resource type and action
            resource_type = self._get_resource_type(path)
            action = self._get_action(method)
            
            if resource_type and action:
                details = {
                    'resource_type': resource_type,
                    'action': action,
                    'path': path,
                    'method': method,
                    'ip_address': self._get_client_ip(request)
                }
                
                await security_manager.log_security_event(
                    "DATA_ACCESS", tenant_id, user_id, details, "INFO"
                )
                
        except Exception as e:
            logger.error(f"Failed to log data access: {e}")
    
    def _get_resource_type(self, path: str) -> Optional[str]:
        """Get resource type from path"""
        if "/api/products" in path:
            return "products"
        elif "/api/invoices" in path:
            return "invoices"
        elif "/api/purchases" in path:
            return "purchases"
        elif "/api/payments" in path:
            return "payments"
        elif "/api/parties" in path:
            return "parties"
        elif "/api/expenses" in path:
            return "expenses"
        elif "/api/reports" in path:
            return "reports"
        else:
            return None
    
    def _get_action(self, method: str) -> Optional[str]:
        """Get action from HTTP method"""
        action_map = {
            "GET": "read",
            "POST": "create",
            "PUT": "update",
            "DELETE": "delete",
            "PATCH": "update"
        }
        return action_map.get(method)
    
    def _get_client_ip(self, request: Request) -> str:
        """Get client IP address"""
        try:
            forwarded_for = request.headers.get("X-Forwarded-For")
            if forwarded_for:
                return forwarded_for.split(",")[0].strip()
            
            real_ip = request.headers.get("X-Real-IP")
            if real_ip:
                return real_ip
            
            return request.client.host if request.client else "unknown"
            
        except Exception as e:
            logger.error(f"Failed to get client IP: {e}")
            return "unknown"


# Global middleware instances
security_middleware = SecurityMiddleware()
audit_middleware = AuditMiddleware()
