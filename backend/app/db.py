from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from .config import settings
from .tenant_config import tenant_config_manager
import logging

logger = logging.getLogger(__name__)


class Base(DeclarativeBase):
    pass


# Legacy single-tenant database engine (for backward compatibility)
legacy_engine = create_engine(
    settings.database_url,
    pool_size=settings.database_pool_size,
    max_overflow=settings.database_max_overflow,
    pool_timeout=settings.database_pool_timeout,
    pool_pre_ping=True,  # Enable connection health checks
    echo=settings.debug  # Enable SQL logging in debug mode
)

LegacySessionLocal = sessionmaker(bind=legacy_engine, autoflush=False, autocommit=False)


def get_db():
    """Legacy dependency to get database session (single-tenant)"""
    db = LegacySessionLocal()
    try:
        yield db
    except Exception as e:
        logger.error(f"Database session error: {e}")
        db.rollback()
        raise
    finally:
        db.close()


async def get_tenant_db(tenant_id: str):
    """Get database session for specific tenant"""
    try:
        session = await tenant_config_manager.get_session(tenant_id)
        yield session
    except Exception as e:
        logger.error(f"Tenant database session error for {tenant_id}: {e}")
        if hasattr(session, 'rollback'):
            await session.rollback()
        raise
    finally:
        if hasattr(session, 'close'):
            await session.close()


def get_db_url():
    """Get database URL for migrations"""
    return settings.database_url


async def get_tenant_db_url(tenant_id: str):
    """Get database URL for specific tenant"""
    return await tenant_config_manager.get_database_url(tenant_id)


def init_db():
    """Initialize database tables (legacy single-tenant)"""
    try:
        Base.metadata.create_all(bind=legacy_engine)
        logger.info("Database tables created successfully")
    except Exception as e:
        logger.error(f"Database initialization error: {e}")
        raise


async def init_tenant_db(tenant_id: str):
    """Initialize database tables for specific tenant"""
    try:
        engine = await tenant_config_manager.get_engine(tenant_id)
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info(f"Database tables created successfully for tenant {tenant_id}")
    except Exception as e:
        logger.error(f"Tenant database initialization error for {tenant_id}: {e}")
        raise


async def create_tenant_database(tenant_id: str, database_url: str):
    """Create new tenant database"""
    try:
        # Create database engine for new tenant
        engine = create_async_engine(
            database_url,
            pool_size=settings.database_pool_size,
            max_overflow=settings.database_max_overflow,
            pool_timeout=settings.database_pool_timeout,
            pool_pre_ping=True,
            echo=settings.debug
        )
        
        # Initialize database tables
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        
        await engine.dispose()
        logger.info(f"Tenant database created successfully for {tenant_id}")
        
    except Exception as e:
        logger.error(f"Failed to create tenant database for {tenant_id}: {e}")
        raise


# Backward compatibility functions
def get_legacy_db():
    """Backward compatibility function"""
    return get_db()


def get_legacy_db_url():
    """Backward compatibility function"""
    return get_db_url()


def init_legacy_db():
    """Backward compatibility function"""
    return init_db()

