from typing import Optional
from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DATABASE_URL: str
    SYNC_DATABASE_URL: Optional[str] = None

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @model_validator(mode="after")
    def _derive_urls(self) -> "Settings":
        # Render provides postgres:// — normalise to postgresql:// for both drivers
        raw = self.DATABASE_URL.replace("postgres://", "postgresql://", 1)

        # Async engine needs postgresql+asyncpg://
        if raw.startswith("postgresql://"):
            self.DATABASE_URL = raw.replace("postgresql://", "postgresql+asyncpg://", 1)
        elif not raw.startswith("postgresql+asyncpg://"):
            self.DATABASE_URL = raw  # already has an explicit driver, leave it

        # Sync engine (alembic / psycopg2) needs plain postgresql://
        if self.SYNC_DATABASE_URL is None:
            self.SYNC_DATABASE_URL = (
                self.DATABASE_URL
                .replace("postgresql+asyncpg://", "postgresql://", 1)
            )

        return self


settings = Settings()
