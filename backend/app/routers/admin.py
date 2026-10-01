"""Admin overview and utilities."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.auth.deps import require_permission
from app.db.session import get_db
from app.schemas.admin import AdminAuditEntry, AdminOverviewRead, AdminRecentMember
from app.services import admin_overview as admin_service

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/overview", response_model=AdminOverviewRead)
def admin_overview(
    _ctx=Depends(require_permission("view_admin_dashboard")),
    db: Session = Depends(get_db),
) -> AdminOverviewRead:
    data = admin_service.get_admin_overview(db)
    return AdminOverviewRead(
        total_members=data["total_members"],
        pending_members=data["pending_members"],
        renewed_members=data["renewed_members"],
        not_renewed_members=data["not_renewed_members"],
        recent_registrations=[
            AdminRecentMember(**item) for item in data["recent_registrations"]
        ],
        recent_audit=[AdminAuditEntry(**item) for item in data["recent_audit"]],
    )
