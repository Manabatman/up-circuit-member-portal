import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class DivisionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    description: str | None
    display_order: int
    is_active: bool
    is_standing_division: bool
    created_at: datetime
    updated_at: datetime


class DivisionList(BaseModel):
    items: list[DivisionRead]
    meta: dict[str, int]


class DivisionUpdate(BaseModel):
    description: str | None = None
    display_order: int | None = None
    is_active: bool | None = None
