from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # App
    ENV: str = "development"
    API_V1_PREFIX: str = "/api/v1"
    CORS_ORIGINS: list[str] = ["http://localhost:3000", "http://localhost:5173"]

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://hrms:hrms@localhost:5432/hrms"

    # JWT — separate secrets so a leaked access secret can't mint refresh tokens
    JWT_ACCESS_SECRET: str = "change-me-access-secret"
    JWT_REFRESH_SECRET: str = "change-me-refresh-secret"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 20
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Email verification
    EMAIL_VERIFICATION_TOKEN_EXPIRE_HOURS: int = 24
    SMTP_HOST: str | None = None
    SMTP_PORT: int = 587
    SMTP_USER: str | None = None
    SMTP_PASSWORD: str | None = None
    MAIL_FROM: str = "no-reply@hrms.local"
    FRONTEND_BASE_URL: str = "http://localhost:5173"

    # Storage
    UPLOAD_DIR: str = "uploads"


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
