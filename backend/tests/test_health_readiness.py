from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.exc import OperationalError

from app.config import settings
from app.db.session import get_db
from app.main import app


@pytest.fixture
def public_client() -> TestClient:
    return TestClient(app)


def test_health_ready_returns_ok(public_client: TestClient) -> None:
    response = public_client.get("/api/v1/health/ready")
    assert response.status_code == 200
    body = response.json()
    assert body == {"status": "ok", "database": "ok"}


def test_health_ready_returns_503_when_database_unavailable(
    public_client: TestClient,
) -> None:
    class BrokenSession:
        def execute(self, *_args, **_kwargs):
            raise OperationalError("SELECT 1", {}, Exception("connection failed"))

        def close(self) -> None:
            pass

    def _broken_get_db() -> Generator[BrokenSession, None, None]:
        yield BrokenSession()

    app.dependency_overrides[get_db] = _broken_get_db
    try:
        origin = str(settings.frontend_origin).rstrip("/")
        response = public_client.get(
            "/api/v1/health/ready",
            headers={"Origin": origin},
        )
        assert response.status_code == 503
        assert response.json() == {"status": "degraded", "database": "unavailable"}
        assert response.headers.get("access-control-allow-origin") == origin
    finally:
        app.dependency_overrides.pop(get_db, None)


def test_unauthorized_auth_me_includes_cors_header(public_client: TestClient) -> None:
    origin = str(settings.frontend_origin).rstrip("/")
    response = public_client.get(
        "/api/v1/auth/me",
        headers={"Origin": origin},
    )
    assert response.status_code == 401
    assert response.headers.get("access-control-allow-origin") == origin
