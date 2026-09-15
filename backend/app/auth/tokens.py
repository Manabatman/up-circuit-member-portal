"""Token helpers: OTP generation, SHA-256 hashing, session tokens."""

import hashlib
import hmac
import secrets
from datetime import UTC, datetime, timedelta

OTP_TTL = timedelta(minutes=10)
OTP_MAX_ATTEMPTS = 5

SESSION_IDLE = timedelta(days=7)
SESSION_ABSOLUTE = timedelta(days=30)
SESSION_SLIDE_INTERVAL = timedelta(minutes=15)


def generate_otp() -> str:
    return f"{secrets.randbelow(1_000_000):06d}"


def hash_token(raw: str) -> str:
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def verify_token_hash(raw: str, stored_hash: str) -> bool:
    return hmac.compare_digest(hash_token(raw), stored_hash)


def generate_session_token() -> str:
    return secrets.token_urlsafe(32)


def utcnow() -> datetime:
    return datetime.now(UTC)


def otp_expires_at(now: datetime | None = None) -> datetime:
    return (now or utcnow()) + OTP_TTL


def session_expires_at(created_at: datetime, now: datetime | None = None) -> datetime:
    """Initial or slid expiry: min(idle window, absolute cap)."""
    current = now or utcnow()
    idle_cap = current + SESSION_IDLE
    absolute_cap = created_at + SESSION_ABSOLUTE
    return min(idle_cap, absolute_cap)


def should_slide_session(last_used_at: datetime, now: datetime | None = None) -> bool:
    current = now or utcnow()
    return current - last_used_at >= SESSION_SLIDE_INTERVAL
