import pytest
from fastapi.testclient import TestClient

from app.main import app
from tests.auth_helpers import create_user, login_flow


@pytest.fixture
def public_client() -> TestClient:
    return TestClient(app)


def test_health_returns_ok(public_client: TestClient) -> None:
    response = public_client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_current_academic_year_requires_auth(client: TestClient) -> None:
    response = client.get("/api/v1/academic-years/current")
    assert response.status_code == 401


def test_current_academic_year_returns_seeded_row(
    client: TestClient, capturing_email_sender, db_session
) -> None:
    create_user(
        db_session,
        email="renewed.member@up.edu.ph",
        full_name="Lebron James",
        role_names=["MEMBER"],
        membership_status="RENEWED",
    )
    login_flow(client, email="renewed.member@up.edu.ph")
    response = client.get("/api/v1/academic-years/current")
    assert response.status_code == 200
    body = response.json()
    assert body["label"] == "2026-2027"
    assert body["start_year"] == 2026
    assert body["is_current"] is True


def test_unknown_route_uses_error_envelope(public_client: TestClient) -> None:
    response = public_client.get("/api/v1/does-not-exist")
    assert response.status_code == 404
    body = response.json()
    assert body["error"]["code"] == "NOT_FOUND"
    assert "message" in body["error"]
    assert body["error"]["details"] == {}
