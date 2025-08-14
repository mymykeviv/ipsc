from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql+psycopg://postgres:postgres@localhost:5432/cashflow"
    secret_key: str = "dev-secret"
    access_token_expire_minutes: int = 30
    smtp_host: str = "localhost"
    smtp_port: int = 1025
    smtp_user: str | None = None
    smtp_password: str | None = None
    smtp_from: str = "no-reply@localhost"
    smtp_enabled: bool = False

    class Config:
        env_file = [".env", ".env.local"]


settings = Settings()

