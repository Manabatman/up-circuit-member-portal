#!/usr/bin/env python3
"""Seed M1 demo users from DEV_SEED_PASSWORD in backend/.env (gitignored)."""

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
    """Read .env — file values win over any stale shell environment."""
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

    # Password always comes from backend/.env — never a stale shell variable.
    password = file_env.get("DEV_SEED_PASSWORD", "")

    # Preserve DATABASE_URL overrides (e.g. pytest pointing at upcircuit_test).
    db_override = os.environ.get("DATABASE_URL")
    migrator_override = os.environ.get("MIGRATOR_DATABASE_URL")

    for key, value in file_env.items():
        os.environ[key] = value

    if db_override:
        os.environ["DATABASE_URL"] = db_override
    if migrator_override:
        os.environ["MIGRATOR_DATABASE_URL"] = migrator_override
    if len(password) < 12:
        raise SystemExit(
            "DEV_SEED_PASSWORD must be set in backend/.env and be at least 12 characters."
        )

    if "DATABASE_URL" not in file_env:
        raise SystemExit("DATABASE_URL missing from backend/.env")

    from app.auth.passwords import hash_password, verify_password
    from app.config import settings
    from app.models.academic_year import AcademicYear
    from app.models.division import Division
    from app.models.membership_term import MembershipTerm
    from app.models.profile import Profile
    from app.models.role import Role, UserRole
    from app.models.user import User

    if settings.app_env == "production":
        raise SystemExit("Refusing to seed demo users when APP_ENV=production.")

    engine = create_engine(settings.sqlalchemy_database_url())
    SessionLocal = sessionmaker(bind=engine)
    db: Session = SessionLocal()

    try:
        current_year = db.scalar(
            select(AcademicYear).where(AcademicYear.is_current.is_(True))
        )
        if current_year is None:
            raise SystemExit("No current academic year configured.")

        password_hash = hash_password(password)
        now = datetime.now(UTC)

        division_by_email = {
            "renewed.member@up.edu.ph": "Academic Affairs Division",
            "notrenewed.member@up.edu.ph": "External Affairs Division",
            "academic.admin@up.edu.ph": "Finance Division",
            "renewals.admin@up.edu.ph": "Internal Affairs Division",
            "super.admin@up.edu.ph": "Publicity Division",
        }

        users = [
            {
                "email": "renewed.member@up.edu.ph",
                "full_name": "Lebron James",
                "roles": ["MEMBER"],
                "status": "RENEWED",
                "profile": {
                    "degree_program": "BS EE",
                    "year_level": "3",
                    "batch": "2023",
                    "student_number": "202301001",
                    "contact_number": "09170000001",
                },
            },
            {
                "email": "notrenewed.member@up.edu.ph",
                "full_name": "Stephen curry",
                "roles": ["MEMBER"],
                "status": "NOT_RENEWED",
                "profile": {
                    "degree_program": "BS EE",
                    "year_level": "2",
                    "batch": "2024",
                    "student_number": "202401002",
                    "contact_number": "09170000002",
                },
            },
            {
                "email": "academic.admin@up.edu.ph",
                "full_name": "Sadie Sink",
                "roles": ["MEMBER", "ACADEMIC_ADMIN"],
                "status": "NOT_RENEWED",
                "profile": {
                    "degree_program": "BS EE",
                    "year_level": "4",
                    "batch": "2022",
                    "student_number": "202201003",
                    "contact_number": "09170000003",
                },
            },
            {
                "email": "renewals.admin@up.edu.ph",
                "full_name": "Lakan Fuentez",
                "roles": ["MEMBER", "RENEWALS_ADMIN"],
                "status": "RENEWED",
                "profile": {
                    "degree_program": "BS EE",
                    "year_level": "4",
                    "batch": "2022",
                    "student_number": "202201004",
                    "contact_number": "09170000004",
                },
            },
            {
                "email": "super.admin@up.edu.ph",
                "full_name": "Dustin Henderson",
                "roles": ["MEMBER", "SUPER_ADMIN"],
                "status": "RENEWED",
                "profile": {
                    "degree_program": "BS EE",
                    "year_level": "4",
                    "batch": "2022",
                    "student_number": "202201005",
                    "contact_number": "09170000005",
                },
            },
        ]

        for spec in users:
            email = spec["email"]
            user = db.scalar(select(User).where(func.lower(User.email) == email))
            if user is None:
                user = User(
                    email=email,
                    password_hash=password_hash,
                    activated_at=now,
                    is_active=True,
                )
                db.add(user)
                db.flush()
                db.add(
                    Profile(
                        user_id=user.id,
                        full_name=spec["full_name"],
                        **spec.get("profile", {}),
                    )
                )
            else:
                user.password_hash = password_hash
                user.activated_at = now
                user.is_active = True
                user.locked_until = None
                profile = db.scalar(select(Profile).where(Profile.user_id == user.id))
                if profile:
                    profile.full_name = spec["full_name"]
                    for key, value in spec.get("profile", {}).items():
                        setattr(profile, key, value)
                else:
                    db.add(
                        Profile(
                            user_id=user.id,
                            full_name=spec["full_name"],
                            **spec.get("profile", {}),
                        )
                    )

            division_name = division_by_email.get(email)
            if division_name:
                division = db.scalar(select(Division).where(Division.name == division_name))
                profile = db.scalar(select(Profile).where(Profile.user_id == user.id))
                if division and profile:
                    profile.primary_division_id = division.id

            for role_name in spec["roles"]:
                role = db.scalar(select(Role).where(Role.name == role_name))
                if role is None:
                    raise SystemExit(f"Role not found: {role_name}")
                existing = db.scalar(
                    select(UserRole).where(
                        UserRole.user_id == user.id, UserRole.role_id == role.id
                    )
                )
                if existing is None:
                    db.add(UserRole(user_id=user.id, role_id=role.id))

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
                        status=spec["status"],
                        renewed_at=now if spec["status"] == "RENEWED" else None,
                    )
                )
            else:
                term.status = spec["status"]
                term.renewed_at = now if spec["status"] == "RENEWED" else None

        db.commit()

        renewed = db.scalar(
            select(User).where(func.lower(User.email) == "renewed.member@up.edu.ph")
        )
        if renewed is None or not renewed.password_hash:
            raise SystemExit("Seed failed: renewed.member@up.edu.ph missing after commit.")
        if not verify_password(password, renewed.password_hash):
            raise SystemExit(
                "Seed verification failed: database hash does not match "
                "DEV_SEED_PASSWORD from backend/.env."
            )

        print("Seeded M1 demo users (password verified against backend/.env).")
    finally:
        db.close()
        engine.dispose()


if __name__ == "__main__":
    main()
