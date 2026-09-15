"""Division content-hub services (M6 — not membership assignments)."""

from __future__ import annotations

import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth.deps import AuthContext, check_permission
from app.auth.tokens import utcnow
from app.exceptions import app_http_exception
from app.models.division import Division
from app.services.audit import record


def require_division_read(ctx: AuthContext, db: Session) -> None:
    check_permission(ctx, db, "view_resources")


def require_division_manage(ctx: AuthContext, db: Session) -> None:
    check_permission(ctx, db, "manage_organizational_resources")


def get_division_or_404(db: Session, division_id: uuid.UUID) -> Division:
    row = db.get(Division, division_id)
    if row is None:
        raise app_http_exception(404, "Division not found.", "NOT_FOUND")
    return row


def list_divisions(db: Session, *, include_inactive: bool) -> tuple[list[Division], int]:
    stmt = select(Division)
    if not include_inactive:
        stmt = stmt.where(Division.is_active.is_(True))
    stmt = stmt.order_by(Division.display_order, Division.name)
    rows = list(db.scalars(stmt).all())
    return rows, len(rows)


def update_division(
    db: Session,
    *,
    ctx: AuthContext,
    division: Division,
    updates: dict,
    ip_address: str | None,
) -> Division:
    require_division_manage(ctx, db)
    if "name" in updates:
        raise app_http_exception(422, "Division name cannot be changed.", "VALIDATION_ERROR")
    old = {
        "description": division.description,
        "display_order": division.display_order,
        "is_active": division.is_active,
    }
    for key, value in updates.items():
        setattr(division, key, value)
    division.updated_at = utcnow()
    record(
        db,
        actor_user_id=ctx.user_id,
        action="UPDATE_DIVISION",
        entity_type="division",
        entity_id=division.id,
        old_value=old,
        new_value=updates,
        ip_address=ip_address,
    )
    db.commit()
    db.refresh(division)
    return division
