"""App settings and configuration loader.

Behavior:
- Values are read from environment variables if present.
- Otherwise values are read from the repository `.env` file.
- If neither environment nor `.env` provide a value, the class default is used.

If you want `.env` to be loaded from a different path, update the
`env_file` path in `model_config` below.
"""
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict
from dotenv import load_dotenv
import os


# Load .env into the process environment and let it override existing
# environment variables so .env values take precedence when Settings
# reads from the environment. This matches the requested behaviour: use
# `.env` first, then fall back to values defined in this module.
env_path = Path(__file__).resolve().parents[2] / ".env"
if env_path.exists():
    # override=True will place .env values into os.environ even if
    # variables already exist in the environment.
    load_dotenv(dotenv_path=str(env_path), override=True)


class Settings(BaseSettings):
    orm_mode: bool = True
    DEBUG: bool = True
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/pornily"
    #DATABASE_URL: str = "postgresql+asyncpg://postgres:Gj1sG7JHNvTbUON1rWtm@aichat-pronily.c7sw0kqsq1e1.eu-north-1.rds.amazonaws.com:5432/aichat_pronliy"

    OPENAI_API_KEY: str = ""
    JWT_SECRET: str = "aichat_secret_key_api"
    JWT_ALGORITHM: str = "HS256"

    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_USER: str = "robert2398@gmail.com"
    SMTP_PORT: int = 587
    SMTP_PASSWORD: str = ""

    API_TOKEN: str = ""
    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""

    # Stripe keys (present in your .env). Declare them here so
    # pydantic doesn't treat them as unexpected/extra inputs.
    STRIPE_API_KEY: str | None = None
    STRIPE_WEBHOOK_SECRET: str | None = None
    STRIPE_PUBLISHABLE_KEY: str | None = None

    # Tell pydantic-settings where to look for the .env file. This points
    # to the repository root `.env` (two parents up from this file).
    model_config = SettingsConfigDict(
        env_file=str(Path(__file__).resolve().parents[2] / ".env"),
        env_file_encoding="utf-8",
    )


settings = Settings()
