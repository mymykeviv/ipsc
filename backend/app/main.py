from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from .db import Base, legacy_engine, init_db, init_tenant_db
from .seed import run_seed
from .routers import api
from .config import settings
from .middleware.tenant import tenant_middleware, feature_access_middleware
from .tenant_config import tenant_config_manager
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

# Feature flag for multi-tenant architecture
MULTI_TENANT_ENABLED = os.getenv('MULTI_TENANT_ENABLED', 'false').lower() == 'true'

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

    # Add tenant middleware if multi-tenant is enabled
    if MULTI_TENANT_ENABLED:
        app.middleware("http")(tenant_middleware)
        app.middleware("http")(feature_access_middleware)
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
            "multi_tenant_enabled": MULTI_TENANT_ENABLED
        }

    @app.get("/version")
    async def version_info():
        return {
            "version": VERSION, 
            "build_date": BUILD_DATE,
            "environment": settings.environment,
            "multi_tenant_enabled": MULTI_TENANT_ENABLED
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
            "multi_tenant_enabled": MULTI_TENANT_ENABLED
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

    # Monitoring endpoints
    @app.get("/metrics")
    async def metrics():
        """Prometheus metrics endpoint"""
        return get_metrics_response()

    @app.get("/system/status")
    async def system_status():
        """System status and metrics"""
        system_metrics = SystemMonitor.get_system_metrics()
        process_metrics = SystemMonitor.get_process_metrics()
        
        return {
            "timestamp": datetime.utcnow().isoformat(),
            "system": system_metrics,
            "process": process_metrics,
            "uptime": "N/A",  # Could be enhanced with actual uptime tracking
            "multi_tenant_enabled": MULTI_TENANT_ENABLED
        }

    @app.get("/health/detailed")
    async def detailed_health_check():
        """Detailed health check with all components"""
        health_checker = HealthChecker()
        health = await health_checker.comprehensive_health_check()
        
        # Add multi-tenant information to health check
        if MULTI_TENANT_ENABLED:
            try:
                tenants = await tenant_config_manager.list_tenants()
                health["multi_tenant"] = {
                    "enabled": True,
                    "tenant_count": len(tenants),
                    "tenants": tenants
                }
            except Exception as e:
                health["multi_tenant"] = {
                    "enabled": True,
                    "error": str(e)
                }
        else:
            health["multi_tenant"] = {
                "enabled": False
            }
        
        return health

    @app.get("/health/ready")
    async def readiness_check():
        """Kubernetes readiness probe endpoint"""
        health_checker = HealthChecker()
        health = await health_checker.comprehensive_health_check()
        
        if health["status"] == "healthy":
            return {"status": "ready"}
        else:
            return {"status": "not_ready", "details": health}

    @app.get("/health/live")
    async def liveness_check():
        """Kubernetes liveness probe endpoint"""
        return {"status": "alive"}

    # Use provided engine or default engine
    db_engine = database_engine or legacy_engine
    
    # DB init for dev (only if not in testing)
    if not settings.environment == "testing":
        if MULTI_TENANT_ENABLED:
            # Initialize tenant databases
            try:
                tenants = await tenant_config_manager.list_tenants()
                for tenant_id in tenants:
                    await init_tenant_db(tenant_id)
                    logger.info(f"Initialized database for tenant: {tenant_id}")
            except Exception as e:
                logger.error(f"Error initializing tenant databases: {e}")
        else:
            # Legacy single-tenant initialization
            Base.metadata.create_all(bind=db_engine)
            # Seed database
            run_seed()

    app.include_router(api, prefix="/api")

    logger.info(f"Application started in {settings.environment} mode")
    logger.info(f"Multi-tenant architecture: {'ENABLED' if MULTI_TENANT_ENABLED else 'DISABLED'}")
    return app


# Create app instance
app = create_app()

