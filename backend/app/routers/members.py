"""Member directory, profile, and membership endpoints."""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.orm import Session

from app.auth.deps import AuthContext, require_permission
from app.db.session import get_db
from app.exceptions import app_http_exception
from app.schemas.member import (
    MemberAdminRead,
    MemberDirectoryRead,
    MemberList,
    MemberSelfRead,
    MembershipAdminRead,
    MembershipSelfRead,
    MembershipStatusUpdate,
)
from app.models.academic_year import AcademicYear
from app.services import members as member_service
from app.services import memberships as membership_service

router = APIRouter(tags=["members"])


def _client_ip(request: Request) -> str | None:
    if request.client is None:
        return None
    host = request.client.host
    if host.count(".") != 3 and ":" not in host:
        return None
    return host


@router.get("/members", response_model=MemberList)
def list_members(
    q: str | None = Query(default=None),
    membership_status: str | None = Query(default=None),
    division_id: uuid.UUID | None = Query(default=None),
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=100),
    ctx: AuthContext = Depends(require_permission("view_member_directory")),
    db: Session = Depends(get_db),
) -> MemberList:
    rows, total = member_service.list_members(
        db,
        q=q,
        membership_status=membership_status,
        division_id=division_id,
        offset=offset,
        limit=limit,
    )
    is_admin = "view_members_admin" in ctx.permissions
    items: list[MemberDirectoryRead | MemberAdminRead] = []
    for user, profile, status, division in rows:
        base = {
            "user_id": user.id,
            "full_name": profile.full_name,
            "degree_program": profile.degree_program,
            "year_level": profile.year_level,
            "batch": profile.batch,
            "membership_status": status,
            "primary_division_id": profile.primary_division_id,
            "primary_division_name": division.name if division else None,
        }
        if is_admin:
            items.append(
                MemberAdminRead(
                    **base,
                    email=user.email,
                    student_number=profile.student_number,
                    contact_number=profile.contact_number,
                )
            )
        else:
            items.append(MemberDirectoryRead(**base))
    return MemberList(
        items=items,
        meta={"total": total, "offset": offset, "limit": limit},
    )


@router.get("/members/me", response_model=MemberSelfRead)
def get_own_profile(
    ctx: AuthContext = Depends(require_permission("view_own_profile")),
    db: Session = Depends(get_db),
) -> MemberSelfRead:
    user, profile = member_service.get_member_or_404(db, ctx.user_id)
    membership = member_service.get_own_membership(db, ctx.user_id)
    return MemberSelfRead(
        user_id=user.id,
        email=user.email,
        full_name=profile.full_name,
        student_number=profile.student_number,
        degree_program=profile.degree_program,
        year_level=profile.year_level,
        contact_number=profile.contact_number,
        batch=profile.batch,
        membership_status=membership["membership_status"],
    )


@router.get("/membership/me", response_model=MembershipSelfRead)
def get_own_membership(
    ctx: AuthContext = Depends(require_permission("view_own_profile")),
    db: Session = Depends(get_db),
) -> MembershipSelfRead:
    data = member_service.get_own_membership(db, ctx.user_id)
    return MembershipSelfRead(**data)


@router.get("/membership/{member_id}", response_model=list[MembershipAdminRead])
def get_member_membership(
    member_id: uuid.UUID,
    ctx: AuthContext = Depends(require_permission("view_members_admin")),
    db: Session = Depends(get_db),
) -> list[MembershipAdminRead]:
    member_service.get_member_or_404(db, member_id)
    rows = membership_service.get_member_terms(db, member_id)
    return [
        MembershipAdminRead(
            id=term.id,
            user_id=term.user_id,
            academic_year_id=term.academic_year_id,
            academic_year_label=year.label,
            status=term.status,
            renewed_at=term.renewed_at,
        )
        for term, year in rows
    ]


@router.patch("/membership/{member_id}/status")
def update_membership_status(
    request: Request,
    member_id: uuid.UUID,
    body: MembershipStatusUpdate,
    ctx: AuthContext = Depends(require_permission("manage_membership_status")),
    db: Session = Depends(get_db),
) -> MembershipAdminRead:
    term = membership_service.set_membership_status(
        db,
        ctx=ctx,
        member_id=member_id,
        academic_year_label=body.academic_year,
        status=body.status,
        reason=body.reason,
        confirm_full_name=body.confirm_full_name,
        ip_address=_client_ip(request),
    )
    year = db.get(AcademicYear, term.academic_year_id)
    if year is None:
        raise app_http_exception(500, "Academic year missing.", "INTERNAL_ERROR")
    return MembershipAdminRead(
        id=term.id,
        user_id=term.user_id,
        academic_year_id=term.academic_year_id,
        academic_year_label=year.label,
        status=term.status,
        renewed_at=term.renewed_at,
    )
