from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from .db import Base, legacy_engine, init_db, init_tenant_db
from .seed import run_seed
from .routers import api
from .config import settings
from .middleware.tenant import tenant_middleware, feature_access_middleware
from .middleware.security import security_middleware, audit_middleware
from .tenant_config import tenant_config_manager
from .database_optimizer import database_optimizer
from .security_manager import security_manager
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

# Feature flags
MULTI_TENANT_ENABLED = os.getenv('MULTI_TENANT_ENABLED', 'false').lower() == 'true'
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
                    "encryption_available": True,
                    "rate_limiting_enabled": True,
                    "audit_logging_enabled": True,
                    "timestamp": datetime.utcnow().isoformat()
                }
            except Exception as e:
                logger.error(f"Error getting security status: {e}")
                return {"error": "Failed to get security status"}

        @app.get("/api/security/metrics/{tenant_id}")
        async def get_security_metrics(tenant_id: str):
            """Get security metrics for a tenant"""
            try:
                metrics = await security_manager.get_security_metrics(tenant_id)
                return {
                    "tenant_id": tenant_id,
                    "metrics": metrics,
                    "timestamp": datetime.utcnow().isoformat()
                }
            except Exception as e:
                logger.error(f"Error getting security metrics: {e}")
                return {"error": "Failed to get security metrics"}

        @app.get("/api/security/events/{tenant_id}")
        async def get_security_events(tenant_id: str, limit: int = 50):
            """Get recent security events for a tenant"""
            try:
                # This would typically fetch from database
                # For now, return recent events from memory
                events = [
                    event for event in security_manager.security_events
                    if event['tenant_id'] == tenant_id
                ][-limit:]
                
                return {
                    "tenant_id": tenant_id,
                    "events": events,
                    "count": len(events),
                    "timestamp": datetime.utcnow().isoformat()
                }
            except Exception as e:
                logger.error(f"Error getting security events: {e}")
                return {"error": "Failed to get security events"}

    # Database performance endpoints
    if DATABASE_OPTIMIZATION_ENABLED:
        @app.get("/api/database/performance/{tenant_id}")
        async def get_database_performance(tenant_id: str):
            """Get database performance metrics for a tenant"""
            try:
                metrics = await database_optimizer.get_performance_metrics(tenant_id)
                return {
                    "tenant_id": tenant_id,
                    "performance_metrics": metrics,
                    "timestamp": datetime.utcnow().isoformat()
                }
            except Exception as e:
                logger.error(f"Error getting database performance: {e}")
                return {"error": "Failed to get database performance"}

        @app.get("/api/database/slow-queries/{tenant_id}")
        async def get_slow_queries(tenant_id: str, limit: int = 10):
            """Get slow queries for a tenant"""
            try:
                slow_queries = await database_optimizer.get_slow_queries(tenant_id, limit)
                return {
                    "tenant_id": tenant_id,
                    "slow_queries": slow_queries,
                    "count": len(slow_queries),
                    "timestamp": datetime.utcnow().isoformat()
                }
            except Exception as e:
                logger.error(f"Error getting slow queries: {e}")
                return {"error": "Failed to get slow queries"}

        @app.post("/api/database/optimize/{tenant_id}")
        async def optimize_tenant_database(tenant_id: str):
            """Optimize database for a specific tenant"""
            try:
                config = await tenant_config_manager.get_tenant_config(tenant_id)
                if not config:
                    return {"error": "Tenant not found"}
                
                success = await database_optimizer.optimize_tenant_database(
                    tenant_id, config.database_url
                )
                
                return {
                    "tenant_id": tenant_id,
                    "optimization_success": success,
                    "timestamp": datetime.utcnow().isoformat()
                }
            except Exception as e:
                logger.error(f"Error optimizing database: {e}")
                return {"error": "Failed to optimize database"}

        @app.post("/api/database/optimize-all")
        async def optimize_all_databases():
            """Optimize databases for all tenants"""
            try:
                results = await database_optimizer.optimize_all_tenants()
                return {
                    "optimization_results": results,
                    "total_tenants": len(results),
                    "successful_optimizations": sum(1 for success in results.values() if success),
                    "timestamp": datetime.utcnow().isoformat()
                }
            except Exception as e:
                logger.error(f"Error optimizing all databases: {e}")
                return {"error": "Failed to optimize databases"}

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
            "multi_tenant_enabled": MULTI_TENANT_ENABLED,
            "security_enabled": SECURITY_ENABLED,
            "database_optimization_enabled": DATABASE_OPTIMIZATION_ENABLED
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
        
        # Add security information
        health["security"] = {
            "enabled": SECURITY_ENABLED,
            "encryption_available": SECURITY_ENABLED,
            "rate_limiting_enabled": SECURITY_ENABLED,
            "audit_logging_enabled": SECURITY_ENABLED
        }
        
        # Add database optimization information
        health["database_optimization"] = {
            "enabled": DATABASE_OPTIMIZATION_ENABLED,
            "connection_pools_configured": DATABASE_OPTIMIZATION_ENABLED,
            "performance_monitoring_enabled": DATABASE_OPTIMIZATION_ENABLED
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
                    
                    # Optimize database if enabled
                    if DATABASE_OPTIMIZATION_ENABLED:
                        config = await tenant_config_manager.get_tenant_config(tenant_id)
                        if config:
                            await database_optimizer.optimize_tenant_database(
                                tenant_id, config.database_url
                            )
                            logger.info(f"Optimized database for tenant: {tenant_id}")
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
    logger.info(f"Security features: {'ENABLED' if SECURITY_ENABLED else 'DISABLED'}")
    logger.info(f"Database optimization: {'ENABLED' if DATABASE_OPTIMIZATION_ENABLED else 'DISABLED'}")
    return app


# Create app instance
app = create_app()

