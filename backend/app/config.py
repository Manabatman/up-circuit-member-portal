"""Typed environment configuration — fail-loud at process start if required vars are missing."""

from typing import Literal

from pydantic import AnyHttpUrl, EmailStr, PostgresDsn, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore",
    )

    app_env: Literal["local", "dev", "production"]
    database_url: PostgresDsn
    migrator_database_url: PostgresDsn
    frontend_origin: AnyHttpUrl
    # Unused in M0. Empty is valid locally (console mailer / no cleanup Action).
    brevo_api_key: str = ""
    email_from: EmailStr = "portal@example.org"
    maintenance_token: str = ""
    # When false, password login creates a session immediately (beta without Brevo).
    login_otp_required: bool = True
    # lax for same-site; none for cross-site frontend/API hosts (Vercel + Render).
    session_cookie_samesite: Literal["lax", "none"] = "lax"

    @model_validator(mode="after")
    def hosted_env_requires_email(self) -> "Settings":
        if (
            self.app_env in ("dev", "production")
            and self.login_otp_required
            and not self.brevo_api_key.strip()
        ):
            raise ValueError(
                "BREVO_API_KEY must be set when APP_ENV is dev or production "
                "and LOGIN_OTP_REQUIRED is true."
            )
        return self

    @model_validator(mode="after")
    def default_samesite_for_hosted(self) -> "Settings":
        if self.app_env != "local" and self.session_cookie_samesite == "lax":
            object.__setattr__(self, "session_cookie_samesite", "none")
        return self

    def sqlalchemy_database_url(self) -> str:
        """psycopg3 needs the +psycopg driver prefix; .env keeps postgresql://."""
        return _as_psycopg_url(str(self.database_url))

    def sqlalchemy_migrator_url(self) -> str:
        return _as_psycopg_url(str(self.migrator_database_url))


def _as_psycopg_url(url: str) -> str:
    if url.startswith("postgresql+psycopg://"):
        return url
    if url.startswith("postgresql://"):
        return "postgresql+psycopg://" + url.removeprefix("postgresql://")
    return url


settings = Settings()
