#!/usr/bin/env python3
"""Create or update a SUPER_ADMIN user for production bootstrap."""

from __future__ import annotations

import os
import sys
from datetime import UTC, datetime
from pathlib import Path

from sqlalchemy import create_engine, func, select
from sqlalchemy.orm import Session, sessionmaker

REPO_ROOT = Path(__file__).resolve().parents[1]
BACKEND_ROOT = REPO_ROOT / "backend"
sys.path.insert(0, str(BACKEND_ROOT))


def _read_env_file(path: Path) -> dict[str, str]:
    if not path.exists():
        return {}
    values: dict[str, str] = {}
    for line in path.read_text(encoding="utf-8-sig").splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("#") or "=" not in stripped:
            continue
        key, _, value = stripped.partition("=")
        values[key.strip()] = value.strip()
    return values


def main() -> None:
    file_env = _read_env_file(BACKEND_ROOT / ".env")
    for key, value in file_env.items():
        os.environ.setdefault(key, value)

    email = os.environ.get("ADMIN_EMAIL", "").strip().lower()
    password = os.environ.get("ADMIN_PASSWORD", "")
    full_name = os.environ.get("ADMIN_FULL_NAME", "Portal Administrator").strip()

    if not email or len(password) < 12:
        raise SystemExit(
            "Set ADMIN_EMAIL and ADMIN_PASSWORD (min 12 chars) in the environment."
        )

    from app.auth.passwords import hash_password
    from app.config import settings
    from app.models.academic_year import AcademicYear
    from app.models.membership_term import MembershipTerm
    from app.models.profile import Profile
    from app.models.role import Role, UserRole
    from app.models.user import User

    engine = create_engine(settings.sqlalchemy_database_url())
    SessionLocal = sessionmaker(bind=engine)
    db: Session = SessionLocal()

    try:
        current_year = db.scalar(
            select(AcademicYear).where(AcademicYear.is_current.is_(True))
        )
        if current_year is None:
            raise SystemExit("No current academic year — run migrations first.")

        super_role = db.scalar(
            select(Role).where(Role.name == "SUPER_ADMIN", Role.is_active.is_(True))
        )
        member_role = db.scalar(
            select(Role).where(Role.name == "MEMBER", Role.is_active.is_(True))
        )
        if super_role is None or member_role is None:
            raise SystemExit("Required roles missing — run migrations first.")

        now = datetime.now(UTC)
        user = db.scalar(select(User).where(func.lower(User.email) == email))
        if user is None:
            user = User(
                email=email,
                password_hash=hash_password(password),
                activated_at=now,
                is_active=True,
                created_at=now,
                updated_at=now,
            )
            db.add(user)
            db.flush()
            db.add(Profile(user_id=user.id, full_name=full_name, created_at=now, updated_at=now))
        else:
            user.password_hash = hash_password(password)
            user.is_active = True
            user.deleted_at = None
            user.updated_at = now

        for role in (member_role, super_role):
            exists = db.scalar(
                select(UserRole).where(
                    UserRole.user_id == user.id, UserRole.role_id == role.id
                )
            )
            if exists is None:
                db.add(
                    UserRole(
                        user_id=user.id,
                        role_id=role.id,
                        assigned_at=now,
                    )
                )

        term = db.scalar(
            select(MembershipTerm).where(
                MembershipTerm.user_id == user.id,
                MembershipTerm.academic_year_id == current_year.id,
            )
        )
        if term is None:
            db.add(
                MembershipTerm(
                    user_id=user.id,
                    academic_year_id=current_year.id,
                    status="RENEWED",
                    renewed_at=now,
                    created_at=now,
                    updated_at=now,
                )
            )
        else:
            term.status = "RENEWED"
            term.renewed_at = now
            term.updated_at = now

        db.commit()
        print(f"Admin ready: {email}")
    finally:
        db.close()


if __name__ == "__main__":
    main()
