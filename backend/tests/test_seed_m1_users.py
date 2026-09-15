"""Regression: seed must use backend/.env even when shell env is stale."""

from __future__ import annotations

import os
import subprocess
import sys
from pathlib import Path

import pytest
from sqlalchemy import create_engine, delete, func, select
from sqlalchemy.orm import Session

BACKEND_ROOT = Path(__file__).resolve().parents[1]
REPO_ROOT = BACKEND_ROOT.parent
SEED_SCRIPT = REPO_ROOT / "scripts" / "seed_m1_users.py"

_DEMO_EMAILS = (
    "renewed.member@up.edu.ph",
    "notrenewed.member@up.edu.ph",
    "academic.admin@up.edu.ph",
)


@pytest.fixture
def local_password_from_file() -> str:
    for line in (BACKEND_ROOT / ".env").read_text(encoding="utf-8-sig").splitlines():
        s = line.strip()
        if s.startswith("DEV_SEED_PASSWORD="):
            return s.split("=", 1)[1]
    pytest.skip("DEV_SEED_PASSWORD not configured in backend/.env")


def _cleanup_demo_users() -> None:
    """Remove demo users committed by the seed subprocess (outside test transactions)."""
    from app.config import settings
    from app.models.auth_attempt import AuthAttempt
    from app.models.auth_token import AuthToken
    from app.models.membership_term import MembershipTerm
    from app.models.profile import Profile
    from app.models.role import UserRole
    from app.models.session import Session as UserSession
    from app.models.user import User

    engine = create_engine(settings.sqlalchemy_database_url())
    with Session(engine) as db:
        for email in _DEMO_EMAILS:
            user = db.scalar(select(User).where(func.lower(User.email) == email))
            if user is None:
                continue
            db.execute(delete(AuthAttempt).where(AuthAttempt.email == email))
            db.execute(delete(AuthToken).where(AuthToken.user_id == user.id))
            db.execute(delete(UserSession).where(UserSession.user_id == user.id))
            db.execute(delete(MembershipTerm).where(MembershipTerm.user_id == user.id))
            db.execute(delete(UserRole).where(UserRole.user_id == user.id))
            db.execute(delete(Profile).where(Profile.user_id == user.id))
            db.delete(user)
        db.commit()
    engine.dispose()


def test_seed_uses_backend_env_file_not_stale_shell_var(
    local_password_from_file: str,
) -> None:
    """Stale DEV_SEED_PASSWORD in the shell must not override backend/.env."""
    stale = "stale-shell-password-12chars"
    assert stale != local_password_from_file

    env = os.environ.copy()
    env["DEV_SEED_PASSWORD"] = stale
    env["PYTHONPATH"] = str(BACKEND_ROOT)
    # subprocess inherits test DB URLs from pytest's conftest overrides

    try:
        result = subprocess.run(
            [sys.executable, str(SEED_SCRIPT)],
            cwd=str(BACKEND_ROOT),
            env=env,
            capture_output=True,
            text=True,
        )
        assert result.returncode == 0, result.stderr or result.stdout

        from app.auth.passwords import verify_password
        from app.config import settings
        from app.models.user import User

        engine = create_engine(settings.sqlalchemy_database_url())
        with Session(engine) as db:
            user = db.scalar(
                select(User).where(func.lower(User.email) == "renewed.member@up.edu.ph")
            )
            assert user is not None
            assert user.password_hash is not None
            assert verify_password(local_password_from_file, user.password_hash)
            assert not verify_password(stale, user.password_hash)
    finally:
        _cleanup_demo_users()
