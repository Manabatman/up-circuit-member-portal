"""Resource API tests for M2."""

import uuid
from sqlalchemy import select

from app.models.audit_log import AuditLog
from app.models.resource import Resource, ResourceCategory
from tests.auth_helpers import create_user, json_headers, login_flow


def _create_category(db, *, scope: str, name: str, display_order: int = 0) -> ResourceCategory:
    row = ResourceCategory(scope=scope, name=name, display_order=display_order, is_active=True)
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


def _create_resource(
    db,
    *,
    category: ResourceCategory,
    title: str,
    url: str = "https://drive.google.com/demo",
    is_active: bool = True,
) -> Resource:
    row = Resource(
        category_id=category.id,
        title=title,
        description="Demo resource",
        url=url,
        resource_type="GOOGLE_DRIVE",
        display_order=0,
        is_active=is_active,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


def test_renewed_member_lists_academic_resources(client, capturing_email_sender, db_session):
    create_user(
        db_session,
        email="renewed.member@up.edu.ph",
        full_name="Lebron James",
        role_names=["MEMBER"],
        membership_status="RENEWED",
    )
    category = _create_category(db_session, scope="ACADEMIC", name="Course Materials")
    _create_resource(db_session, category=category, title="Circuit Notes")

    login_flow(client, email="renewed.member@up.edu.ph")
    response = client.get("/api/v1/resources?scope=academic", headers=json_headers())
    assert response.status_code == 200
    body = response.json()
    assert body["meta"]["total"] == 1
    assert body["items"][0]["title"] == "Circuit Notes"


def test_not_renewed_member_blocked_from_academic_resources(client, capturing_email_sender, db_session):
    create_user(
        db_session,
        email="notrenewed.member@up.edu.ph",
        full_name="Stephen curry",
        role_names=["MEMBER"],
        membership_status="NOT_RENEWED",
    )
    category = _create_category(db_session, scope="ACADEMIC", name="Course Materials")
    _create_resource(db_session, category=category, title="Circuit Notes")

    login_flow(client, email="notrenewed.member@up.edu.ph")
    response = client.get("/api/v1/resources?scope=academic", headers=json_headers())
    assert response.status_code == 403
    assert response.json()["error"]["code"] == "MEMBERSHIP_REQUIRED"


def test_not_renewed_member_can_list_organizational_resources(client, capturing_email_sender, db_session):
    create_user(
        db_session,
        email="notrenewed.member@up.edu.ph",
        full_name="Stephen curry",
        role_names=["MEMBER"],
        membership_status="NOT_RENEWED",
    )
    category = _create_category(db_session, scope="ORGANIZATIONAL", name="Forms")
    _create_resource(db_session, category=category, title="Request Form")

    login_flow(client, email="notrenewed.member@up.edu.ph")
    response = client.get("/api/v1/resources?scope=organizational", headers=json_headers())
    assert response.status_code == 200
    assert response.json()["meta"]["total"] == 1


def test_unauthenticated_cannot_list_resources(client):
    response = client.get("/api/v1/resources?scope=academic")
    assert response.status_code == 401


def test_academic_admin_can_manage_academic_resources(client, capturing_email_sender, db_session):
    create_user(
        db_session,
        email="academic.admin@up.edu.ph",
        full_name="Sadie Sink",
        role_names=["MEMBER", "ACADEMIC_ADMIN"],
        membership_status="NOT_RENEWED",
    )
    category = _create_category(db_session, scope="ACADEMIC", name="Course Materials")

    login_flow(client, email="academic.admin@up.edu.ph")
    response = client.post(
        "/api/v1/resources",
        json={
            "category_id": str(category.id),
            "title": "New Drive Folder",
            "url": "https://drive.google.com/new-folder",
            "resource_type": "GOOGLE_DRIVE",
        },
        headers=json_headers(),
    )
    assert response.status_code == 201


def test_academic_admin_forbidden_on_organizational_resources(client, capturing_email_sender, db_session):
    create_user(
        db_session,
        email="academic.admin@up.edu.ph",
        full_name="Sadie Sink",
        role_names=["MEMBER", "ACADEMIC_ADMIN"],
        membership_status="NOT_RENEWED",
    )
    category = _create_category(db_session, scope="ORGANIZATIONAL", name="Forms")

    login_flow(client, email="academic.admin@up.edu.ph")
    response = client.get("/api/v1/resources?scope=organizational", headers=json_headers())
    assert response.status_code == 200

    create = client.post(
        "/api/v1/resources",
        json={
            "category_id": str(category.id),
            "title": "Org Form",
            "url": "https://forms.google.com/demo",
            "resource_type": "GOOGLE_FORM",
        },
        headers=json_headers(),
    )
    assert create.status_code == 403


def test_member_cannot_create_resources(client, capturing_email_sender, db_session):
    create_user(
        db_session,
        email="renewed.member@up.edu.ph",
        full_name="Lebron James",
        role_names=["MEMBER"],
        membership_status="RENEWED",
    )
    category = _create_category(db_session, scope="ACADEMIC", name="Course Materials")

    login_flow(client, email="renewed.member@up.edu.ph")
    response = client.post(
        "/api/v1/resources",
        json={
            "category_id": str(category.id),
            "title": "Member Attempt",
            "url": "https://drive.google.com/member",
            "resource_type": "GOOGLE_DRIVE",
        },
        headers=json_headers(),
    )
    assert response.status_code == 403


def test_inactive_resources_hidden_from_members(client, capturing_email_sender, db_session):
    create_user(
        db_session,
        email="renewed.member@up.edu.ph",
        full_name="Lebron James",
        role_names=["MEMBER"],
        membership_status="RENEWED",
    )
    category = _create_category(db_session, scope="ACADEMIC", name="Course Materials")
    _create_resource(
        db_session,
        category=category,
        title="Hidden",
        is_active=False,
    )

    login_flow(client, email="renewed.member@up.edu.ph")
    response = client.get("/api/v1/resources?scope=academic", headers=json_headers())
    assert response.status_code == 200
    assert response.json()["meta"]["total"] == 0


def test_invalid_url_rejected(client, capturing_email_sender, db_session):
    create_user(
        db_session,
        email="academic.admin@up.edu.ph",
        full_name="Sadie Sink",
        role_names=["MEMBER", "ACADEMIC_ADMIN"],
        membership_status="NOT_RENEWED",
    )
    category = _create_category(db_session, scope="ACADEMIC", name="Course Materials")

    login_flow(client, email="academic.admin@up.edu.ph")
    response = client.post(
        "/api/v1/resources",
        json={
            "category_id": str(category.id),
            "title": "Bad URL",
            "url": "ftp://example.com/file",
            "resource_type": "EXTERNAL_LINK",
        },
        headers=json_headers(),
    )
    assert response.status_code == 422


def test_admin_url_update_visible_to_member(client, capturing_email_sender, db_session):
    create_user(
        db_session,
        email="renewed.member@up.edu.ph",
        full_name="Lebron James",
        role_names=["MEMBER"],
        membership_status="RENEWED",
    )
    create_user(
        db_session,
        email="academic.admin@up.edu.ph",
        full_name="Sadie Sink",
        role_names=["MEMBER", "ACADEMIC_ADMIN"],
        membership_status="NOT_RENEWED",
    )
    category = _create_category(db_session, scope="ACADEMIC", name="Course Materials")
    resource = _create_resource(
        db_session,
        category=category,
        title="Shared Notes",
        url="https://drive.google.com/old-url",
    )

    login_flow(client, email="academic.admin@up.edu.ph")
    patch = client.patch(
        f"/api/v1/resources/{resource.id}",
        json={"url": "https://drive.google.com/new-url"},
        headers=json_headers(),
    )
    assert patch.status_code == 200

    client.post("/api/v1/auth/logout", headers=json_headers())
    login_flow(client, email="renewed.member@up.edu.ph")
    response = client.get("/api/v1/resources?scope=academic", headers=json_headers())
    assert response.status_code == 200
    assert response.json()["items"][0]["url"] == "https://drive.google.com/new-url"


def test_resource_mutation_writes_audit_log(client, capturing_email_sender, db_session):
    create_user(
        db_session,
        email="academic.admin@up.edu.ph",
        full_name="Sadie Sink",
        role_names=["MEMBER", "ACADEMIC_ADMIN"],
        membership_status="NOT_RENEWED",
    )
    category = _create_category(db_session, scope="ACADEMIC", name="Course Materials")

    login_flow(client, email="academic.admin@up.edu.ph")
    create = client.post(
        "/api/v1/resources",
        json={
            "category_id": str(category.id),
            "title": "Audited Resource",
            "url": "https://drive.google.com/audited",
            "resource_type": "GOOGLE_DRIVE",
        },
        headers=json_headers(),
    )
    assert create.status_code == 201
    resource_id = uuid.UUID(create.json()["id"])

    row = db_session.scalar(
        select(AuditLog).where(
            AuditLog.entity_type == "resource",
            AuditLog.entity_id == resource_id,
        )
    )
    assert row is not None
    assert row.action == "CREATE_RESOURCE"
