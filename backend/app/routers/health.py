from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.health import HealthResponse, ReadinessResponse

router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthResponse)
def get_health() -> HealthResponse:
    """Liveness only. Does not open a database connection (Section 6)."""
    return HealthResponse(status="ok")


@router.get("/health/ready", response_model=ReadinessResponse)
def get_readiness(db: Session = Depends(get_db)) -> JSONResponse | ReadinessResponse:
    """Readiness: verifies the app can reach Postgres."""
    try:
        db.execute(text("SELECT 1"))
    except Exception:
        return JSONResponse(
            status_code=503,
            content=ReadinessResponse(
                status="degraded",
                database="unavailable",
            ).model_dump(),
        )
    return ReadinessResponse(status="ok", database="ok")
