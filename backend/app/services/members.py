"""Member directory and profile services."""

from __future__ import annotations

import uuid

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.models.academic_year import AcademicYear
from app.models.division import Division
from app.models.membership_term import MembershipTerm
from app.models.profile import Profile
from app.models.user import User


def _current_year(db: Session) -> AcademicYear | None:
    return db.scalar(select(AcademicYear).where(AcademicYear.is_current.is_(True)))


def _membership_status_for_user(
    db: Session, user_id: uuid.UUID, current_year: AcademicYear | None
) -> str:
    return _membership_status_map(db, [user_id], current_year).get(user_id, "NOT_RENEWED")


def _membership_status_map(
    db: Session, user_ids: list[uuid.UUID], current_year: AcademicYear | None
) -> dict[uuid.UUID, str]:
    if not user_ids:
        return {}
    if current_year is None:
        return {user_id: "NOT_RENEWED" for user_id in user_ids}
    rows = db.execute(
        select(MembershipTerm.user_id, MembershipTerm.status).where(
            MembershipTerm.academic_year_id == current_year.id,
            MembershipTerm.user_id.in_(user_ids),
        )
    ).all()
    by_user = {user_id: status for user_id, status in rows}
    return {user_id: by_user.get(user_id, "NOT_RENEWED") for user_id in user_ids}


def list_members(
    db: Session,
    *,
    q: str | None,
    membership_status: str | None,
    division_id: uuid.UUID | None,
    offset: int,
    limit: int,
    include_inactive: bool = False,
) -> tuple[list[tuple[User, Profile, str, Division | None]], int]:
    current_year = _current_year(db)
    stmt = (
        select(User, Profile, Division)
        .join(Profile, Profile.user_id == User.id)
        .outerjoin(Division, Division.id == Profile.primary_division_id)
    )
    if include_inactive:
        stmt = stmt.where(User.deleted_at.is_(None))
    else:
        stmt = stmt.where(User.deleted_at.is_(None), User.is_active.is_(True))
    if q:
        pattern = f"%{q.strip()}%"
        stmt = stmt.where(
            or_(
                Profile.full_name.ilike(pattern),
                User.email.ilike(pattern),
            )
        )
    if division_id is not None:
        stmt = stmt.where(Profile.primary_division_id == division_id)

    rows = db.execute(stmt.order_by(Profile.full_name)).all()
    status_map = _membership_status_map(db, [user.id for user, _, _ in rows], current_year)
    enriched: list[tuple[User, Profile, str, Division | None]] = []
    for user, profile, division in rows:
        status = status_map[user.id]
        if membership_status and status != membership_status:
            continue
        enriched.append((user, profile, status, division))

    total = len(enriched)
    page = enriched[offset : offset + limit]
    return page, total


def get_member_or_404(db: Session, member_id: uuid.UUID) -> tuple[User, Profile]:
    row = db.execute(
        select(User, Profile)
        .join(Profile, Profile.user_id == User.id)
        .where(User.id == member_id, User.deleted_at.is_(None))
    ).first()
    if row is None:
        from app.exceptions import app_http_exception

        raise app_http_exception(404, "Member not found.", "NOT_FOUND")
    return row[0], row[1]


def get_own_membership(db: Session, user_id: uuid.UUID) -> dict:
    current_year = _current_year(db)
    if current_year is None:
        return {
            "academic_year_label": "Unknown",
            "membership_status": "NOT_RENEWED",
            "renewed_at": None,
            "needs_renewal": True,
        }
    term = db.scalar(
        select(MembershipTerm).where(
            MembershipTerm.user_id == user_id,
            MembershipTerm.academic_year_id == current_year.id,
        )
    )
    status = term.status if term else "NOT_RENEWED"
    return {
        "academic_year_label": current_year.label,
        "membership_status": status,
        "renewed_at": term.renewed_at if term else None,
        "needs_renewal": status != "RENEWED",
    }
