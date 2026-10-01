"""Registration flow tests."""

from sqlalchemy import select

from app.models.membership_term import MembershipTerm
from app.models.user import User
from tests.auth_helpers import TEST_PASSWORD, json_headers


def test_register_creates_pending_member(client, db_session):
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "new.member@up.edu.ph",
            "password": TEST_PASSWORD,
            "full_name": "New Member",
        },
        headers=json_headers(),
    )
    assert response.status_code == 201
    user = db_session.scalar(
        select(User).where(User.email == "new.member@up.edu.ph")
    )
    assert user is not None
    term = db_session.scalar(
        select(MembershipTerm).where(MembershipTerm.user_id == user.id)
    )
    assert term is not None
    assert term.status == "PENDING"


def test_register_rejects_duplicate(client, db_session):
    client.post(
        "/api/v1/auth/register",
        json={
            "email": "dup.member@up.edu.ph",
            "password": TEST_PASSWORD,
            "full_name": "Dup One",
        },
        headers=json_headers(),
    )
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "dup.member@up.edu.ph",
            "password": TEST_PASSWORD,
            "full_name": "Dup Two",
        },
        headers=json_headers(),
    )
    assert response.status_code == 409
