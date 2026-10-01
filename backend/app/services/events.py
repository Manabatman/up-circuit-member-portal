"""Calendar and flagship event services."""

from __future__ import annotations

import uuid
from datetime import date

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.auth.deps import AuthContext, check_permission
from app.auth.tokens import utcnow
from app.exceptions import app_http_exception
from app.models.event import Event
from app.services.audit import record


def get_event_or_404(db: Session, event_id: uuid.UUID) -> Event:
    row = db.get(Event, event_id)
    if row is None:
        raise app_http_exception(404, "Event not found.", "NOT_FOUND")
    return row


def _event_snapshot(event: Event) -> dict:
    return {
        "title": event.title,
        "category": event.category,
        "starts_on": str(event.starts_on),
        "ends_on": str(event.ends_on) if event.ends_on else None,
        "is_flagship": event.is_flagship,
        "is_active": event.is_active,
    }


def list_events(
    db: Session,
    *,
    include_inactive: bool,
    flagship_only: bool | None,
    from_date: date | None,
    to_date: date | None,
    offset: int,
    limit: int,
) -> tuple[list[Event], int]:
    stmt = select(Event)
    if not include_inactive:
        stmt = stmt.where(Event.is_active.is_(True))
    if flagship_only is True:
        stmt = stmt.where(Event.is_flagship.is_(True))
    elif flagship_only is False:
        stmt = stmt.where(Event.is_flagship.is_(False))
    if from_date is not None:
        end_col = func.coalesce(Event.ends_on, Event.starts_on)
        stmt = stmt.where(end_col >= from_date)
    if to_date is not None:
        stmt = stmt.where(Event.starts_on <= to_date)
    total = db.scalar(select(func.count()).select_from(stmt.subquery())) or 0
    rows = list(
        db.scalars(
            stmt.order_by(Event.starts_on, Event.display_order, Event.title)
            .offset(offset)
            .limit(limit)
        ).all()
    )
    return rows, total


def create_event(
    db: Session,
    *,
    ctx: AuthContext,
    data: dict,
    ip_address: str | None,
) -> Event:
    check_permission(ctx, db, "manage_events")
    row = Event(
        title=data["title"],
        description=data.get("description"),
        category=data["category"],
        starts_on=data["starts_on"],
        ends_on=data.get("ends_on"),
        is_flagship=data.get("is_flagship", False),
        image_url=data.get("image_url"),
        link_url=data.get("link_url"),
        display_order=data.get("display_order", 0),
        created_by=ctx.user_id,
        updated_by=ctx.user_id,
    )
    db.add(row)
    db.flush()
    record(
        db,
        actor_user_id=ctx.user_id,
        action="CREATE_EVENT",
        entity_type="event",
        entity_id=row.id,
        new_value=_event_snapshot(row),
        ip_address=ip_address,
    )
    db.commit()
    db.refresh(row)
    return row


def update_event(
    db: Session,
    *,
    ctx: AuthContext,
    event: Event,
    updates: dict,
    ip_address: str | None,
) -> Event:
    check_permission(ctx, db, "manage_events")
    old = _event_snapshot(event)
    if "link_url" in updates and updates["link_url"] is not None:
        updates["link_url"] = str(updates["link_url"])
    for key, value in updates.items():
        setattr(event, key, value)
    event.updated_by = ctx.user_id
    event.updated_at = utcnow()
    record(
        db,
        actor_user_id=ctx.user_id,
        action="UPDATE_EVENT",
        entity_type="event",
        entity_id=event.id,
        old_value=old,
        new_value=_event_snapshot(event),
        ip_address=ip_address,
    )
    db.commit()
    db.refresh(event)
    return event


def deactivate_event(
    db: Session,
    *,
    ctx: AuthContext,
    event: Event,
    ip_address: str | None,
) -> None:
    check_permission(ctx, db, "manage_events")
    old = {"is_active": event.is_active}
    event.is_active = False
    event.updated_by = ctx.user_id
    event.updated_at = utcnow()
    record(
        db,
        actor_user_id=ctx.user_id,
        action="DEACTIVATE_EVENT",
        entity_type="event",
        entity_id=event.id,
        old_value=old,
        new_value={"is_active": False},
        ip_address=ip_address,
    )
    db.commit()
