"""Admin member account and role management."""

from __future__ import annotations

import uuid

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.auth.deps import AuthContext, check_permission
from app.auth.tokens import utcnow
from app.exceptions import app_http_exception
from app.models.role import Role, UserRole
from app.models.user import User
from app.services.audit import record
from app.services.members import get_member_or_404

ADMIN_ASSIGNABLE_ROLES = {
    "MEMBER",
    "SUPER_ADMIN",
    "RENEWALS_ADMIN",
    "ACADEMIC_ADMIN",
    "FINANCE_ADMIN",
    "PUBLICITY_ADMIN",
}


def set_member_roles(
    db: Session,
    *,
    ctx: AuthContext,
    member_id: uuid.UUID,
    role_names: list[str],
    ip_address: str | None,
) -> list[str]:
    check_permission(ctx, db, "manage_roles")
    user, _profile = get_member_or_404(db, member_id)
    normalized = sorted({name.strip().upper() for name in role_names if name.strip()})
    if not normalized:
        raise app_http_exception(422, "At least one role is required.", "VALIDATION_ERROR")
    invalid = [name for name in normalized if name not in ADMIN_ASSIGNABLE_ROLES]
    if invalid:
        raise app_http_exception(
            422, f"Unknown roles: {', '.join(invalid)}", "VALIDATION_ERROR"
        )
    if "MEMBER" not in normalized:
        normalized.insert(0, "MEMBER")

    roles = list(
        db.scalars(select(Role).where(Role.name.in_(normalized), Role.is_active.is_(True)))
    )
    if len(roles) != len(normalized):
        raise app_http_exception(422, "One or more roles are inactive.", "VALIDATION_ERROR")

    old_names = sorted(
        db.scalars(
            select(Role.name)
            .join(UserRole, UserRole.role_id == Role.id)
            .where(UserRole.user_id == user.id)
        ).all()
    )

    db.execute(delete(UserRole).where(UserRole.user_id == user.id))
    now = utcnow()
    for role in roles:
        db.add(
            UserRole(
                user_id=user.id,
                role_id=role.id,
                assigned_by=ctx.user_id,
                assigned_at=now,
            )
        )
    record(
        db,
        actor_user_id=ctx.user_id,
        action="UPDATE_MEMBER_ROLES",
        entity_type="user",
        entity_id=user.id,
        old_value={"roles": old_names},
        new_value={"roles": normalized},
        ip_address=ip_address,
    )
    db.commit()
    return normalized


def set_member_account_active(
    db: Session,
    *,
    ctx: AuthContext,
    member_id: uuid.UUID,
    is_active: bool,
    ip_address: str | None,
) -> User:
    check_permission(ctx, db, "manage_members")
    user, _profile = get_member_or_404(db, member_id)
    if user.id == ctx.user_id and not is_active:
        raise app_http_exception(
            422, "You cannot deactivate your own account.", "VALIDATION_ERROR"
        )
    old = {"is_active": user.is_active, "deleted_at": str(user.deleted_at)}
    user.is_active = is_active
    if not is_active:
        user.deleted_at = utcnow()
    else:
        user.deleted_at = None
        user.locked_until = None
    user.updated_at = utcnow()
    record(
        db,
        actor_user_id=ctx.user_id,
        action="UPDATE_MEMBER_ACCOUNT",
        entity_type="user",
        entity_id=user.id,
        old_value=old,
        new_value={"is_active": is_active},
        ip_address=ip_address,
    )
    db.commit()
    db.refresh(user)
    return user


def load_roles_for_users(db: Session, user_ids: list[uuid.UUID]) -> dict[uuid.UUID, list[str]]:
    if not user_ids:
        return {}
    rows = db.execute(
        select(UserRole.user_id, Role.name)
        .join(Role, Role.id == UserRole.role_id)
        .where(UserRole.user_id.in_(user_ids))
        .order_by(Role.name)
    ).all()
    result: dict[uuid.UUID, list[str]] = {uid: [] for uid in user_ids}
    for user_id, role_name in rows:
        result[user_id].append(role_name)
    return result
