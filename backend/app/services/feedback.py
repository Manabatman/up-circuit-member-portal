"""Member feedback submission (beta)."""

from __future__ import annotations

from datetime import timedelta

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.auth.tokens import utcnow
from app.exceptions import app_http_exception
from app.models.feedback import Feedback

FEEDBACK_WINDOW = timedelta(hours=1)
FEEDBACK_USER_LIMIT = 5


def _recent_count_for_user(db: Session, user_id) -> int:
    since = utcnow() - FEEDBACK_WINDOW
    return (
        db.scalar(
            select(func.count())
            .select_from(Feedback)
            .where(Feedback.user_id == user_id, Feedback.created_at >= since)
        )
        or 0
    )


def create_feedback(
    db: Session,
    *,
    user_id,
    category: str,
    message: str,
    page_path: str,
) -> Feedback:
    if _recent_count_for_user(db, user_id) >= FEEDBACK_USER_LIMIT:
        raise app_http_exception(
            429, "Too many feedback submissions. Try again later.", "RATE_LIMITED"
        )
    row = Feedback(
        user_id=user_id,
        category=category,
        message=message.strip(),
        page_path=page_path,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row
