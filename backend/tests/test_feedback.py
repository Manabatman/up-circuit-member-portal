"""Feedback API tests."""

from tests.auth_helpers import create_user, json_headers, login_flow


def test_feedback_requires_auth(client):
    response = client.post(
        "/api/v1/feedback",
        json={"category": "idea", "message": "Nice portal", "page_path": "/dashboard"},
        headers={"Origin": "http://localhost:5173"},
    )
    assert response.status_code == 401


def test_feedback_stores_context(client, capturing_email_sender, db_session):
    create_user(
        db_session,
        email="feedback@up.edu.ph",
        full_name="Feedback Tester",
        role_names=["MEMBER"],
        membership_status="RENEWED",
    )
    login_flow(client, email="feedback@up.edu.ph")

    response = client.post(
        "/api/v1/feedback",
        json={
            "category": "broken",
            "message": "Button failed on resources",
            "page_path": "/resources",
        },
        headers=json_headers(),
    )
    assert response.status_code == 200
    body = response.json()
    assert "id" in body

    from sqlalchemy import select

    from app.models.feedback import Feedback

    from app.models.user import User

    from sqlalchemy import func

    user = db_session.scalar(
        select(User).where(func.lower(User.email) == "feedback@up.edu.ph")
    )
    row = db_session.scalar(select(Feedback).where(Feedback.user_id == user.id))
    assert row is not None
    assert row.category == "broken"
    assert row.page_path == "/resources"
    assert row.message == "Button failed on resources"
