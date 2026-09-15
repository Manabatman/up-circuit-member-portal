from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth.deps import AuthContext, require_permission
from app.db.session import get_db
from app.models.academic_year import AcademicYear
from app.schemas.academic_year import AcademicYearRead
from app.services.academic_years import fetch_current_academic_year

router = APIRouter(tags=["academic-years"])


@router.get("/academic-years/current", response_model=AcademicYearRead)
def get_current_academic_year(
    _ctx: AuthContext = Depends(require_permission("view_dashboard")),
    db: Session = Depends(get_db),
) -> AcademicYear:
    row = fetch_current_academic_year(db)
    if row is None:
        raise HTTPException(
            status_code=404,
            detail="No current academic year is configured.",
        )
    return row
