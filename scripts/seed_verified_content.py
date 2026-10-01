#!/usr/bin/env python3
"""Upsert verified Circuit content (M7) — real URLs only, no demo placeholders."""

from __future__ import annotations

import os
import sys
from pathlib import Path

from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session, sessionmaker

REPO_ROOT = Path(__file__).resolve().parents[1]
BACKEND_ROOT = REPO_ROOT / "backend"
sys.path.insert(0, str(BACKEND_ROOT))

ACADEMIC_DRIVE_URL = (
    "https://drive.google.com/drive/folders/1p0YfBR_USHSX7M_XKCb8lxv-fOqC5pN8?usp=drive_link"
)
CONSTITUTION_URL = (
    "https://drive.google.com/file/d/0BwpnmRTN35zQQTBQVHNudnk4TnM/view"
    "?usp=sharing&resourcekey=0-odb6pGr4b4hkefdfJO4Fxw"
)
DIVISION_HUBS_URL = os.environ.get("DIVISION_HUBS_URL", "").strip()
GOOGLE_CALENDAR_URL = os.environ.get("GOOGLE_CALENDAR_URL", "").strip()


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


def _upsert_category(db: Session, *, scope: str, name: str, description: str, display_order: int):
    from app.models.resource import ResourceCategory

    row = db.scalar(
        select(ResourceCategory).where(
            ResourceCategory.scope == scope,
            ResourceCategory.name == name,
        )
    )
    if row is None:
        row = ResourceCategory(
            scope=scope,
            name=name,
            description=description,
            display_order=display_order,
            is_active=True,
        )
        db.add(row)
        db.flush()
    else:
        row.description = description
        row.display_order = display_order
        row.is_active = True
    return row


def _upsert_resource(
    db: Session,
    *,
    category_id,
    title: str,
    description: str,
    url: str,
    resource_type: str,
    display_order: int,
):
    from app.models.resource import Resource

    row = db.scalar(
        select(Resource).where(
            Resource.category_id == category_id,
            Resource.title == title,
        )
    )
    if row is None:
        row = Resource(
            category_id=category_id,
            title=title,
            description=description,
            url=url,
            resource_type=resource_type,
            display_order=display_order,
            is_active=True,
        )
        db.add(row)
    else:
        row.description = description
        row.url = url
        row.resource_type = resource_type
        row.display_order = display_order
        row.is_active = True


def _deactivate_demo_resources(db: Session) -> None:
    from app.models.resource import Resource

    demo_rows = db.scalars(
        select(Resource).where(Resource.url.like("%demo-%"))
    ).all()
    for row in demo_rows:
        row.is_active = False


def _deactivate_general_categories(db: Session) -> None:
    from app.models.resource import ResourceCategory

    for scope in ("ACADEMIC", "ORGANIZATIONAL"):
        general = db.scalar(
            select(ResourceCategory).where(
                ResourceCategory.scope == scope,
                ResourceCategory.name == "General",
            )
        )
        if general is not None:
            general.is_active = False


def main() -> None:
    file_env = _read_env_file(BACKEND_ROOT / ".env")
    db_override = os.environ.get("DATABASE_URL")
    for key, value in file_env.items():
        os.environ[key] = value
    if db_override:
        os.environ["DATABASE_URL"] = db_override

    from app.config import settings
    from app.models.division import Division  # noqa: F401
    from app.models.user import User  # noqa: F401

    engine = create_engine(settings.sqlalchemy_database_url())
    SessionLocal = sessionmaker(bind=engine)
    db: Session = SessionLocal()

    try:
        academic_category = _upsert_category(
            db,
            scope="ACADEMIC",
            name="Academic Drive",
            description="Official UP Circuit academic resources",
            display_order=0,
        )
        org_category = _upsert_category(
            db,
            scope="ORGANIZATIONAL",
            name="Organizational Documents",
            description="Constitution and other official organizational documents",
            display_order=0,
        )

        _upsert_resource(
            db,
            category_id=academic_category.id,
            title="Official Academic Drive",
            description="Official UP Circuit academic Google Drive folder",
            url=ACADEMIC_DRIVE_URL,
            resource_type="GOOGLE_DRIVE",
            display_order=0,
        )
        _upsert_resource(
            db,
            category_id=org_category.id,
            title="UP Circuit Constitution",
            description="Official UP Circuit Constitution (read-only link)",
            url=CONSTITUTION_URL,
            resource_type="GOOGLE_DRIVE",
            display_order=0,
        )

        if DIVISION_HUBS_URL:
            _upsert_resource(
                db,
                category_id=org_category.id,
                title="Division Hubs",
                description="Division workspaces and shared files on Google Drive",
                url=DIVISION_HUBS_URL,
                resource_type="GOOGLE_DRIVE",
                display_order=1,
            )
        else:
            print("Skipping Division Hubs — set DIVISION_HUBS_URL to seed.")

        if GOOGLE_CALENDAR_URL:
            _upsert_resource(
                db,
                category_id=org_category.id,
                title="Official Google Calendar",
                description="Official Circuit Google Calendar for RSVPs and details",
                url=GOOGLE_CALENDAR_URL,
                resource_type="EXTERNAL_LINK",
                display_order=2,
            )
        else:
            print("Skipping Official Google Calendar — set GOOGLE_CALENDAR_URL to seed.")

        _deactivate_demo_resources(db)
        _deactivate_general_categories(db)

        db.commit()
        print("Seeded verified M7 content (Academic Drive + Constitution).")
    finally:
        db.close()
        engine.dispose()


if __name__ == "__main__":
    main()
