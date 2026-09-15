"""SQLAlchemy mapping for app.academic_years (Section 4).

This is the database table. API JSON lives in app.schemas — not here.
"""

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, SmallInteger, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class AcademicYear(Base):
    __tablename__ = "academic_years"
    __table_args__ = {"schema": "app"}

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=func.gen_random_uuid(),
    )
    start_year: Mapped[int] = mapped_column(SmallInteger, nullable=False, unique=True)
    label: Mapped[str] = mapped_column(Text, nullable=False)
    is_current: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    renewal_opens_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    renewal_closes_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )
