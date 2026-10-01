"""Calendar and flagship events."""

from __future__ import annotations

import uuid
from datetime import date

from fastapi import APIRouter, Depends, Query, Request, Response, status
from sqlalchemy.orm import Session

from app.auth.deps import AuthContext, get_current_user, require_permission
from app.db.session import get_db
from app.schemas.event import EventCreate, EventList, EventRead, EventUpdate
from app.services import events as event_service

router = APIRouter(tags=["events"])


def _client_ip(request: Request) -> str | None:
    if request.client is None:
        return None
    return request.client.host


@router.get("/events", response_model=EventList)
def list_events(
    flagship: bool | None = Query(default=None),
    from_date: date | None = Query(default=None),
    to_date: date | None = Query(default=None),
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=200),
    ctx: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> EventList:
    include_inactive = "manage_events" in ctx.permissions
    rows, total = event_service.list_events(
        db,
        include_inactive=include_inactive,
        flagship_only=flagship,
        from_date=from_date,
        to_date=to_date,
        offset=offset,
        limit=limit,
    )
    return EventList(
        items=[EventRead.model_validate(row) for row in rows],
        meta={"total": total, "offset": offset, "limit": limit},
    )


@router.get("/events/{event_id}", response_model=EventRead)
def get_event(
    event_id: uuid.UUID,
    ctx: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> EventRead:
    event = event_service.get_event_or_404(db, event_id)
    if not event.is_active and "manage_events" not in ctx.permissions:
        from app.exceptions import app_http_exception

        raise app_http_exception(404, "Event not found.", "NOT_FOUND")
    return EventRead.model_validate(event)


@router.post("/events", response_model=EventRead, status_code=status.HTTP_201_CREATED)
def create_event(
    request: Request,
    body: EventCreate,
    ctx: AuthContext = Depends(require_permission("manage_events")),
    db: Session = Depends(get_db),
) -> EventRead:
    data = body.model_dump()
    if data.get("link_url") is not None:
        data["link_url"] = str(data["link_url"])
    row = event_service.create_event(
        db, ctx=ctx, data=data, ip_address=_client_ip(request)
    )
    return EventRead.model_validate(row)


@router.patch("/events/{event_id}", response_model=EventRead)
def update_event(
    request: Request,
    event_id: uuid.UUID,
    body: EventUpdate,
    ctx: AuthContext = Depends(require_permission("manage_events")),
    db: Session = Depends(get_db),
) -> EventRead:
    event = event_service.get_event_or_404(db, event_id)
    updates = body.model_dump(exclude_unset=True)
    row = event_service.update_event(
        db, ctx=ctx, event=event, updates=updates, ip_address=_client_ip(request)
    )
    return EventRead.model_validate(row)


@router.delete("/events/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_event(
    request: Request,
    event_id: uuid.UUID,
    ctx: AuthContext = Depends(require_permission("manage_events")),
    db: Session = Depends(get_db),
) -> Response:
    event = event_service.get_event_or_404(db, event_id)
    event_service.deactivate_event(
        db, ctx=ctx, event=event, ip_address=_client_ip(request)
    )
    return Response(status_code=status.HTTP_204_NO_CONTENT)
