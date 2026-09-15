"""Resource and category endpoints."""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, Query, Request, Response
from sqlalchemy.orm import Session

from app.auth.deps import AuthContext, get_current_user
from app.db.session import get_db
from app.exceptions import app_http_exception
from app.schemas.resource import (
    PaginationMeta,
    ResourceCategoryCreate,
    ResourceCategoryList,
    ResourceCategoryRead,
    ResourceCategoryUpdate,
    ResourceCreate,
    ResourceList,
    ResourceRead,
    ResourceUpdate,
    to_resource_read,
)
from app.services import resources as resource_service

router = APIRouter(tags=["resources"])


def _client_ip(request: Request) -> str | None:
    if request.client is None:
        return None
    host = request.client.host
    # Starlette TestClient uses "testclient", which is not a valid PostgreSQL inet.
    if host.count(".") != 3 and ":" not in host:
        return None
    return host


@router.get("/resource-categories", response_model=ResourceCategoryList)
def list_resource_categories(
    request: Request,
    scope: str = Query(...),
    include_inactive: bool = Query(default=False),
    ctx: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ResourceCategoryList:
    normalized = resource_service.normalize_scope(scope)
    is_admin = resource_service.require_resource_read(ctx, db, normalized)
    if include_inactive and not is_admin:
        raise app_http_exception(403, "Forbidden.", "FORBIDDEN")
    rows, total = resource_service.list_categories(
        db,
        scope=normalized,
        include_inactive=include_inactive and is_admin,
    )
    return ResourceCategoryList(
        items=[ResourceCategoryRead.model_validate(row) for row in rows],
        meta=PaginationMeta(total=total, offset=0, limit=total or 50),
    )


@router.post("/resource-categories", response_model=ResourceCategoryRead, status_code=201)
def create_resource_category(
    request: Request,
    body: ResourceCategoryCreate,
    ctx: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ResourceCategoryRead:
    row = resource_service.create_category(
        db,
        ctx=ctx,
        scope=body.scope,
        name=body.name,
        description=body.description,
        display_order=body.display_order,
        ip_address=_client_ip(request),
    )
    return ResourceCategoryRead.model_validate(row)


@router.patch("/resource-categories/{category_id}", response_model=ResourceCategoryRead)
def update_resource_category(
    request: Request,
    category_id: uuid.UUID,
    body: ResourceCategoryUpdate,
    ctx: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ResourceCategoryRead:
    category = resource_service.get_category_or_404(db, category_id)
    updates = body.model_dump(exclude_unset=True)
    if not updates:
        raise app_http_exception(422, "At least one field is required.", "VALIDATION_ERROR")
    row = resource_service.update_category(
        db,
        ctx=ctx,
        category=category,
        updates=updates,
        ip_address=_client_ip(request),
    )
    return ResourceCategoryRead.model_validate(row)


@router.get("/resources", response_model=ResourceList)
def list_resources(
    request: Request,
    scope: str = Query(...),
    category_id: uuid.UUID | None = Query(default=None),
    division_id: uuid.UUID | None = Query(default=None),
    include_inactive: bool = Query(default=False),
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=100),
    ctx: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ResourceList:
    normalized = resource_service.normalize_scope(scope)
    is_admin = resource_service.require_resource_read(ctx, db, normalized)
    if include_inactive and not is_admin:
        raise app_http_exception(403, "Forbidden.", "FORBIDDEN")
    global_only = division_id is None and not is_admin
    rows, total = resource_service.list_resources(
        db,
        scope=normalized,
        category_id=category_id,
        division_id=division_id,
        global_only=global_only,
        include_inactive=include_inactive and is_admin,
        offset=offset,
        limit=limit,
    )
    return ResourceList(
        items=[to_resource_read(resource, category) for resource, category in rows],
        meta=PaginationMeta(total=total, offset=offset, limit=limit),
    )


@router.get("/resources/{resource_id}", response_model=ResourceRead)
def get_resource(
    resource_id: uuid.UUID,
    ctx: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ResourceRead:
    resource, category = resource_service.get_resource_with_category(db, resource_id)
    is_admin = resource_service.require_resource_read(ctx, db, category.scope)  # type: ignore[arg-type]
    if not is_admin and (not resource.is_active or not category.is_active):
        raise app_http_exception(404, "Resource not found.", "NOT_FOUND")
    return to_resource_read(resource, category)


@router.post("/resources", response_model=ResourceRead, status_code=201)
def create_resource(
    request: Request,
    body: ResourceCreate,
    response: Response,
    ctx: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ResourceRead:
    resource, category = resource_service.create_resource(
        db,
        ctx=ctx,
        category_id=body.category_id,
        division_id=body.division_id,
        title=body.title,
        description=body.description,
        url=str(body.url),
        resource_type=body.resource_type,
        display_order=body.display_order,
        ip_address=_client_ip(request),
    )
    response.headers["Location"] = f"/api/v1/resources/{resource.id}"
    return to_resource_read(resource, category)


@router.patch("/resources/{resource_id}", response_model=ResourceRead)
def update_resource(
    request: Request,
    resource_id: uuid.UUID,
    body: ResourceUpdate,
    ctx: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ResourceRead:
    resource = resource_service.get_resource_or_404(db, resource_id)
    updates = body.model_dump(exclude_unset=True)
    if not updates:
        raise app_http_exception(422, "At least one field is required.", "VALIDATION_ERROR")
    if "url" in updates and updates["url"] is not None:
        updates["url"] = str(updates["url"])
    resource, category = resource_service.update_resource(
        db,
        ctx=ctx,
        resource=resource,
        updates=updates,
        ip_address=_client_ip(request),
    )
    return to_resource_read(resource, category)


@router.delete("/resources/{resource_id}", status_code=204)
def delete_resource(
    request: Request,
    resource_id: uuid.UUID,
    ctx: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Response:
    resource = resource_service.get_resource_or_404(db, resource_id)
    resource_service.deactivate_resource(
        db,
        ctx=ctx,
        resource=resource,
        ip_address=_client_ip(request),
    )
    return Response(status_code=204)
