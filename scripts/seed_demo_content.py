#!/usr/bin/env python3
"""Seed demo resource categories and resources for local MVP demos."""

from __future__ import annotations

import os
import sys
from pathlib import Path

from sqlalchemy import create_engine, select
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


def main() -> None:
    file_env = _read_env_file(BACKEND_ROOT / ".env")
    db_override = os.environ.get("DATABASE_URL")
    for key, value in file_env.items():
        os.environ[key] = value
    if db_override:
        os.environ["DATABASE_URL"] = db_override

    from app.config import settings
    from app.models.division import Division  # noqa: F401 — register FK targets in metadata
    from app.models.user import User  # noqa: F401 — register FK targets in metadata
    from app.models.resource import Resource, ResourceCategory

    engine = create_engine(settings.sqlalchemy_database_url())
    SessionLocal = sessionmaker(bind=engine)
    db: Session = SessionLocal()

    try:
        academic_categories = [
            ("Course Materials", "Lecture notes and handouts", 1),
            ("Exam Archives", "Past exams and reviewers", 2),
            ("Study Guides", "Guides and reference sheets", 3),
        ]
        org_categories = [
            ("Forms and Requests", "Official Circuit forms", 1),
            ("Org Documents", "Organizational documents", 2),
        ]

        academic_map = {
            name: _upsert_category(
                db, scope="ACADEMIC", name=name, description=desc, display_order=order
            )
            for name, desc, order in academic_categories
        }
        org_map = {
            name: _upsert_category(
                db, scope="ORGANIZATIONAL", name=name, description=desc, display_order=order
            )
            for name, desc, order in org_categories
        }

        demo_resources = [
            (
                academic_map["Course Materials"],
                "EEE 1 Lecture Slides",
                "Introductory EEE lecture deck",
                "https://drive.google.com/file/d/demo-eee1-slides/view",
                "GOOGLE_DRIVE",
                1,
            ),
            (
                academic_map["Exam Archives"],
                "Midterm Reviewer 2026",
                "Sample midterm reviewer",
                "https://drive.google.com/file/d/demo-midterm-reviewer/view",
                "GOOGLE_DRIVE",
                1,
            ),
            (
                academic_map["Study Guides"],
                "Circuit Theory Cheatsheet",
                "Quick reference for circuit analysis",
                "https://docs.google.com/document/d/demo-cheatsheet/edit",
                "GOOGLE_DOC",
                1,
            ),
            (
                org_map["Forms and Requests"],
                "Membership Renewal Form",
                "Google Form for renewal submissions",
                "https://docs.google.com/forms/d/demo-renewal-form/viewform",
                "GOOGLE_FORM",
                1,
            ),
            (
                org_map["Org Documents"],
                "Org Handbook",
                "Organizational handbook and policies",
                "https://drive.google.com/file/d/demo-org-handbook/view",
                "GOOGLE_DRIVE",
                1,
            ),
        ]

        for category, title, description, url, resource_type, display_order in demo_resources:
            _upsert_resource(
                db,
                category_id=category.id,
                title=title,
                description=description,
                url=url,
                resource_type=resource_type,
                display_order=display_order,
            )

        db.commit()
        print("Seeded demo resource categories and resources.")
    finally:
        db.close()
        engine.dispose()


if __name__ == "__main__":
    main()
