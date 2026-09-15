"""pytest fixtures for M0.

Settings are imported at process start (fail-loud). This file therefore
rewrites DATABASE_URL / MIGRATOR_DATABASE_URL to upcircuit_test *before*
importing the app. APP_ENV stays `local` — there is no APP_ENV=test.

Most tests use a rolled-back transaction so they do not leave rows behind.
"""

from __future__ import annotations

import os
import subprocess
import sys
from collections.abc import Generator
from pathlib import Path
from urllib.parse import urlparse, urlunparse

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

BACKEND_ROOT = Path(__file__).resolve().parents[1]


def _load_env_file(path: Path) -> None:
    if not path.exists():
        return
    for line in path.read_text(encoding="utf-8").splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("#") or "=" not in stripped:
            continue
        key, _, value = stripped.partition("=")
        os.environ.setdefault(key.strip(), value.strip())


def _swap_database_name(url: str, database_name: str) -> str:
    parsed = urlparse(url)
    return urlunparse(parsed._replace(path=f"/{database_name}"))


_load_env_file(BACKEND_ROOT / ".env")

if "DATABASE_URL" not in os.environ or "MIGRATOR_DATABASE_URL" not in os.environ:
    raise RuntimeError(
        "backend/.env is missing DATABASE_URL or MIGRATOR_DATABASE_URL. "
        "Copy backend/.env.example to backend/.env and set local passwords."
    )

os.environ["APP_ENV"] = "local"
os.environ["DATABASE_URL"] = _swap_database_name(os.environ["DATABASE_URL"], "upcircuit_test")
os.environ["MIGRATOR_DATABASE_URL"] = _swap_database_name(
    os.environ["MIGRATOR_DATABASE_URL"], "upcircuit_test"
)

from app.config import settings  # noqa: E402
from app.db.session import get_db  # noqa: E402
from app.email.sender import CapturingEmailSender, get_email_sender  # noqa: E402
from app.main import app  # noqa: E402


@pytest.fixture(scope="session")
def apply_migrations() -> None:
    # `python -m alembic` loads the installed package, not backend/alembic/.
    subprocess.run(
        [sys.executable, "-m", "alembic", "upgrade", "head"],
        cwd=BACKEND_ROOT,
        check=True,
    )


@pytest.fixture(scope="session", autouse=True)
def _purge_committed_demo_users(apply_migrations: None) -> None:
    """Seed regression test commits demo users outside rolled-back transactions."""
    from sqlalchemy import delete, func, select

    from app.models.auth_attempt import AuthAttempt
    from app.models.auth_token import AuthToken
    from app.models.membership_term import MembershipTerm
    from app.models.profile import Profile
    from app.models.role import UserRole
    from app.models.session import Session as UserSession
    from app.models.user import User

    demo_emails = (
        "renewed.member@up.edu.ph",
        "notrenewed.member@up.edu.ph",
        "academic.admin@up.edu.ph",
        "renewals.admin@up.edu.ph",
        "super.admin@up.edu.ph",
    )
    engine = create_engine(settings.sqlalchemy_database_url())
    with Session(engine) as db:
        for email in demo_emails:
            user = db.scalar(select(User).where(func.lower(User.email) == email))
            if user is None:
                continue
            db.execute(delete(AuthAttempt).where(AuthAttempt.email == email))
            db.execute(delete(AuthToken).where(AuthToken.user_id == user.id))
            db.execute(delete(UserSession).where(UserSession.user_id == user.id))
            db.execute(
                delete(MembershipTerm).where(MembershipTerm.user_id == user.id)
            )
            db.execute(delete(UserRole).where(UserRole.user_id == user.id))
            db.execute(delete(Profile).where(Profile.user_id == user.id))
            db.delete(user)
        db.commit()
    engine.dispose()


@pytest.fixture
def db_session(apply_migrations: None) -> Generator[Session, None, None]:
    engine = create_engine(settings.sqlalchemy_database_url())
    connection = engine.connect()
    transaction = connection.begin()
    TestingSession = sessionmaker(bind=connection)
    session = TestingSession()
    try:
        yield session
    finally:
        session.close()
        transaction.rollback()
        connection.close()
        engine.dispose()


@pytest.fixture
def capturing_email_sender(client: TestClient) -> CapturingEmailSender:
    sender = CapturingEmailSender()
    app.dependency_overrides[get_email_sender] = lambda: sender
    yield sender
    app.dependency_overrides.pop(get_email_sender, None)


@pytest.fixture
def client(db_session: Session) -> Generator[TestClient, None, None]:
    def _override_get_db() -> Generator[Session, None, None]:
        yield db_session

    app.dependency_overrides[get_db] = _override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.pop(get_db, None)
    app.dependency_overrides.pop(get_email_sender, None)
