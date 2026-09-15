"""Runtime database session.

FastAPI uses DATABASE_URL (circuit_app). Alembic uses
MIGRATOR_DATABASE_URL (circuit_migrator) in alembic/env.py — not here.
"""

from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.config import settings

engine = create_engine(settings.sqlalchemy_database_url())
SessionLocal = sessionmaker(bind=engine)


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency: one session per request, always closed."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
