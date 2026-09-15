"""Auth test helpers."""

from __future__ import annotations

from datetime import UTC, datetime

from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth.deps import AuthContext
from app.auth.passwords import hash_password
from app.config import settings
from app.email.sender import CapturingEmailSender
from app.models.academic_year import AcademicYear
from app.models.membership_term import MembershipTerm
from app.models.profile import Profile
from app.models.role import Role, UserRole
from app.models.user import User

TEST_PASSWORD = "test-runtime-password-12chars"
ORIGIN = str(settings.frontend_origin).rstrip("/")


def json_headers(extra: dict | None = None) -> dict[str, str]:
    headers = {"Origin": ORIGIN, "Content-Type": "application/json"}
    if extra:
        headers.update(extra)
    return headers


def create_user(
    db: Session,
    *,
    email: str,
    full_name: str,
    role_names: list[str],
    membership_status: str | None = "RENEWED",
) -> User:
    user = User(
        email=email.lower(),
        password_hash=hash_password(TEST_PASSWORD),
        activated_at=datetime.now(UTC),
        is_active=True,
    )
    db.add(user)
    db.flush()
    db.add(Profile(user_id=user.id, full_name=full_name))

    for role_name in role_names:
        role = db.scalar(select(Role).where(Role.name == role_name))
        assert role is not None
        db.add(UserRole(user_id=user.id, role_id=role.id))

    if membership_status is not None:
        current_year = db.scalar(
            select(AcademicYear).where(AcademicYear.is_current.is_(True))
        )
        assert current_year is not None
        db.add(
            MembershipTerm(
                user_id=user.id,
                academic_year_id=current_year.id,
                status=membership_status,
                renewed_at=datetime.now(UTC) if membership_status == "RENEWED" else None,
            )
        )

    db.commit()
    db.refresh(user)
    return user


def login_flow(
    client: TestClient,
    *,
    email: str,
    password: str = TEST_PASSWORD,
    code: str | None = None,
) -> None:
    response = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": password},
        headers=json_headers(),
    )
    assert response.status_code == 200, response.text
    otp = code or CapturingEmailSender.last_code
    assert otp is not None
    verify = client.post(
        "/api/v1/auth/verify-code",
        json={"email": email, "code": otp},
        headers=json_headers(),
    )
    assert verify.status_code == 200, verify.text


def build_context(db: Session, user: User) -> AuthContext:
    from app.auth.deps import build_auth_context

    profile = db.scalar(select(Profile).where(Profile.user_id == user.id))
    assert profile is not None
    return build_auth_context(db, user, profile)
