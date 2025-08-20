#!/usr/bin/env python3
"""
Setup Tenant Databases Script
Creates and initializes databases for multi-tenant architecture
"""

import asyncio
import os
import sys
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
import logging
from pathlib import Path

# Add the backend directory to the Python path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from app.tenant_config import tenant_config_manager
from app.db import create_tenant_database, init_tenant_db
from app.config import settings

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def create_database_if_not_exists(database_name: str, database_url: str):
    """Create PostgreSQL database if it doesn't exist"""
    try:
        # Parse database URL to get connection parameters
        # Expected format: postgresql+psycopg://user:password@host:port/database
        url_parts = database_url.replace('postgresql+psycopg://', '').split('@')
        auth_part = url_parts[0]
        host_part = url_parts[1]
        
        username, password = auth_part.split(':')
        host_port, db_name = host_part.split('/')
        
        if ':' in host_port:
            host, port = host_port.split(':')
        else:
            host = host_port
            port = '5432'
        
        # Connect to PostgreSQL server (not specific database)
        conn = psycopg2.connect(
            host=host,
            port=port,
            user=username,
            password=password,
            database='postgres'  # Connect to default postgres database
        )
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        
        cursor = conn.cursor()
        
        # Check if database exists
        cursor.execute("SELECT 1 FROM pg_database WHERE datname = %s", (database_name,))
        exists = cursor.fetchone()
        
        if not exists:
            # Create database
            cursor.execute(f'CREATE DATABASE "{database_name}"')
            logger.info(f"Created database: {database_name}")
        else:
            logger.info(f"Database already exists: {database_name}")
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        logger.error(f"Error creating database {database_name}: {e}")
        raise


async def setup_tenant_databases():
    """Set up all tenant databases"""
    try:
        logger.info("Starting tenant database setup...")
        
        # Get all tenant configurations
        tenants = await tenant_config_manager.list_tenants()
        logger.info(f"Found {len(tenants)} tenants to set up")
        
        for tenant_id in tenants:
            try:
                logger.info(f"Setting up database for tenant: {tenant_id}")
                
                # Get tenant configuration
                config = await tenant_config_manager.get_tenant_config(tenant_id)
                if not config:
                    logger.error(f"Tenant configuration not found for: {tenant_id}")
                    continue
                
                # Extract database name from URL
                database_url = config.database_url
                database_name = database_url.split('/')[-1]
                
                # Create database if it doesn't exist
                create_database_if_not_exists(database_name, database_url)
                
                # Initialize database tables
                await create_tenant_database(tenant_id, database_url)
                
                logger.info(f"Successfully set up database for tenant: {tenant_id}")
                
            except Exception as e:
                logger.error(f"Failed to set up database for tenant {tenant_id}: {e}")
                continue
        
        logger.info("Tenant database setup completed")
        
    except Exception as e:
        logger.error(f"Error in tenant database setup: {e}")
        raise


async def setup_single_tenant_database():
    """Set up single tenant database for backward compatibility"""
    try:
        logger.info("Setting up single tenant database...")
        
        # Create default tenant configuration if not exists
        default_config = {
            'database_url': settings.database_url,
            'domain': 'default',
            'branding': {
                'company_name': 'Default Company',
                'primary_color': '#2E86AB'
            },
            'features': ['basic_features'],
            'gst_number': '',
            'contact_info': {},
            'is_active': True
        }
        
        await tenant_config_manager.add_tenant('default', default_config)
        
        # Extract database name from URL
        database_name = settings.database_url.split('/')[-1]
        
        # Create database if it doesn't exist
        create_database_if_not_exists(database_name, settings.database_url)
        
        # Initialize database tables
        await init_tenant_db('default')
        
        logger.info("Single tenant database setup completed")
        
    except Exception as e:
        logger.error(f"Error in single tenant database setup: {e}")
        raise


async def main():
    """Main function"""
    try:
        # Check if multi-tenant is enabled
        multi_tenant_enabled = os.getenv('MULTI_TENANT_ENABLED', 'false').lower() == 'true'
        
        if multi_tenant_enabled:
            logger.info("Multi-tenant mode enabled")
            await setup_tenant_databases()
        else:
            logger.info("Single tenant mode enabled")
            await setup_single_tenant_database()
        
        logger.info("Database setup completed successfully")
        
    except Exception as e:
        logger.error(f"Database setup failed: {e}")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
