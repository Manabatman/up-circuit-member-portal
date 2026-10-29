"""Runtime database session.

FastAPI uses DATABASE_URL (circuit_app). Alembic uses
MIGRATOR_DATABASE_URL (circuit_migrator) in alembic/env.py — not here.
"""

from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.config import settings

# Mode-independent pool health (Sprint 1.3). Do not set prepare_threshold=None
# unless production uses the Supabase transaction pooler (port 6543).
_ENGINE_KWARGS = {
    "pool_pre_ping": True,
    "pool_recycle": 300,
    "pool_size": 5,
    "max_overflow": 5,
}


def sqlalchemy_engine_kwargs() -> dict[str, object]:
    """Return SQLAlchemy create_engine pool options for tests and documentation."""
    return dict(_ENGINE_KWARGS)


engine = create_engine(settings.sqlalchemy_database_url(), **sqlalchemy_engine_kwargs())
SessionLocal = sessionmaker(bind=engine)


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency: one session per request, always closed."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
