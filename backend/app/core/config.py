from functools import lru_cache

from pydantic import Field, computed_field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "Civic Copilot API"
    PROJECT_VERSION: str = "0.1.0"
    API_V1_PREFIX: str = "/api/v1"

    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_DB: str = "civic_copilot"
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"

    DATABASE_URL: str | None = None

    CORS_ORIGINS: list[str] = Field(
        default_factory=lambda: ["http://localhost:5173", "http://localhost:3000"]
    )

    UPLOAD_DIR: str = "uploads"
    NLP_SERVICE_URL: str = "http://localhost:9001/process"
    NLP_SERVICE_TIMEOUT_SECONDS: float = 30.0
    CV_SERVICE_URL: str = "http://localhost:9002/detect"
    CV_SERVICE_TIMEOUT_SECONDS: float = 20
    INTEGRATION_RETRY_ATTEMPTS: int = 3
    INTEGRATION_RETRY_BACKOFF_SECONDS: float = 0.5

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
    )

    @computed_field
    @property
    def SQLALCHEMY_DATABASE_URI(self) -> str:
        if self.DATABASE_URL:
            return self.DATABASE_URL
        return (
            "postgresql+psycopg://"
            f"{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            f"@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
