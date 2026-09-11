"""Application configuration using Pydantic Settings."""
import os
from functools import lru_cache
from typing import List, Optional

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Application
    app_name: str = "Hackathon Aggregator"
    app_version: str = "1.0.0"
    debug: bool = True
    api_prefix: str = "/api"
    host: str = "0.0.0.0"
    port: int = 8000

    # Database
    database_url: str = Field(..., description="PostgreSQL async connection URL")
    database_pool_size: int = 10
    database_max_overflow: int = 20

    # Redis
    redis_url: str = "redis://localhost:6379/0"

    # Security
    secret_key: str = Field(..., description="Secret key for JWT signing")
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30

    # Scraping
    scraper_user_agent: str = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    scraper_delay_min: float = 2.0
    scraper_delay_max: float = 5.0
    scraper_timeout: int = 30
    scraper_max_retries: int = 3
    scraper_concurrent_limit: int = 3

    # Scheduler
    scheduler_timezone: str = "UTC"
    scheduler_scrape_interval_hours: int = 6

    # Rate Limiting
    rate_limit_requests: int = 100
    rate_limit_window_seconds: int = 60

    # CORS
    cors_origins: List[str] = Field(
        default_factory=lambda: ["http://localhost:5173", "http://localhost:3000", "https://cozy-hackathon-chi.vercel.app"]
    )

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, v: str | List[str]) -> List[str]:
        """Parse CORS origins from string or list."""
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",")]
        return v

    @field_validator("database_url")
    @classmethod
    def validate_database_url(cls, v: str) -> str:
        """Ensure database URL uses asyncpg driver."""
        if v.startswith("postgresql://"):
            return v.replace("postgresql://", "postgresql+asyncpg://", 1)
        return v


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()


settings = get_settings()