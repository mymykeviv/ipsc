from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .db import Base, engine
from .seed import run_seed
from .routers import api
from .config import settings
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.log_level),
    format=settings.log_format
)
logger = logging.getLogger(__name__)

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

    # Use provided engine or default engine
    db_engine = database_engine or engine
    
    # DB init for dev
    Base.metadata.create_all(bind=db_engine)
    
    # Seed database
    run_seed()

    app.include_router(api, prefix="/api")

    logger.info(f"Application started in {settings.environment} mode")
    return app


app = create_app()

