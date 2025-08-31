from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from .config import settings
from .tenant_config import tenant_config_manager
import logging
import os

logger = logging.getLogger(__name__)


class Base(DeclarativeBase):
    pass


# SQLite-specific configuration
def configure_sqlite_engine(engine):
    """Configure SQLite-specific settings for optimal performance"""
    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        if "sqlite" in str(engine.url):
            cursor = dbapi_connection.cursor()
            # Enable foreign key constraints
            cursor.execute("PRAGMA foreign_keys=ON")
            # Set journal mode to WAL for better concurrency
            cursor.execute("PRAGMA journal_mode=WAL")
            # Set synchronous mode for performance
            cursor.execute("PRAGMA synchronous=NORMAL")
            # Set cache size (negative value = KB)
            cursor.execute("PRAGMA cache_size=-64000")  # 64MB cache
            # Set temp store to memory
            cursor.execute("PRAGMA temp_store=MEMORY")
            # Optimize for read performance
            cursor.execute("PRAGMA mmap_size=268435456")  # 256MB memory-mapped I/O
            # Set busy timeout for better concurrency
            cursor.execute("PRAGMA busy_timeout=30000")  # 30 seconds
            # Optimize page size for better performance
            cursor.execute("PRAGMA page_size=4096")
            cursor.close()

def configure_async_sqlite_engine(engine):
    """Configure async SQLite-specific settings for optimal performance"""
    @event.listens_for(engine.sync_engine, "connect")
    def set_async_sqlite_pragma(dbapi_connection, connection_record):
        if "sqlite" in str(engine.url):
            cursor = dbapi_connection.cursor()
            # Enable foreign key constraints
            cursor.execute("PRAGMA foreign_keys=ON")
            # Set journal mode to WAL for better concurrency
            cursor.execute("PRAGMA journal_mode=WAL")
            # Set synchronous mode for performance
            cursor.execute("PRAGMA synchronous=NORMAL")
            # Set cache size (negative value = KB)
            cursor.execute("PRAGMA cache_size=-64000")  # 64MB cache
            # Set temp store to memory
            cursor.execute("PRAGMA temp_store=MEMORY")
            # Optimize for read performance
            cursor.execute("PRAGMA mmap_size=268435456")  # 256MB memory-mapped I/O
            # Set busy timeout for better concurrency
            cursor.execute("PRAGMA busy_timeout=30000")  # 30 seconds
            # Optimize page size for better performance
            cursor.execute("PRAGMA page_size=4096")
            cursor.close()

# Legacy single-tenant database engine (for backward compatibility)
if settings.database_type == "sqlite":
    # SQLite configuration with optimized connection pooling
    legacy_engine = create_engine(
        settings.database_url,
        pool_size=20,  # Increase pool size for SQLite
        max_overflow=0,  # No overflow for SQLite (file-based)
        pool_timeout=30,  # Connection timeout
        pool_recycle=3600,  # Recycle connections every hour
        pool_pre_ping=True,  # Enable connection health checks
        echo=settings.debug,  # Enable SQL logging in debug mode
        connect_args={
            "check_same_thread": False,  # Allow SQLite to be used with multiple threads
            "timeout": 30  # Database lock timeout
        }
    )
    configure_sqlite_engine(legacy_engine)
else:
    # PostgreSQL configuration
    legacy_engine = create_engine(
        settings.database_url,
        pool_size=settings.database_pool_size,
        max_overflow=settings.database_max_overflow,
        pool_timeout=settings.database_pool_timeout,
        pool_pre_ping=True,  # Enable connection health checks
        echo=settings.debug  # Enable SQL logging in debug mode
    )

# Optimized session configuration for SQLite
LegacySessionLocal = sessionmaker(
    bind=legacy_engine, 
    autoflush=False, 
    autocommit=False,
    expire_on_commit=False  # Prevent lazy loading issues with SQLite
)


def get_db():
    """Legacy dependency to get database session (single-tenant) with optimized error handling"""
    db = LegacySessionLocal()
    try:
        # Test connection for SQLite
        if settings.database_type == "sqlite":
            db.execute("SELECT 1")
        yield db
    except Exception as e:
        logger.error(f"Database session error: {e}")
        try:
            db.rollback()
        except Exception as rollback_error:
            logger.error(f"Error during rollback: {rollback_error}")
        raise
    finally:
        try:
            db.close()
        except Exception as close_error:
            logger.error(f"Error closing database session: {close_error}")


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


def get_db_url(tenant_id: int = None):
    """Get database URL for a specific tenant or main database"""
    if tenant_id:
        # For multi-tenant setup with SQLite, create separate database files
        if settings.database_type == "sqlite":
            base_path = settings.database_url.replace("sqlite:///", "")
            db_dir = os.path.dirname(base_path) if os.path.dirname(base_path) else "."
            db_name = os.path.splitext(os.path.basename(base_path))[0]
            tenant_db_path = os.path.join(db_dir, f"{db_name}_tenant_{tenant_id}.db")
            return f"sqlite:///{tenant_db_path}"
        else:
            # For PostgreSQL, use schema-based multi-tenancy or separate databases
            return settings.database_url.replace("/profitpath", f"/profitpath_tenant_{tenant_id}")
    return settings.database_url


async def get_tenant_db_url(tenant_id: str):
    """Get database URL for specific tenant"""
    # First try to get from tenant config manager
    try:
        return await tenant_config_manager.get_database_url(tenant_id)
    except Exception:
        # Fallback to generating URL based on tenant_id
        return get_db_url(int(tenant_id) if tenant_id.isdigit() else None)


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
        if "sqlite" in database_url:
            # SQLite async configuration
            async_database_url = database_url.replace("sqlite:///", "sqlite+aiosqlite:///")
            engine = create_async_engine(
                async_database_url,
                pool_pre_ping=True,
                echo=settings.debug,
                connect_args={"check_same_thread": False}
            )
            configure_async_sqlite_engine(engine)
        else:
            # PostgreSQL async configuration
            async_database_url = database_url.replace("postgresql://", "postgresql+asyncpg://")
            engine = create_async_engine(
                async_database_url,
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

