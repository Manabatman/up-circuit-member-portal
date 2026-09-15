"""Resource and category services with scope-based authorization."""

from __future__ import annotations

import uuid
from typing import Literal

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.auth.deps import AuthContext, check_permission
from app.auth.tokens import utcnow
from app.exceptions import app_http_exception
from app.models.resource import Resource, ResourceCategory
from app.services.audit import record

Scope = Literal["ACADEMIC", "ORGANIZATIONAL"]
SCOPE_ALIASES = {"academic": "ACADEMIC", "organizational": "ORGANIZATIONAL"}


def normalize_scope(scope: str) -> Scope:
    normalized = SCOPE_ALIASES.get(scope.lower())
    if normalized is None:
        raise app_http_exception(422, "Invalid scope.", "VALIDATION_ERROR")
    return normalized  # type: ignore[return-value]


def _view_permission_for(scope: Scope) -> str:
    if scope == "ACADEMIC":
        return "view_academic_resources"
    return "view_resources"


def _manage_permission_for(scope: Scope) -> str:
    if scope == "ACADEMIC":
        return "manage_academic_resources"
    return "manage_organizational_resources"


def require_resource_read(ctx: AuthContext, db: Session, scope: Scope) -> bool:
    """Return True when caller may see inactive rows (admin read)."""
    manage = _manage_permission_for(scope)
    if manage in ctx.permissions:
        return True
    check_permission(ctx, db, _view_permission_for(scope))
    return False


def require_resource_manage(ctx: AuthContext, db: Session, scope: Scope) -> None:
    check_permission(ctx, db, _manage_permission_for(scope))


def require_category_manage(ctx: AuthContext, db: Session, scope: Scope) -> None:
    check_permission(ctx, db, "manage_resource_categories")
    require_resource_manage(ctx, db, scope)


def get_category_or_404(db: Session, category_id: uuid.UUID) -> ResourceCategory:
    row = db.get(ResourceCategory, category_id)
    if row is None:
        raise app_http_exception(404, "Resource category not found.", "NOT_FOUND")
    return row


def get_resource_or_404(db: Session, resource_id: uuid.UUID) -> Resource:
    row = db.get(Resource, resource_id)
    if row is None:
        raise app_http_exception(404, "Resource not found.", "NOT_FOUND")
    return row


def get_resource_scope(db: Session, resource: Resource) -> Scope:
    category = get_category_or_404(db, resource.category_id)
    return category.scope  # type: ignore[return-value]


def _resource_snapshot(resource: Resource) -> dict:
    return {
        "title": resource.title,
        "description": resource.description,
        "url": resource.url,
        "resource_type": resource.resource_type,
        "display_order": resource.display_order,
        "is_active": resource.is_active,
        "category_id": str(resource.category_id),
        "division_id": str(resource.division_id) if resource.division_id else None,
    }


def list_categories(
    db: Session,
    *,
    scope: Scope,
    include_inactive: bool,
) -> tuple[list[ResourceCategory], int]:
    stmt = select(ResourceCategory).where(ResourceCategory.scope == scope)
    if not include_inactive:
        stmt = stmt.where(ResourceCategory.is_active.is_(True))
    stmt = stmt.order_by(ResourceCategory.display_order, ResourceCategory.name)
    rows = list(db.scalars(stmt).all())
    return rows, len(rows)


def list_resources(
    db: Session,
    *,
    scope: Scope,
    category_id: uuid.UUID | None,
    division_id: uuid.UUID | None,
    global_only: bool,
    include_inactive: bool,
    offset: int,
    limit: int,
) -> tuple[list[tuple[Resource, ResourceCategory]], int]:
    stmt = (
        select(Resource, ResourceCategory)
        .join(ResourceCategory, Resource.category_id == ResourceCategory.id)
        .where(ResourceCategory.scope == scope)
    )
    if category_id is not None:
        stmt = stmt.where(Resource.category_id == category_id)
    if division_id is not None:
        stmt = stmt.where(Resource.division_id == division_id)
    elif global_only:
        stmt = stmt.where(Resource.division_id.is_(None))
    if not include_inactive:
        stmt = stmt.where(Resource.is_active.is_(True), ResourceCategory.is_active.is_(True))
    total = db.scalar(select(func.count()).select_from(stmt.subquery())) or 0
    rows = db.execute(
        stmt.order_by(
            ResourceCategory.display_order,
            ResourceCategory.name,
            Resource.display_order,
            Resource.title,
        )
        .offset(offset)
        .limit(limit)
    ).all()
    return [(resource, category) for resource, category in rows], total


def get_resource_with_category(
    db: Session, resource_id: uuid.UUID
) -> tuple[Resource, ResourceCategory]:
    row = db.execute(
        select(Resource, ResourceCategory)
        .join(ResourceCategory, Resource.category_id == ResourceCategory.id)
        .where(Resource.id == resource_id)
    ).first()
    if row is None:
        raise app_http_exception(404, "Resource not found.", "NOT_FOUND")
    return row[0], row[1]


def create_category(
    db: Session,
    *,
    ctx: AuthContext,
    scope: Scope,
    name: str,
    description: str | None,
    display_order: int,
    ip_address: str | None,
) -> ResourceCategory:
    require_category_manage(ctx, db, scope)
    row = ResourceCategory(
        scope=scope,
        name=name,
        description=description,
        display_order=display_order,
    )
    db.add(row)
    db.flush()
    record(
        db,
        actor_user_id=ctx.user_id,
        action="CREATE_RESOURCE_CATEGORY",
        entity_type="resource_category",
        entity_id=row.id,
        new_value={"scope": scope, "name": name, "display_order": display_order},
        ip_address=ip_address,
    )
    db.commit()
    db.refresh(row)
    return row


def update_category(
    db: Session,
    *,
    ctx: AuthContext,
    category: ResourceCategory,
    updates: dict,
    ip_address: str | None,
) -> ResourceCategory:
    require_category_manage(ctx, db, category.scope)  # type: ignore[arg-type]
    old = {
        "name": category.name,
        "description": category.description,
        "display_order": category.display_order,
        "is_active": category.is_active,
    }
    for key, value in updates.items():
        setattr(category, key, value)
    category.updated_at = utcnow()
    record(
        db,
        actor_user_id=ctx.user_id,
        action="UPDATE_RESOURCE_CATEGORY",
        entity_type="resource_category",
        entity_id=category.id,
        old_value=old,
        new_value=updates,
        ip_address=ip_address,
    )
    db.commit()
    db.refresh(category)
    return category


def create_resource(
    db: Session,
    *,
    ctx: AuthContext,
    category_id: uuid.UUID,
    division_id: uuid.UUID | None,
    title: str,
    description: str | None,
    url: str,
    resource_type: str,
    display_order: int,
    ip_address: str | None,
) -> tuple[Resource, ResourceCategory]:
    category = get_category_or_404(db, category_id)
    require_resource_manage(ctx, db, category.scope)  # type: ignore[arg-type]
    if category.scope == "ACADEMIC" and division_id is not None:
        raise app_http_exception(
            422,
            "Academic resources cannot belong to a division.",
            "VALIDATION_ERROR",
        )
    if division_id is not None:
        from app.models.division import Division

        if db.get(Division, division_id) is None:
            raise app_http_exception(404, "Division not found.", "NOT_FOUND")
    row = Resource(
        category_id=category_id,
        division_id=division_id,
        title=title,
        description=description,
        url=url,
        resource_type=resource_type,
        display_order=display_order,
        created_by=ctx.user_id,
        updated_by=ctx.user_id,
    )
    db.add(row)
    db.flush()
    record(
        db,
        actor_user_id=ctx.user_id,
        action="CREATE_RESOURCE",
        entity_type="resource",
        entity_id=row.id,
        new_value=_resource_snapshot(row),
        ip_address=ip_address,
    )
    db.commit()
    db.refresh(row)
    return row, category


def update_resource(
    db: Session,
    *,
    ctx: AuthContext,
    resource: Resource,
    updates: dict,
    ip_address: str | None,
) -> tuple[Resource, ResourceCategory]:
    scope = get_resource_scope(db, resource)
    require_resource_manage(ctx, db, scope)
    old = _resource_snapshot(resource)
    if "category_id" in updates:
        new_category = get_category_or_404(db, updates["category_id"])
        if new_category.scope != scope:
            raise app_http_exception(403, "Forbidden.", "FORBIDDEN")
    if "division_id" in updates:
        division_id = updates["division_id"]
        if scope == "ACADEMIC" and division_id is not None:
            raise app_http_exception(
                422,
                "Academic resources cannot belong to a division.",
                "VALIDATION_ERROR",
            )
        if division_id is not None:
            from app.models.division import Division

            if db.get(Division, division_id) is None:
                raise app_http_exception(404, "Division not found.", "NOT_FOUND")
    for key, value in updates.items():
        setattr(resource, key, value)
    resource.updated_by = ctx.user_id
    resource.updated_at = utcnow()
    category = get_category_or_404(db, resource.category_id)
    record(
        db,
        actor_user_id=ctx.user_id,
        action="UPDATE_RESOURCE",
        entity_type="resource",
        entity_id=resource.id,
        old_value=old,
        new_value=_resource_snapshot(resource),
        ip_address=ip_address,
    )
    db.commit()
    db.refresh(resource)
    return resource, category


def deactivate_resource(
    db: Session,
    *,
    ctx: AuthContext,
    resource: Resource,
    ip_address: str | None,
) -> tuple[Resource, ResourceCategory]:
    scope = get_resource_scope(db, resource)
    require_resource_manage(ctx, db, scope)
    old = {"is_active": resource.is_active}
    resource.is_active = False
    resource.updated_by = ctx.user_id
    resource.updated_at = utcnow()
    category = get_category_or_404(db, resource.category_id)
    record(
        db,
        actor_user_id=ctx.user_id,
        action="DEACTIVATE_RESOURCE",
        entity_type="resource",
        entity_id=resource.id,
        old_value=old,
        new_value={"is_active": False},
        ip_address=ip_address,
    )
    db.commit()
    db.refresh(resource)
    return resource, category
