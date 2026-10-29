"""Registration flow tests."""

import pytest
from fastapi import HTTPException
from sqlalchemy import select

from app.models.membership_term import MembershipTerm
from app.models.user import User
from app.services.auth import register_user
from tests.auth_helpers import TEST_PASSWORD, json_headers

REGISTER_TEST_IP = "203.0.113.9"


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


def test_register_rate_limits_by_ip_after_successful_attempts(db_session):
    """Successful registrations must count toward the per-IP limit."""
    for i in range(10):
        register_user(
            db_session,
            email=f"rate.success.{i}@up.edu.ph",
            password=TEST_PASSWORD,
            full_name=f"Rate Success {i}",
            ip_address=REGISTER_TEST_IP,
        )

    with pytest.raises(HTTPException) as exc_info:
        register_user(
            db_session,
            email="rate.success.blocked@up.edu.ph",
            password=TEST_PASSWORD,
            full_name="Rate Blocked",
            ip_address=REGISTER_TEST_IP,
        )
    assert exc_info.value.status_code == 429
    assert exc_info.value.detail["code"] == "RATE_LIMITED"


def test_register_rate_limits_by_ip_including_failed_duplicate_attempts(db_session):
    """Duplicate-email failures must also count toward the per-IP limit."""
    register_user(
        db_session,
        email="rate.mixed.dup@up.edu.ph",
        password=TEST_PASSWORD,
        full_name="Rate Mixed",
        ip_address=REGISTER_TEST_IP,
    )

    for _ in range(9):
        with pytest.raises(HTTPException) as exc_info:
            register_user(
                db_session,
                email="rate.mixed.dup@up.edu.ph",
                password=TEST_PASSWORD,
                full_name="Rate Mixed Again",
                ip_address=REGISTER_TEST_IP,
            )
        assert exc_info.value.status_code == 409

    with pytest.raises(HTTPException) as exc_info:
        register_user(
            db_session,
            email="rate.mixed.other@up.edu.ph",
            password=TEST_PASSWORD,
            full_name="Rate Mixed Other",
            ip_address=REGISTER_TEST_IP,
        )
    assert exc_info.value.status_code == 429
