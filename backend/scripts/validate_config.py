#!/usr/bin/env python3
"""
Configuration validation script for CASHFLOW Backend
Validates environment variables and configuration settings
"""

import os
import sys
from pathlib import Path

# Add the app directory to the Python path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.config import settings, get_environment_settings
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def validate_database_config():
    """Validate database configuration"""
    logger.info("Validating database configuration...")
    
    required_db_vars = [
        'DATABASE_URL',
    ]
    
    for var in required_db_vars:
        if not os.getenv(var) and not hasattr(settings, var.lower()):
            logger.error(f"Missing required database environment variable: {var}")
            return False
    
    logger.info("✅ Database configuration is valid")
    return True


def validate_security_config():
    """Validate security configuration"""
    logger.info("Validating security configuration...")
    
    if settings.secret_key == "your-secret-key-change-in-production":
        logger.warning("⚠️  Using default secret key. Change in production!")
    
    if settings.environment == "production":
        if settings.debug:
            logger.error("❌ Debug mode should be disabled in production")
            return False
        
        if "localhost" in settings.allowed_origins:
            logger.error("❌ Localhost origins not allowed in production")
            return False
    
    logger.info("✅ Security configuration is valid")
    return True


def validate_cors_config():
    """Validate CORS configuration"""
    logger.info("Validating CORS configuration...")
    
    if not settings.allowed_origins:
        logger.error("❌ No allowed origins configured")
        return False
    
    logger.info(f"✅ CORS configuration is valid. Allowed origins: {settings.allowed_origins}")
    return True


def validate_logging_config():
    """Validate logging configuration"""
    logger.info("Validating logging configuration...")
    
    valid_log_levels = ['DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL']
    if settings.log_level not in valid_log_levels:
        logger.error(f"❌ Invalid log level: {settings.log_level}")
        return False
    
    logger.info(f"✅ Logging configuration is valid. Level: {settings.log_level}")
    return True


def validate_environment():
    """Validate environment configuration"""
    logger.info("Validating environment configuration...")
    
    valid_environments = ['development', 'testing', 'production']
    if settings.environment not in valid_environments:
        logger.error(f"❌ Invalid environment: {settings.environment}")
        return False
    
    logger.info(f"✅ Environment configuration is valid. Environment: {settings.environment}")
    return True


def main():
    """Main validation function"""
    logger.info("🔍 Starting configuration validation...")
    
    validation_results = [
        validate_environment(),
        validate_database_config(),
        validate_security_config(),
        validate_cors_config(),
        validate_logging_config(),
    ]
    
    if all(validation_results):
        logger.info("🎉 All configuration validations passed!")
        return 0
    else:
        logger.error("❌ Configuration validation failed!")
        return 1


if __name__ == "__main__":
    sys.exit(main())
