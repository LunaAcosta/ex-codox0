from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # =====================================
    # APP
    # =====================================

    APP_NAME: str
    APP_VERSION: str
    ENVIRONMENT: str

    HOST: str
    PORT: int
    CORS_ORIGINS: str = "http://localhost:8081,http://127.0.0.1:8081"

    # =====================================
    # OPENAI
    # =====================================

    OPENAI_API_KEY: str
    OPENAI_MODEL: str = "gpt-5.5"
    OPENAI_MAX_OUTPUT_TOKENS: int = 220
    OPENAI_OCR_MODEL: str = "gpt-4.1-mini"
    OCR_MAX_FILE_SIZE_MB: int = 10

    # =====================================
    # FIREBASE
    # =====================================

    FIREBASE_PROJECT_ID: str = ""
    FIREBASE_PRIVATE_KEY: str = ""
    FIREBASE_CLIENT_EMAIL: str = ""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]


settings = Settings()
