"""Member feedback (beta)."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.auth.deps import AuthContext, get_current_user
from app.db.session import get_db
from app.schemas.feedback import FeedbackCreate, FeedbackCreated
from app.services import feedback as feedback_service

router = APIRouter(tags=["feedback"])


@router.post("/feedback", response_model=FeedbackCreated)
def submit_feedback(
    body: FeedbackCreate,
    ctx: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> FeedbackCreated:
    row = feedback_service.create_feedback(
        db,
        user_id=ctx.user_id,
        category=body.category,
        message=body.message,
        page_path=body.page_path,
    )
    return FeedbackCreated(id=str(row.id))
