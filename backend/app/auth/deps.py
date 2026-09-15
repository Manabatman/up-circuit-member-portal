"""Authentication and authorization dependencies."""

from __future__ import annotations

import uuid
from dataclasses import dataclass
from typing import Annotated, Callable

from fastapi import Cookie, Depends, Request
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.auth.cookies import SESSION_COOKIE_NAME
from app.auth.tokens import (
    hash_token,
    session_expires_at,
    should_slide_session,
    utcnow,
)
from app.db.session import get_db
from app.exceptions import app_http_exception
from app.models.academic_year import AcademicYear
from app.models.membership_term import MembershipTerm
from app.models.profile import Profile
from app.models.role import Permission, Role, RolePermission, UserRole
from app.models.session import Session as UserSession
from app.models.user import User

ROUTE_PERMISSION_MAP: dict[str, str] = {
    "dashboard": "view_dashboard",
    "account": "view_own_profile",
    "resources": "view_resources",
    "divisions": "view_resources",
    "academic_drive": "view_academic_resources",
    "requests": "view_request_directory",
    "member_directory": "view_member_directory",
    "renew_membership": "view_renewal_info",
    "notifications": "view_own_notifications",
    "admin": "view_admin_dashboard",
}


@dataclass(frozen=True)
class AuthContext:
    user_id: uuid.UUID
    email: str
    full_name: str
    membership_status: str
    roles: list[str]
    permissions: list[str]
    route_keys: list[str]


def _load_permissions(db: Session, user_id: uuid.UUID) -> tuple[list[str], list[str], dict[str, Permission]]:
    rows = db.execute(
        select(Role.name, Permission)
        .join(UserRole, UserRole.role_id == Role.id)
        .join(RolePermission, RolePermission.role_id == Role.id)
        .join(Permission, Permission.id == RolePermission.permission_id)
        .where(UserRole.user_id == user_id, Role.is_active.is_(True))
    ).all()

    role_names = sorted({row[0] for row in rows})
    perm_by_name: dict[str, Permission] = {}
    for _, perm in rows:
        perm_by_name[perm.name] = perm
    return role_names, sorted(perm_by_name.keys()), perm_by_name


def _membership_status(db: Session, user_id: uuid.UUID) -> str:
    current_year = db.scalar(
        select(AcademicYear).where(AcademicYear.is_current.is_(True))
    )
    if current_year is None:
        return "NOT_RENEWED"

    term = db.scalar(
        select(MembershipTerm).where(
            MembershipTerm.user_id == user_id,
            MembershipTerm.academic_year_id == current_year.id,
        )
    )
    if term is None:
        return "NOT_RENEWED"
    return term.status


def _passes_membership_gate(
    permission: Permission, membership_status: str
) -> bool:
    if permission.kind == "admin_capability":
        return True
    required = permission.required_membership
    if required == "ANY":
        return True
    if required == "RENEWED":
        return membership_status == "RENEWED"
    return False


def _route_keys(
    perm_by_name: dict[str, Permission], membership_status: str
) -> list[str]:
    keys: list[str] = []
    for route_key, perm_name in ROUTE_PERMISSION_MAP.items():
        perm = perm_by_name.get(perm_name)
        if perm is None:
            continue
        if _passes_membership_gate(perm, membership_status):
            keys.append(route_key)
    return keys


def build_auth_context(db: Session, user: User, profile: Profile) -> AuthContext:
    roles, permission_names, perm_by_name = _load_permissions(db, user.id)
    membership_status = _membership_status(db, user.id)
    return AuthContext(
        user_id=user.id,
        email=user.email,
        full_name=profile.full_name,
        membership_status=membership_status,
        roles=roles,
        permissions=permission_names,
        route_keys=_route_keys(perm_by_name, membership_status),
    )


def _ensure_active_user(user: User) -> None:
    now = utcnow()
    if user.deleted_at is not None:
        raise app_http_exception(401, "Invalid session.", "UNAUTHORIZED")
    if not user.is_active:
        raise app_http_exception(
            403, "This account has been disabled.", "ACCOUNT_DISABLED"
        )
    if user.locked_until is not None and user.locked_until > now:
        raise app_http_exception(
            403, "This account has been disabled.", "ACCOUNT_DISABLED"
        )


def get_current_user(
    request: Request,
    db: Annotated[Session, Depends(get_db)],
    session_token: Annotated[str | None, Cookie(alias=SESSION_COOKIE_NAME)] = None,
) -> AuthContext:
    if not session_token:
        raise app_http_exception(401, "Authentication required.", "UNAUTHORIZED")

    token_hash = hash_token(session_token)
    row = db.scalar(
        select(UserSession).where(
            UserSession.token_hash == token_hash,
            UserSession.expires_at > utcnow(),
        )
    )
    if row is None:
        raise app_http_exception(401, "Invalid session.", "UNAUTHORIZED")

    user = db.get(User, row.user_id)
    if user is None:
        raise app_http_exception(401, "Invalid session.", "UNAUTHORIZED")

    _ensure_active_user(user)

    profile = db.scalar(select(Profile).where(Profile.user_id == user.id))
    if profile is None:
        raise app_http_exception(401, "Invalid session.", "UNAUTHORIZED")

    now = utcnow()
    if should_slide_session(row.last_used_at, now):
        row.last_used_at = now
        row.expires_at = session_expires_at(row.created_at, now)
        row.updated_at = now
        db.commit()

    return build_auth_context(db, user, profile)


def require_permission(permission_name: str) -> Callable[..., AuthContext]:
    def _dependency(
        ctx: Annotated[AuthContext, Depends(get_current_user)],
        db: Annotated[Session, Depends(get_db)],
    ) -> AuthContext:
        if permission_name not in ctx.permissions:
            raise app_http_exception(403, "Forbidden.", "FORBIDDEN")

        perm = db.scalar(
            select(Permission).where(Permission.name == permission_name)
        )
        if perm is None:
            raise app_http_exception(403, "Forbidden.", "FORBIDDEN")

        if not _passes_membership_gate(perm, ctx.membership_status):
            raise app_http_exception(
                403,
                "Membership renewal required.",
                "MEMBERSHIP_REQUIRED",
            )
        return ctx

    return _dependency


def check_permission(ctx: AuthContext, db: Session, permission_name: str) -> None:
    """Imperative helper for tests and internal checks."""
    if permission_name not in ctx.permissions:
        raise app_http_exception(403, "Forbidden.", "FORBIDDEN")
    perm = db.scalar(select(Permission).where(Permission.name == permission_name))
    if perm is None:
        raise app_http_exception(403, "Forbidden.", "FORBIDDEN")
    if not _passes_membership_gate(perm, ctx.membership_status):
        raise app_http_exception(
            403,
            "Membership renewal required.",
            "MEMBERSHIP_REQUIRED",
        )
