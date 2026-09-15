"""Membership administration services."""

from __future__ import annotations

import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth.deps import AuthContext
from app.auth.tokens import utcnow
from app.exceptions import app_http_exception
from app.models.academic_year import AcademicYear
from app.models.membership_term import MembershipTerm
from app.models.profile import Profile
from app.models.user import User
from app.services.audit import record


def get_member_terms(db: Session, member_id: uuid.UUID) -> list[tuple[MembershipTerm, AcademicYear]]:
    rows = db.execute(
        select(MembershipTerm, AcademicYear)
        .join(AcademicYear, AcademicYear.id == MembershipTerm.academic_year_id)
        .where(MembershipTerm.user_id == member_id)
        .order_by(AcademicYear.start_year.desc())
    ).all()
    return [(term, year) for term, year in rows]


def set_membership_status(
    db: Session,
    *,
    ctx: AuthContext,
    member_id: uuid.UUID,
    academic_year_label: str,
    status: str,
    reason: str,
    confirm_full_name: str,
    ip_address: str | None,
) -> MembershipTerm:
    if status not in {"PENDING", "RENEWED", "NOT_RENEWED"}:
        raise app_http_exception(422, "Invalid membership status.", "VALIDATION_ERROR")

    user = db.get(User, member_id)
    if user is None or user.deleted_at is not None:
        raise app_http_exception(404, "Member not found.", "NOT_FOUND")

    profile = db.scalar(select(Profile).where(Profile.user_id == member_id))
    if profile is None:
        raise app_http_exception(404, "Member not found.", "NOT_FOUND")

    if profile.full_name.strip() != confirm_full_name.strip():
        raise app_http_exception(
            422,
            "Confirmation name does not match member full name.",
            "VALIDATION_ERROR",
        )

    year = db.scalar(
        select(AcademicYear).where(AcademicYear.label == academic_year_label)
    )
    if year is None:
        raise app_http_exception(422, "Academic year not found.", "VALIDATION_ERROR")

    term = db.scalar(
        select(MembershipTerm).where(
            MembershipTerm.user_id == member_id,
            MembershipTerm.academic_year_id == year.id,
        )
    )
    old_status = term.status if term else None
    now = utcnow()

    if term is None:
        term = MembershipTerm(
            user_id=member_id,
            academic_year_id=year.id,
            status=status,
            renewed_at=now if status == "RENEWED" else None,
        )
        db.add(term)
    else:
        term.status = status
        term.renewed_at = now if status == "RENEWED" else None
        term.updated_at = now

    db.flush()
    record(
        db,
        actor_user_id=ctx.user_id,
        action="UPDATE_MEMBERSHIP_STATUS",
        entity_type="membership_term",
        entity_id=term.id,
        old_value={"status": old_status, "reason": reason},
        new_value={"status": status, "reason": reason},
        ip_address=ip_address,
    )
    db.commit()
    db.refresh(term)
    return term
