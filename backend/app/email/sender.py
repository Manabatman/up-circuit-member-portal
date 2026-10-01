"""Email delivery — console locally, Brevo in hosted environments."""

from __future__ import annotations

import logging
import sys
from typing import Protocol

import httpx

from app.config import settings


class EmailSender(Protocol):
    def send_login_otp(self, *, email: str, code: str) -> None: ...

_uvicorn_log = logging.getLogger("uvicorn.error")

BREVO_API_URL = "https://api.brevo.com/v3/smtp/email"


class ConsoleEmailSender:
    def send_login_otp(self, *, email: str, code: str) -> None:
        message = f"[OTP] login code for {email}: {code}"
        _uvicorn_log.warning(message)
        print(message, file=sys.stderr, flush=True)


class BrevoEmailSender:
    def __init__(self, api_key: str, sender: str) -> None:
        self._api_key = api_key
        self._sender = sender

    def send_login_otp(self, *, email: str, code: str) -> None:
        payload = {
            "sender": {"email": self._sender, "name": "UP Circuit Portal"},
            "to": [{"email": email}],
            "subject": "Your UP Circuit Portal login code",
            "textContent": f"Your login code is {code}. It expires in 10 minutes.",
        }
        headers = {"api-key": self._api_key, "Content-Type": "application/json"}
        with httpx.Client(timeout=15.0) as client:
            response = client.post(BREVO_API_URL, json=payload, headers=headers)
            response.raise_for_status()


class CapturingEmailSender:
    """Test double — stores the last OTP in memory."""

    last_code: str | None = None

    def send_login_otp(self, *, email: str, code: str) -> None:
        CapturingEmailSender.last_code = code


class NoOpEmailSender:
    def send_login_otp(self, *, email: str, code: str) -> None:
        _uvicorn_log.warning("[OTP disabled] login code not sent for %s", email)


def get_email_sender() -> EmailSender:
    if settings.app_env == "local":
        return ConsoleEmailSender()
    if not settings.login_otp_required:
        return NoOpEmailSender()
    if not settings.brevo_api_key.strip():
        raise RuntimeError(
            "BREVO_API_KEY is required when APP_ENV is not local and LOGIN_OTP_REQUIRED is true. "
            "Configure email or set LOGIN_OTP_REQUIRED=false for password-only beta login."
        )
    return BrevoEmailSender(settings.brevo_api_key, str(settings.email_from))
