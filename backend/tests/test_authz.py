"""Authorization boundary tests for M1."""

import pytest

from app.auth.deps import check_permission
from app.exceptions import app_http_exception
from tests.auth_helpers import build_context, create_user, json_headers, login_flow


def test_member_cannot_use_admin_permission(db_session):
    user = create_user(
        db_session,
        email="notrenewed.member@up.edu.ph",
        full_name="Stephen curry",
        role_names=["MEMBER"],
        membership_status="NOT_RENEWED",
    )
    ctx = build_context(db_session, user)
    with pytest.raises(Exception) as exc:
        check_permission(ctx, db_session, "manage_roles")
    assert exc.value.status_code == 403
    assert exc.value.detail["code"] == "FORBIDDEN"


def test_not_renewed_member_blocked_from_academic_resources(db_session):
    user = create_user(
        db_session,
        email="notrenewed.member@up.edu.ph",
        full_name="Stephen curry",
        role_names=["MEMBER"],
        membership_status="NOT_RENEWED",
    )
    ctx = build_context(db_session, user)
    with pytest.raises(Exception) as exc:
        check_permission(ctx, db_session, "view_academic_resources")
    assert exc.value.status_code == 403
    assert exc.value.detail["code"] == "MEMBERSHIP_REQUIRED"


def test_not_renewed_academic_admin_can_manage_resources(db_session):
    user = create_user(
        db_session,
        email="academic.admin@up.edu.ph",
        full_name="Sadie Sink",
        role_names=["MEMBER", "ACADEMIC_ADMIN"],
        membership_status="NOT_RENEWED",
    )
    ctx = build_context(db_session, user)
    check_permission(ctx, db_session, "manage_academic_resources")


def test_absent_membership_term_is_not_renewed(db_session):
    user = create_user(
        db_session,
        email="orphan@up.edu.ph",
        full_name="Dana Cruz",
        role_names=["MEMBER"],
        membership_status=None,
    )
    ctx = build_context(db_session, user)
    assert ctx.membership_status == "NOT_RENEWED"


def test_renewed_member_has_dashboard_permission(client, capturing_email_sender, db_session):
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
