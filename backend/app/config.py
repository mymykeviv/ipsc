from pydantic_settings import BaseSettings
import os


class Settings(BaseSettings):
    database_url: str = "sqlite:///cashflow.db"
    test_database_url: str = "sqlite:///:memory:"
    secret_key: str = "dev-secret"
    access_token_expire_minutes: int = 30
    debug: bool = False
    log_level: str = "INFO"
    smtp_host: str = "localhost"
    smtp_port: int = 1025
    smtp_user: str | None = None
    smtp_password: str | None = None
    smtp_from: str = "no-reply@localhost"
    smtp_enabled: bool = False

    class Config:
        env_file = [".env", ".env.local"]

    def get_database_url(self):
        """Get database URL, using test database if TESTING environment variable is set"""
        if os.getenv("TESTING"):
            return self.test_database_url
        return self.database_url


settings = Settings()

