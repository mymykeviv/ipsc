"""
Development Configuration for ProfitPath
This file contains development-specific settings that simplify the application
for faster startup and easier development.
"""

import os

# Development-specific feature flags
DEV_FEATURES = {
    # Core features (always enabled)
    "core_invoicing": True,
    "core_purchases": True,
    "core_products": True,
    "core_parties": True,
    "core_payments": True,
    "core_expenses": True,
    "core_reports": True,
    
    # Domain-specific features (disabled in development)
    "dental_management": False,
    "manufacturing_management": False,
    "quality_control": False,
    "production_orders": False,
    "work_centers": False,
    "bill_of_materials": False,
    
    # Advanced features (disabled in development)
    "multi_tenant": False,
    "advanced_security": False,
    "performance_monitoring": False,
    "security_monitoring": False,
    "database_optimization": False,
}

# Development environment variables
DEV_ENV_VARS = {
    "ENVIRONMENT": "development",
    "DEBUG": "true",
    "LOG_LEVEL": "DEBUG",
    "SECURITY_ENABLED": "false",
    "MULTI_TENANT_ENABLED": "false",
    "DATABASE_OPTIMIZATION_ENABLED": "false",
    "PERFORMANCE_MONITORING_ENABLED": "false",
    "SECURITY_MONITORING_ENABLED": "false",
}

def setup_dev_environment():
    """Setup development environment variables"""
    for key, value in DEV_ENV_VARS.items():
        if key not in os.environ:
            os.environ[key] = value

def is_feature_enabled(feature_name: str) -> bool:
    """Check if a feature is enabled in development"""
    return DEV_FEATURES.get(feature_name, False)

def get_enabled_features() -> list:
    """Get list of enabled features"""
    return [feature for feature, enabled in DEV_FEATURES.items() if enabled]

def get_disabled_features() -> list:
    """Get list of disabled features"""
    return [feature for feature, enabled in DEV_FEATURES.items() if not enabled]

