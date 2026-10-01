"""Admin dashboard overview aggregates."""

from __future__ import annotations

from datetime import timedelta

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.auth.tokens import utcnow
from app.models.audit_log import AuditLog
from app.models.membership_term import MembershipTerm
from app.models.profile import Profile
from app.models.user import User
from app.services.members import _current_year, _membership_status_for_user


def get_admin_overview(db: Session) -> dict:
    current_year = _current_year(db)
    members = db.execute(
        select(User, Profile)
        .join(Profile, Profile.user_id == User.id)
        .where(User.deleted_at.is_(None), User.is_active.is_(True))
        .order_by(User.created_at.desc())
    ).all()

    pending = renewed = not_renewed = 0
    for user, _profile in members:
        status = _membership_status_for_user(db, user.id, current_year)
        if status == "PENDING":
            pending += 1
        elif status == "RENEWED":
            renewed += 1
        else:
            not_renewed += 1

    since = utcnow() - timedelta(days=7)
    recent_users = db.execute(
        select(User, Profile)
        .join(Profile, Profile.user_id == User.id)
        .where(User.deleted_at.is_(None), User.created_at >= since)
        .order_by(User.created_at.desc())
        .limit(10)
    ).all()
    recent_registrations = []
    for user, profile in recent_users:
        recent_registrations.append(
            {
                "user_id": user.id,
                "full_name": profile.full_name,
                "email": user.email,
                "membership_status": _membership_status_for_user(
                    db, user.id, current_year
                ),
                "registered_at": user.created_at,
            }
        )

    audit_rows = db.execute(
        select(AuditLog, User.email)
        .outerjoin(User, User.id == AuditLog.actor_user_id)
        .order_by(AuditLog.created_at.desc())
        .limit(8)
    ).all()
    recent_audit = [
        {
            "id": log.id,
            "action": log.action,
            "entity_type": log.entity_type,
            "created_at": log.created_at,
            "actor_email": email,
        }
        for log, email in audit_rows
    ]

    return {
        "total_members": len(members),
        "pending_members": pending,
        "renewed_members": renewed,
        "not_renewed_members": not_renewed,
        "recent_registrations": recent_registrations,
        "recent_audit": recent_audit,
    }
