import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class AcademicYearRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    start_year: int
    label: str
    is_current: bool
    renewal_opens_at: datetime | None
    renewal_closes_at: datetime | None
    created_at: datetime
    updated_at: datetime
