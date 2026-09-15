from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.academic_year import AcademicYear


def fetch_current_academic_year(db: Session) -> AcademicYear | None:
    return db.scalars(
        select(AcademicYear).where(AcademicYear.is_current.is_(True))
    ).first()
