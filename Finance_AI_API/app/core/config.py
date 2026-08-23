from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # =====================================
    # APP
    # =====================================

    APP_NAME: str = "Finance AI API"
    APP_VERSION: str = "1.0.0-rc.1"
    ENVIRONMENT: str = "production"

    HOST: str = "127.0.0.1"
    PORT: int = 8000
    CORS_ORIGINS: str = "*"

    # =====================================
    # OPENAI
    # =====================================

    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-5.5"
    OPENAI_MAX_OUTPUT_TOKENS: int = Field(default=220, ge=1, le=1000)
    OPENAI_TIMEOUT_SECONDS: float = Field(default=30, gt=0, le=120)
    OPENAI_MAX_RETRIES: int = Field(default=1, ge=0, le=2)
    OPENAI_MAX_CONTEXT_CHARS: int = Field(default=12_000, ge=1000, le=50_000)
    OPENAI_OCR_MODEL: str = "gpt-4.1-mini"
    OCR_MAX_FILE_SIZE_MB: int = 10

    # =====================================
    # FIREBASE
    # =====================================

    FIREBASE_PROJECT_ID: str = ""
    FIREBASE_PRIVATE_KEY: str = ""
    FIREBASE_CLIENT_EMAIL: str = ""
    FIREBASE_PRIVATE_KEY_ID: str = ""
    FIREBASE_CLIENT_ID: str = ""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]


settings = Settings()
