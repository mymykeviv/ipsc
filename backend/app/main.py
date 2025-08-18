from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .db import Base, engine
from .seed import run_seed
from .routers import api
from .config import settings
from .monitoring import (
    MonitoringMiddleware, SystemMonitor, HealthChecker,
    get_metrics_response, record_invoice_created, record_payment_processed,
    record_product_created, record_stock_adjustment
)
from .logging_config import setup_logging, get_logger
import logging
from datetime import datetime

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

    @app.get("/health")
    async def health_check():
        return {
            "status": "ok", 
            "version": VERSION, 
            "build_date": BUILD_DATE,
            "environment": settings.environment
        }

    @app.get("/version")
    async def version_info():
        return {
            "version": VERSION, 
            "build_date": BUILD_DATE,
            "environment": settings.environment
        }

    @app.get("/config")
    async def config_info():
        """Return non-sensitive configuration information"""
        return {
            "environment": settings.environment,
            "debug": settings.debug,
            "log_level": settings.log_level,
            "database_pool_size": settings.database_pool_size,
            "allowed_origins": settings.allowed_origins
        }

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
            "uptime": "N/A"  # Could be enhanced with actual uptime tracking
        }

    @app.get("/health/detailed")
    async def detailed_health_check():
        """Detailed health check with all components"""
        health_checker = HealthChecker()
        return await health_checker.comprehensive_health_check()

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
    db_engine = database_engine or engine
    
    # DB init for dev (only if not in testing)
    if not settings.environment == "testing":
        Base.metadata.create_all(bind=db_engine)
        # Seed database
        run_seed()

    app.include_router(api, prefix="/api")

    logger.info(f"Application started in {settings.environment} mode")
    return app


# Create app instance
app = create_app()

