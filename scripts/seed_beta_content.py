#!/usr/bin/env python3
"""Seed calendar/flagship events and featured academic resources for beta testing."""

from __future__ import annotations

import os
import sys
from datetime import date
from pathlib import Path

from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session, sessionmaker

REPO_ROOT = Path(__file__).resolve().parents[1]
BACKEND_ROOT = REPO_ROOT / "backend"
sys.path.insert(0, str(BACKEND_ROOT))


def _load_env() -> None:
    env_path = BACKEND_ROOT / ".env"
    if not env_path.exists():
        return
    for line in env_path.read_text(encoding="utf-8-sig").splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("#") or "=" not in stripped:
            continue
        key, _, value = stripped.partition("=")
        os.environ.setdefault(key.strip(), value.strip())


def main() -> None:
    _load_env()
    from app.config import settings
    from app.models.division import Division  # noqa: F401
    from app.models.event import Event
    from app.models.profile import Profile  # noqa: F401
    from app.models.resource import Resource, ResourceCategory
    from app.models.user import User  # noqa: F401

    if settings.app_env == "production":
        raise SystemExit("Refusing to seed beta demo content when APP_ENV=production.")

    engine = create_engine(settings.sqlalchemy_database_url())
    SessionLocal = sessionmaker(bind=engine)
    db: Session = SessionLocal()

    try:
        events = [
            {
                "title": "Apprenticeship Season",
                "description": "Organization-wide apprenticeship activities.",
                "category": "ORGANIZATION",
                "starts_on": date(2026, 10, 1),
                "ends_on": date(2026, 10, 31),
                "is_flagship": False,
                "display_order": 0,
            },
            {
                "title": "General Assembly",
                "description": "Monthly GA for all members.",
                "category": "ORGANIZATION",
                "starts_on": date(2026, 10, 15),
                "ends_on": None,
                "is_flagship": False,
                "display_order": 1,
            },
            {
                "title": "SquEEEze",
                "description": "Circuit flagship outreach program.",
                "category": "EVENT",
                "starts_on": date(2026, 11, 1),
                "ends_on": date(2026, 11, 30),
                "is_flagship": True,
                "image_url": "/squeeze.jpg",
                "link_url": "/projects/squeeeze",
                "display_order": 0,
            },
            {
                "title": "InteraCKT",
                "description": "Coming soon.",
                "category": "EVENT",
                "starts_on": date(2027, 1, 15),
                "ends_on": None,
                "is_flagship": True,
                "image_url": "/interackt.jpg",
                "display_order": 1,
            },
        ]
        for item in events:
            existing = db.scalar(
                select(Event).where(Event.title == item["title"], Event.is_active.is_(True))
            )
            if existing:
                continue
            db.add(Event(**item, is_active=True))
        db.commit()

        drive_cat = db.scalar(
            select(ResourceCategory).where(
                ResourceCategory.scope == "ACADEMIC",
                ResourceCategory.name == "Academic Drive",
            )
        )
        if drive_cat:
            official = db.scalar(
                select(Resource).where(
                    Resource.title == "Official Academic Drive",
                    Resource.category_id == drive_cat.id,
                )
            )
            if official:
                official.is_featured = True
                db.commit()
        print("Beta content seeded.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
