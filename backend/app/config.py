from pydantic_settings import BaseSettings
from typing import Optional, List, Dict, Set
import os
from functools import lru_cache


# Public endpoints that don't require tenant context
PUBLIC_ENDPOINTS: Set[str] = {
    # Health and status endpoints
    "/health",
    "/api/health",
    "/version",
    "/config",
    
    # Documentation endpoints
    "/docs",
    "/openapi.json",
    "/redoc",
    "/api/docs",
    "/api/openapi.json",
    
    # Static assets
    "/favicon.ico",
    "/static",
    
    # Authentication endpoints
    "/api/auth/login",
    "/api/auth/register",
    "/api/auth/logout",
    "/api/auth/refresh",
    
    # Tenant management endpoints
    "/api/tenants",
    "/api/tenants/create",
    "/api/tenants/validate-slug",
    "/api/tenants/validate-domain",
    
    # System endpoints
    "/metrics",
    "/system/status",
    "/health/detailed",
    "/health/ready",
    "/health/live"
}

# Feature-to-path mappings for tenant feature access control
FEATURE_PATHS: Dict[str, List[str]] = {
    'patient_management': [
        '/api/patients',
        '/api/treatments',
        '/api/appointments',
        '/api/patient-records'
    ],
    'treatment_tracking': [
        '/api/treatments',
        '/api/treatment-history',
        '/api/patient-treatments',
        '/api/treatment-plans'
    ],
    'dental_supplies': [
        '/api/dental-supplies',
        '/api/supply-inventory',
        '/api/supply-orders',
        '/api/dental-equipment'
    ],
    'bom_management': [
        '/api/bom',
        '/api/bill-of-materials',
        '/api/bom-components',
        '/api/material-requirements'
    ],
    'production_tracking': [
        '/api/production',
        '/api/production-orders',
        '/api/production-status',
        '/api/work-orders'
    ],
    'material_management': [
        '/api/materials',
        '/api/material-requirements',
        '/api/material-inventory',
        '/api/material-orders'
    ],
    'inventory_management': [
        '/api/inventory',
        '/api/stock',
        '/api/stock-movements',
        '/api/stock-adjustments'
    ],
    'financial_management': [
        '/api/invoices',
        '/api/payments',
        '/api/expenses',
        '/api/cashflow'
    ],
    'reporting': [
        '/api/reports',
        '/api/analytics',
        '/api/dashboard',
        '/api/metrics'
    ]
}

# Endpoint categories for better organization
ENDPOINT_CATEGORIES: Dict[str, List[str]] = {
    'health': [
        '/health',
        '/api/health',
        '/health/detailed',
        '/health/ready',
        '/health/live'
    ],
    'documentation': [
        '/docs',
        '/openapi.json',
        '/redoc',
        '/api/docs',
        '/api/openapi.json'
    ],
    'authentication': [
        '/api/auth/login',
        '/api/auth/register',
        '/api/auth/logout',
        '/api/auth/refresh'
    ],
    'tenant_management': [
        '/api/tenants',
        '/api/tenants/create',
        '/api/tenants/validate-slug',
        '/api/tenants/validate-domain'
    ],
    'system': [
        '/metrics',
        '/system/status',
        '/version',
        '/config'
    ]
}


def is_public_endpoint(path: str) -> bool:
    """
    Check if an endpoint is public (doesn't require tenant context)
    
    Args:
        path: The request path to check
        
    Returns:
        bool: True if the endpoint is public, False otherwise
    """
    return any(path.startswith(public_path) for public_path in PUBLIC_ENDPOINTS)


def get_required_feature(path: str) -> str:
    """
    Get the required feature for a given path
    
    Args:
        path: The request path to check
        
    Returns:
        str: The required feature name, or None if no feature is required
    """
    for feature, paths in FEATURE_PATHS.items():
        if any(path.startswith(feature_path) for feature_path in paths):
            return feature
    return None


def get_endpoint_category(path: str) -> str:
    """
    Get the category for a given endpoint
    
    Args:
        path: The request path to check
        
    Returns:
        str: The endpoint category, or 'unknown' if not categorized
    """
    for category, paths in ENDPOINT_CATEGORIES.items():
        if any(path.startswith(category_path) for category_path in paths):
            return category
    return 'unknown'


def get_all_public_endpoints() -> Set[str]:
    """
    Get all public endpoints
    
    Returns:
        Set[str]: Set of all public endpoint paths
    """
    return PUBLIC_ENDPOINTS.copy()


def get_all_features() -> List[str]:
    """
    Get all available features
    
    Returns:
        List[str]: List of all feature names
    """
    return list(FEATURE_PATHS.keys())


def get_feature_paths(feature: str) -> List[str]:
    """
    Get all paths for a specific feature
    
    Args:
        feature: The feature name
        
    Returns:
        List[str]: List of paths for the feature
    """
    return FEATURE_PATHS.get(feature, [])


def add_public_endpoint(path: str) -> None:
    """
    Add a new public endpoint
    
    Args:
        path: The path to add as public
    """
    PUBLIC_ENDPOINTS.add(path)


def remove_public_endpoint(path: str) -> None:
    """
    Remove a public endpoint
    
    Args:
        path: The path to remove from public endpoints
    """
    PUBLIC_ENDPOINTS.discard(path)


def add_feature_paths(feature: str, paths: List[str]) -> None:
    """
    Add paths for a new feature
    
    Args:
        feature: The feature name
        paths: List of paths for the feature
    """
    if feature not in FEATURE_PATHS:
        FEATURE_PATHS[feature] = []
    FEATURE_PATHS[feature].extend(paths)


class Settings(BaseSettings):
    # Application Settings
    app_name: str = "ProfitPath Backend"
    version: str = "1.4.4"
    debug: bool = False
    environment: str = "development"
    
    # Database Settings - PostgreSQL Only
    database_url: str = "postgresql+psycopg://postgres:postgres@localhost:5432/cashflow"
    database_pool_size: int = 10
    database_max_overflow: int = 20
    database_pool_timeout: int = 30
    
    # Security Settings
    secret_key: str = "your-secret-key-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    # CORS Settings
    allowed_origins: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000", 
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000"
    ]
    
    # Server Settings
    host: str = "0.0.0.0"
    port: int = 8000
    reload: bool = True
    
    # Logging Settings
    log_level: str = "INFO"
    log_format: str = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    
    # Email Settings (for future use)
    smtp_host: Optional[str] = None
    smtp_port: int = 587
    smtp_username: Optional[str] = None
    smtp_password: Optional[str] = None
    smtp_use_tls: bool = True
    
    # File Upload Settings
    upload_dir: str = "uploads"
    max_file_size: int = 10 * 1024 * 1024  # 10MB
    
    # Redis Settings (for caching, future use)
    redis_url: Optional[str] = None
    
    # Monitoring Settings
    enable_metrics: bool = False
    metrics_port: int = 9090
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False
        
    @classmethod
    def parse_env_var(cls, field_name: str, raw_val: str):
        """Parse environment variables"""
        if field_name == "allowed_origins" and raw_val:
            return [origin.strip() for origin in raw_val.split(",")]
        return raw_val


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()


# Environment-specific configurations
class DevelopmentSettings(Settings):
    debug: bool = True
    environment: str = "development"
    log_level: str = "DEBUG"
    reload: bool = True
    database_url: str = "postgresql+psycopg://postgres:postgres@localhost:5432/cashflow"


class ProductionSettings(Settings):
    debug: bool = False
    environment: str = "production"
    log_level: str = "WARNING"
    reload: bool = False
    allowed_origins: List[str] = [
        "https://yourdomain.com",
        "https://www.yourdomain.com"
    ]


class TestingSettings(Settings):
    debug: bool = True
    environment: str = "testing"
    log_level: str = "DEBUG"
    database_url: str = "postgresql+psycopg://postgres:postgres@localhost:5432/profitpath_test"


# Global settings instance
settings = get_settings()

