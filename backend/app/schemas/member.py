import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class MemberDirectoryRead(BaseModel):
    user_id: uuid.UUID
    full_name: str
    degree_program: str | None
    year_level: str | None
    batch: str | None
    membership_status: str
    primary_division_id: uuid.UUID | None = None
    primary_division_name: str | None = None


class MemberAdminRead(MemberDirectoryRead):
    email: str
    student_number: str | None
    contact_number: str | None


class MemberSelfRead(BaseModel):
    user_id: uuid.UUID
    email: str
    full_name: str
    student_number: str | None
    degree_program: str | None
    year_level: str | None
    contact_number: str | None
    batch: str | None
    membership_status: str


class MemberList(BaseModel):
    items: list[MemberDirectoryRead | MemberAdminRead]
    meta: dict


class MembershipSelfRead(BaseModel):
    academic_year_label: str
    membership_status: str
    renewed_at: datetime | None
    needs_renewal: bool


class MembershipAdminRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    academic_year_id: uuid.UUID
    academic_year_label: str
    status: str
    renewed_at: datetime | None


class MembershipStatusUpdate(BaseModel):
    status: str
    academic_year: str
    reason: str
    confirm_full_name: str
