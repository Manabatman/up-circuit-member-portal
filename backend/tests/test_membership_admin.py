"""Membership administration tests."""

import uuid

from sqlalchemy import select

from app.models.audit_log import AuditLog
from app.models.resource import Resource, ResourceCategory
from app.models.user import User
from tests.auth_helpers import create_user, json_headers, login_flow


def _create_academic_resource(db):
    category = ResourceCategory(scope="ACADEMIC", name="Course Materials", is_active=True)
    db.add(category)
    db.flush()
    resource = Resource(
        category_id=category.id,
        title="Notes",
        url="https://drive.google.com/demo",
        resource_type="GOOGLE_DRIVE",
        is_active=True,
    )
    db.add(resource)
    db.commit()
    return resource


def test_renewals_admin_can_flip_membership_and_unlock_academic_drive(
    client, capturing_email_sender, db_session
):
    create_user(
        db_session,
        email="notrenewed.member@up.edu.ph",
        full_name="Stephen curry",
        role_names=["MEMBER"],
        membership_status="NOT_RENEWED",
    )
    create_user(
        db_session,
        email="renewals.admin@up.edu.ph",
        full_name="Lakan Fuentez",
        role_names=["MEMBER", "RENEWALS_ADMIN"],
        membership_status="RENEWED",
    )
    _create_academic_resource(db_session)

    login_flow(client, email="notrenewed.member@up.edu.ph")
    blocked = client.get("/api/v1/resources?scope=academic", headers=json_headers())
    assert blocked.status_code == 403
    assert blocked.json()["error"]["code"] == "MEMBERSHIP_REQUIRED"

    client.post("/api/v1/auth/logout", headers=json_headers())
    login_flow(client, email="renewals.admin@up.edu.ph")
    member = db_session.scalar(
        select(User).where(User.email == "notrenewed.member@up.edu.ph")
    )
    assert member is not None

    patch = client.patch(
        f"/api/v1/membership/{member.id}/status",
        json={
            "status": "RENEWED",
            "academic_year": "2026-2027",
            "reason": "Demo renewal",
            "confirm_full_name": "Stephen curry",
        },
        headers=json_headers(),
    )
    assert patch.status_code == 200

    client.post("/api/v1/auth/logout", headers=json_headers())
    login_flow(client, email="notrenewed.member@up.edu.ph")
    allowed = client.get("/api/v1/resources?scope=academic", headers=json_headers())
    assert allowed.status_code == 200


def test_member_cannot_update_membership_status(client, capturing_email_sender, db_session):
    target = create_user(
        db_session,
        email="notrenewed.member@up.edu.ph",
        full_name="Stephen curry",
        role_names=["MEMBER"],
        membership_status="NOT_RENEWED",
    )
    create_user(
        db_session,
        email="renewed.member@up.edu.ph",
        full_name="Lebron James",
        role_names=["MEMBER"],
        membership_status="RENEWED",
    )

    login_flow(client, email="renewed.member@up.edu.ph")
    response = client.patch(
        f"/api/v1/membership/{target.id}/status",
        json={
            "status": "RENEWED",
            "academic_year": "2026-2027",
            "reason": "Attempt",
            "confirm_full_name": "Stephen curry",
        },
        headers=json_headers(),
    )
    assert response.status_code == 403


def test_academic_admin_cannot_update_membership_status(
    client, capturing_email_sender, db_session
):
    target = create_user(
        db_session,
        email="notrenewed.member@up.edu.ph",
        full_name="Stephen curry",
        role_names=["MEMBER"],
        membership_status="NOT_RENEWED",
    )
    create_user(
        db_session,
        email="academic.admin@up.edu.ph",
        full_name="Sadie Sink",
        role_names=["MEMBER", "ACADEMIC_ADMIN"],
        membership_status="NOT_RENEWED",
    )

    login_flow(client, email="academic.admin@up.edu.ph")
    response = client.patch(
        f"/api/v1/membership/{target.id}/status",
        json={
            "status": "RENEWED",
            "academic_year": "2026-2027",
            "reason": "Attempt",
            "confirm_full_name": "Stephen curry",
        },
        headers=json_headers(),
    )
    assert response.status_code == 403


def test_mismatched_confirm_full_name_rejected(client, capturing_email_sender, db_session):
    target = create_user(
        db_session,
        email="notrenewed.member@up.edu.ph",
        full_name="Stephen curry",
        role_names=["MEMBER"],
        membership_status="NOT_RENEWED",
    )
    create_user(
        db_session,
        email="renewals.admin@up.edu.ph",
        full_name="Lakan Fuentez",
        role_names=["MEMBER", "RENEWALS_ADMIN"],
        membership_status="RENEWED",
    )

    login_flow(client, email="renewals.admin@up.edu.ph")
    response = client.patch(
        f"/api/v1/membership/{target.id}/status",
        json={
            "status": "RENEWED",
            "academic_year": "2026-2027",
            "reason": "Wrong name",
            "confirm_full_name": "Wrong Name",
        },
        headers=json_headers(),
    )
    assert response.status_code == 422


def test_membership_update_writes_audit_log(client, capturing_email_sender, db_session):
    target = create_user(
        db_session,
        email="notrenewed.member@up.edu.ph",
        full_name="Stephen curry",
        role_names=["MEMBER"],
        membership_status="NOT_RENEWED",
    )
    create_user(
        db_session,
        email="renewals.admin@up.edu.ph",
        full_name="Lakan Fuentez",
        role_names=["MEMBER", "RENEWALS_ADMIN"],
        membership_status="RENEWED",
    )

    login_flow(client, email="renewals.admin@up.edu.ph")
    response = client.patch(
        f"/api/v1/membership/{target.id}/status",
        json={
            "status": "RENEWED",
            "academic_year": "2026-2027",
            "reason": "Demo renewal",
            "confirm_full_name": "Stephen curry",
        },
        headers=json_headers(),
    )
    assert response.status_code == 200
    term_id = uuid.UUID(response.json()["id"])

    row = db_session.scalar(
        select(AuditLog).where(
            AuditLog.entity_type == "membership_term",
            AuditLog.entity_id == term_id,
        )
    )
    assert row is not None
    assert row.action == "UPDATE_MEMBERSHIP_STATUS"
