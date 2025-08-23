from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from .db import Base, legacy_engine, init_db, init_tenant_db
# Seed data removed from main application - use separate scripts for development and testing
from . import main_routers
from .config import settings
from .middleware.tenant_routing import (
    tenant_routing_middleware, 
    tenant_feature_access_middleware
)
from .middleware.security import security_middleware, audit_middleware
from .tenant_config import tenant_config_manager
from .database_optimizer import database_optimizer
from .security_manager import security_manager
from .branding_manager import branding_manager
from .monitoring import (
    MonitoringMiddleware, SystemMonitor, HealthChecker,
    get_metrics_response, record_invoice_created, record_payment_processed,
    record_product_created, record_stock_adjustment
)
from .logging_config import setup_logging, get_logger
import logging
from datetime import datetime
import os

# Configure structured logging
setup_logging(
    log_level=settings.log_level,
    log_file="logs/app.log" if settings.environment == "production" else None,
    enable_json=settings.environment == "production",
    enable_console=True
)
logger = get_logger(__name__)

# Version tracking
VERSION = settings.version
BUILD_DATE = datetime.now().strftime("%Y-%m-%d")

# Feature flags - use settings for consistency
MULTI_TENANT_ENABLED = settings.multi_tenant_enabled
SECURITY_ENABLED = os.getenv('SECURITY_ENABLED', 'true').lower() == 'true'
DATABASE_OPTIMIZATION_ENABLED = os.getenv('DATABASE_OPTIMIZATION_ENABLED', 'true').lower() == 'true'

def create_app(database_engine=None) -> FastAPI:
    app = FastAPI(
        title=settings.app_name, 
        version=VERSION,
        debug=settings.debug
    )

    # Add CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Add security middleware if enabled
    if SECURITY_ENABLED:
        app.middleware("http")(security_middleware)
        app.middleware("http")(audit_middleware)
        logger.info("Security middleware enabled")
    else:
        logger.info("Security middleware disabled")

    # Add tenant middleware if multi-tenant is enabled
    if MULTI_TENANT_ENABLED:
        # Re-enabled with proper ASGI-compliant middleware
        app.middleware("http")(tenant_routing_middleware)
        app.middleware("http")(tenant_feature_access_middleware)
        logger.info("Multi-tenant middleware enabled")
    else:
        logger.info("Multi-tenant middleware disabled - running in single-tenant mode")

    @app.get("/health")
    async def health_check():
        return {
            "status": "ok", 
            "version": VERSION, 
            "build_date": BUILD_DATE,
            "environment": settings.environment,
            "multi_tenant_enabled": MULTI_TENANT_ENABLED,
            "security_enabled": SECURITY_ENABLED,
            "database_optimization_enabled": DATABASE_OPTIMIZATION_ENABLED
        }

    @app.get("/version")
    async def version_info():
        return {
            "version": VERSION, 
            "build_date": BUILD_DATE,
            "environment": settings.environment,
            "multi_tenant_enabled": MULTI_TENANT_ENABLED,
            "security_enabled": SECURITY_ENABLED,
            "database_optimization_enabled": DATABASE_OPTIMIZATION_ENABLED
        }

    @app.get("/config")
    async def config_info():
        """Return non-sensitive configuration information"""
        return {
            "environment": settings.environment,
            "debug": settings.debug,
            "log_level": settings.log_level,
            "database_pool_size": settings.database_pool_size,
            "allowed_origins": settings.allowed_origins,
            "multi_tenant_enabled": MULTI_TENANT_ENABLED,
            "security_enabled": SECURITY_ENABLED,
            "database_optimization_enabled": DATABASE_OPTIMIZATION_ENABLED
        }

    # Multi-tenant specific endpoints
    if MULTI_TENANT_ENABLED:
        @app.get("/api/tenants")
        async def list_tenants():
            """List all available tenants"""
            try:
                tenants = await tenant_config_manager.list_tenants()
                return {
                    "tenants": tenants,
                    "count": len(tenants)
                }
            except Exception as e:
                logger.error(f"Error listing tenants: {e}")
                return {"error": "Failed to list tenants"}

        @app.get("/api/tenants/{tenant_id}/config")
        async def get_tenant_config(tenant_id: str):
            """Get tenant configuration"""
            try:
                config = await tenant_config_manager.get_tenant_config(tenant_id)
                if not config:
                    return {"error": "Tenant not found"}
                
                return {
                    "tenant_id": config.tenant_id,
                    "domain": config.domain,
                    "features": config.features,
                    "is_active": config.is_active,
                    "branding": {
                        "company_name": config.branding.get('company_name'),
                        "primary_color": config.branding.get('primary_color')
                    }
                }
            except Exception as e:
                logger.error(f"Error getting tenant config: {e}")
                return {"error": "Failed to get tenant configuration"}

        @app.get("/api/tenants/{tenant_id}/branding")
        async def get_tenant_branding(tenant_id: str):
            """Get tenant branding information"""
            try:
                branding = await tenant_config_manager.get_branding(tenant_id)
                company_info = await tenant_config_manager.get_company_info(tenant_id)
                
                return {
                    "branding": branding,
                    "company_info": company_info
                }
            except Exception as e:
                logger.error(f"Error getting tenant branding: {e}")
                return {"error": "Failed to get tenant branding"}

    # Security endpoints
    if SECURITY_ENABLED:
        @app.get("/api/security/status")
        async def security_status():
            """Get security status and metrics"""
            try:
                return {
                    "security_enabled": True,
                    "rate_limiting": await security_manager.get_rate_limit_status(),
                    "threat_detection": await security_manager.get_threat_status(),
                    "audit_logging": await security_manager.get_audit_status()
                }
            except Exception as e:
                logger.error(f"Error getting security status: {e}")
                return {"error": "Failed to get security status"}

        @app.get("/api/security/metrics")
        async def security_metrics():
            """Get security metrics"""
            try:
                return await security_manager.get_metrics()
            except Exception as e:
                logger.error(f"Error getting security metrics: {e}")
                return {"error": "Failed to get security metrics"}

    # Performance monitoring endpoints
    if DATABASE_OPTIMIZATION_ENABLED:
        @app.get("/api/performance/status")
        async def performance_status():
            """Get performance status and metrics"""
            try:
                return {
                    "optimization_enabled": True,
                    "query_cache_hit_rate": await database_optimizer.get_cache_hit_rate(),
                    "slow_queries": await database_optimizer.get_slow_queries(),
                    "connection_pool_status": await database_optimizer.get_pool_status()
                }
            except Exception as e:
                logger.error(f"Error getting performance status: {e}")
                return {"error": "Failed to get performance status"}

        @app.get("/api/performance/optimize")
        async def optimize_performance():
            """Trigger performance optimization"""
            try:
                result = await database_optimizer.optimize_queries()
                return {
                    "optimization_completed": True,
                    "queries_optimized": result.get("queries_optimized", 0),
                    "performance_improvement": result.get("improvement_percentage", 0)
                }
            except Exception as e:
                logger.error(f"Error optimizing performance: {e}")
                return {"error": "Failed to optimize performance"}

    # Branding endpoints
    @app.get("/api/branding/status")
    async def branding_status():
        """Get branding system status"""
        try:
            return {
                "branding_enabled": True,
                "available_themes": await branding_manager.get_available_themes(),
                "custom_branding_enabled": await branding_manager.is_custom_branding_enabled()
            }
        except Exception as e:
            logger.error(f"Error getting branding status: {e}")
            return {"error": "Failed to get branding status"}

    # Include main routers
    app.include_router(main_routers.api, prefix="/api")

    # Database initialization
    if os.getenv("ENVIRONMENT") != "testing":
        @app.on_event("startup")
        async def startup_event():
            """Initialize database and services on startup"""
            try:
                logger.info("Starting application initialization...")
                
                # Initialize database
                if database_engine:
                    Base.metadata.create_all(bind=database_engine)
                else:
                    Base.metadata.create_all(bind=legacy_engine)
                
                # Seed data removed - use separate development script if needed
                
                logger.info("Application initialization completed successfully")
                
            except Exception as e:
                logger.error(f"Application initialization failed: {e}")
                raise

    return app

# Create the application instance
app = create_app()

# Log application startup information
logger.info(f"Application started in {settings.environment} mode")
logger.info(f"Multi-tenant architecture: {'ENABLED' if MULTI_TENANT_ENABLED else 'DISABLED'}")
logger.info(f"Security features: {'ENABLED' if SECURITY_ENABLED else 'DISABLED'}")
logger.info(f"Database optimization: {'ENABLED' if DATABASE_OPTIMIZATION_ENABLED else 'DISABLED'}")

# Conditional database initialization
if os.getenv("ENVIRONMENT") != "testing":
    # Initialize database
    Base.metadata.create_all(bind=legacy_engine)
    
    # Seed data removed - use separate development script if needed

