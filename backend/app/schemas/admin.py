import uuid
from datetime import datetime

from pydantic import BaseModel


class AdminOverviewRead(BaseModel):
    total_members: int
    pending_members: int
    renewed_members: int
    not_renewed_members: int
    recent_registrations: list["AdminRecentMember"]
    recent_audit: list["AdminAuditEntry"]


class AdminRecentMember(BaseModel):
    user_id: uuid.UUID
    full_name: str
    email: str
    membership_status: str
    registered_at: datetime


class AdminAuditEntry(BaseModel):
    id: uuid.UUID
    action: str
    entity_type: str
    created_at: datetime
    actor_email: str | None
