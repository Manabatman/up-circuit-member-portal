"""Division content-hub endpoints."""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.orm import Session

from app.auth.deps import AuthContext, get_current_user
from app.db.session import get_db
from app.exceptions import app_http_exception
from app.schemas.division import DivisionList, DivisionRead, DivisionUpdate
from app.services import divisions as division_service

router = APIRouter(tags=["divisions"])


def _client_ip(request: Request) -> str | None:
    if request.client is None:
        return None
    host = request.client.host
    if host.count(".") != 3 and ":" not in host:
        return None
    return host


@router.get("/divisions", response_model=DivisionList)
def list_divisions(
    include_inactive: bool = Query(default=False),
    ctx: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> DivisionList:
    division_service.require_division_read(ctx, db)
    can_manage = "manage_organizational_resources" in ctx.permissions
    if include_inactive and not can_manage:
        raise app_http_exception(403, "Forbidden.", "FORBIDDEN")
    rows, total = division_service.list_divisions(
        db,
        include_inactive=include_inactive and can_manage,
    )
    return DivisionList(
        items=[DivisionRead.model_validate(row) for row in rows],
        meta={"total": total},
    )


@router.get("/divisions/{division_id}", response_model=DivisionRead)
def get_division(
    division_id: uuid.UUID,
    ctx: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> DivisionRead:
    division_service.require_division_read(ctx, db)
    row = division_service.get_division_or_404(db, division_id)
    can_manage = "manage_organizational_resources" in ctx.permissions
    if not can_manage and not row.is_active:
        raise app_http_exception(404, "Division not found.", "NOT_FOUND")
    return DivisionRead.model_validate(row)


@router.patch("/divisions/{division_id}", response_model=DivisionRead)
def update_division(
    request: Request,
    division_id: uuid.UUID,
    body: DivisionUpdate,
    ctx: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> DivisionRead:
    division = division_service.get_division_or_404(db, division_id)
    updates = body.model_dump(exclude_unset=True)
    if not updates:
        raise app_http_exception(422, "At least one field is required.", "VALIDATION_ERROR")
    row = division_service.update_division(
        db,
        ctx=ctx,
        division=division,
        updates=updates,
        ip_address=_client_ip(request),
    )
    return DivisionRead.model_validate(row)
