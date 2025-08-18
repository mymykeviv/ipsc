from pydantic_settings import BaseSettings
from typing import Optional, List
import os
from functools import lru_cache


class Settings(BaseSettings):
    # Application Settings
    app_name: str = "CASHFLOW Backend"
    version: str = "1.4.4"
    debug: bool = False
    environment: str = "development"
    
    # Database Settings
    database_url: str = "postgresql+psycopg://postgres:postgres@db:5432/cashflow"
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
    database_url: str = "sqlite:///./test.db"
    log_level: str = "DEBUG"


def get_environment_settings() -> Settings:
    """Get environment-specific settings"""
    env = os.getenv("ENVIRONMENT", "development").lower()
    
    if env == "production":
        return ProductionSettings()
    elif env == "testing":
        return TestingSettings()
    else:
        return DevelopmentSettings()


# Global settings instance
settings = get_environment_settings()

