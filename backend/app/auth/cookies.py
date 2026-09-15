"""HttpOnly session cookie helpers.

The browser stores the opaque token in the cookie.
JavaScript cannot read it (HttpOnly).
The browser sends it automatically on credentialed requests.
The backend stores only SHA-256(token) in sessions.token_hash.
"""

from datetime import UTC

from fastapi import Response

from app.config import settings

SESSION_COOKIE_NAME = "session"


def _utc_expires(expires_at) -> object:
    if expires_at.tzinfo is None:
        return expires_at.replace(tzinfo=UTC)
    return expires_at.astimezone(UTC)


def set_session_cookie(response: Response, token: str, expires_at) -> None:
    secure = settings.app_env != "local"
    response.set_cookie(
        key=SESSION_COOKIE_NAME,
        value=token,
        httponly=True,
        samesite="lax",
        secure=secure,
        path="/",
        expires=_utc_expires(expires_at),
    )


def clear_session_cookie(response: Response) -> None:
    secure = settings.app_env != "local"
    response.delete_cookie(
        key=SESSION_COOKIE_NAME,
        path="/",
        httponly=True,
        samesite="lax",
        secure=secure,
    )
