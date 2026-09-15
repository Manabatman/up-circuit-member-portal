"""Authentication business logic: login, OTP, sessions, rate limits."""

from __future__ import annotations

from datetime import timedelta

import ipaddress

from sqlalchemy import func, select, update
from sqlalchemy.orm import Session

from app.auth.passwords import dummy_verify, hash_password, verify_password
from app.auth.tokens import (
    OTP_MAX_ATTEMPTS,
    generate_otp,
    generate_session_token,
    hash_token,
    otp_expires_at,
    session_expires_at,
    utcnow,
    verify_token_hash,
)
from app.email.sender import EmailSender
from app.exceptions import app_http_exception
from app.models.auth_attempt import AuthAttempt
from app.models.auth_token import AuthToken
from app.models.session import Session as UserSession
from app.models.user import User

LOGIN_WINDOW = timedelta(minutes=15)
LOGIN_EMAIL_LIMIT = 5
LOGIN_IP_LIMIT = 20
OTP_IP_LIMIT = 30
LOCKOUT_DURATION = timedelta(minutes=15)


def _normalize_email(email: str) -> str:
    return email.strip().lower()


def _normalize_ip(ip_address: str | None) -> str | None:
    if not ip_address:
        return None
    try:
        return str(ipaddress.ip_address(ip_address))
    except ValueError:
        return None


def _record_attempt(
    db: Session,
    *,
    email: str,
    ip_address: str | None,
    attempt_type: str,
    success: bool,
) -> None:
    db.add(
        AuthAttempt(
            email=email,
            ip_address=_normalize_ip(ip_address),
            attempt_type=attempt_type,
            success=success,
        )
    )


def _failed_logins_for_email(db: Session, email: str) -> int:
    since = utcnow() - LOGIN_WINDOW
    return (
        db.scalar(
            select(func.count())
            .select_from(AuthAttempt)
            .where(
                AuthAttempt.email == email,
                AuthAttempt.attempt_type == "LOGIN",
                AuthAttempt.success.is_(False),
                AuthAttempt.created_at >= since,
            )
        )
        or 0
    )


def _failed_logins_for_ip(db: Session, ip_address: str | None) -> int:
    normalized = _normalize_ip(ip_address)
    if not normalized:
        return 0
    since = utcnow() - LOGIN_WINDOW
    return (
        db.scalar(
            select(func.count())
            .select_from(AuthAttempt)
            .where(
                AuthAttempt.ip_address == normalized,
                AuthAttempt.attempt_type == "LOGIN",
                AuthAttempt.success.is_(False),
                AuthAttempt.created_at >= since,
            )
        )
        or 0
    )


def _apply_lockout_if_needed(db: Session, user: User, email: str) -> None:
    failures = _failed_logins_for_email(db, email)
    if failures >= LOGIN_EMAIL_LIMIT:
        user.locked_until = utcnow() + LOCKOUT_DURATION
        db.commit()


def login_with_password(
    db: Session,
    *,
    email: str,
    password: str,
    ip_address: str | None,
    user_agent: str | None,
    email_sender: EmailSender,
) -> None:
    normalized = _normalize_email(email)

    if _failed_logins_for_ip(db, ip_address) >= LOGIN_IP_LIMIT:
        raise app_http_exception(429, "Too many attempts.", "RATE_LIMITED")

    user = db.scalar(select(User).where(func.lower(User.email) == normalized))

    if user is None:
        dummy_verify(password)
        _record_attempt(
            db, email=normalized, ip_address=ip_address, attempt_type="LOGIN", success=False
        )
        db.commit()
        raise app_http_exception(401, "Invalid credentials.", "UNAUTHORIZED")

    now = utcnow()
    if user.deleted_at is not None:
        dummy_verify(password)
        _record_attempt(
            db, email=normalized, ip_address=ip_address, attempt_type="LOGIN", success=False
        )
        db.commit()
        raise app_http_exception(401, "Invalid credentials.", "UNAUTHORIZED")

    if not user.is_active:
        raise app_http_exception(
            403, "This account has been disabled.", "ACCOUNT_DISABLED"
        )
    if user.locked_until is not None and user.locked_until > now:
        raise app_http_exception(
            403, "This account has been disabled.", "ACCOUNT_DISABLED"
        )

    if not user.password_hash or not verify_password(password, user.password_hash):
        _record_attempt(
            db, email=normalized, ip_address=ip_address, attempt_type="LOGIN", success=False
        )
        _apply_lockout_if_needed(db, user, normalized)
        db.commit()
        raise app_http_exception(401, "Invalid credentials.", "UNAUTHORIZED")

    _record_attempt(
        db, email=normalized, ip_address=ip_address, attempt_type="LOGIN", success=True
    )

    # Invalidate previous unused OTPs for this user.
    db.execute(
        update(AuthToken)
        .where(
            AuthToken.user_id == user.id,
            AuthToken.purpose == "LOGIN_OTP",
            AuthToken.used_at.is_(None),
        )
        .values(used_at=now)
    )

    code = generate_otp()
    db.add(
        AuthToken(
            user_id=user.id,
            purpose="LOGIN_OTP",
            token_hash=hash_token(code),
            expires_at=otp_expires_at(now),
        )
    )
    db.commit()
    email_sender.send_login_otp(email=normalized, code=code)


def _failed_otp_for_ip(db: Session, ip_address: str | None) -> int:
    normalized = _normalize_ip(ip_address)
    if not normalized:
        return 0
    since = utcnow() - LOGIN_WINDOW
    return (
        db.scalar(
            select(func.count())
            .select_from(AuthAttempt)
            .where(
                AuthAttempt.ip_address == normalized,
                AuthAttempt.attempt_type == "OTP",
                AuthAttempt.success.is_(False),
                AuthAttempt.created_at >= since,
            )
        )
        or 0
    )


def verify_login_otp(
    db: Session,
    *,
    email: str,
    code: str,
    ip_address: str | None,
    user_agent: str | None,
) -> str:
    normalized = _normalize_email(email)

    if _failed_otp_for_ip(db, ip_address) >= OTP_IP_LIMIT:
        raise app_http_exception(429, "Too many attempts.", "RATE_LIMITED")

    user = db.scalar(select(User).where(func.lower(User.email) == normalized))
    if user is None:
        _record_attempt(
            db, email=normalized, ip_address=ip_address, attempt_type="OTP", success=False
        )
        db.commit()
        raise app_http_exception(401, "Invalid credentials.", "UNAUTHORIZED")

    now = utcnow()
    token_row = db.scalar(
        select(AuthToken)
        .where(
            AuthToken.user_id == user.id,
            AuthToken.purpose == "LOGIN_OTP",
            AuthToken.used_at.is_(None),
            AuthToken.expires_at > now,
        )
        .order_by(AuthToken.created_at.desc())
    )

    if token_row is None:
        _record_attempt(
            db, email=normalized, ip_address=ip_address, attempt_type="OTP", success=False
        )
        db.commit()
        raise app_http_exception(401, "Invalid credentials.", "UNAUTHORIZED")

    if not verify_token_hash(code, token_row.token_hash):
        token_row.attempt_count += 1
        if token_row.attempt_count >= OTP_MAX_ATTEMPTS:
            token_row.used_at = now
        _record_attempt(
            db, email=normalized, ip_address=ip_address, attempt_type="OTP", success=False
        )
        db.commit()
        raise app_http_exception(401, "Invalid credentials.", "UNAUTHORIZED")

    _record_attempt(
        db, email=normalized, ip_address=ip_address, attempt_type="OTP", success=True
    )
    token_row.used_at = now
    user.last_login_at = now
    user.locked_until = None

    raw_session = generate_session_token()
    session_row = UserSession(
        user_id=user.id,
        token_hash=hash_token(raw_session),
        expires_at=session_expires_at(now, now),
        last_used_at=now,
        ip_address=_normalize_ip(ip_address),
        user_agent=user_agent,
        created_at=now,
        updated_at=now,
    )
    db.add(session_row)
    db.commit()
    return raw_session, session_row.expires_at


def logout_session(db: Session, *, session_token: str) -> None:
    token_hash = hash_token(session_token)
    row = db.scalar(select(UserSession).where(UserSession.token_hash == token_hash))
    if row is not None:
        db.delete(row)
        db.commit()


def hash_dev_password(plain: str) -> str:
    return hash_password(plain)
