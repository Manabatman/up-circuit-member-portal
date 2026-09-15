"""Division content-hub API tests for M6."""

from sqlalchemy import select

from app.models.division import Division
from app.models.resource import Resource, ResourceCategory
from tests.auth_helpers import create_user, json_headers, login_flow
from tests.test_resources import _create_category, _create_resource


def _get_division(db, name: str) -> Division:
    row = db.scalar(select(Division).where(Division.name == name))
    assert row is not None
    return row


def test_member_lists_standing_divisions(client, capturing_email_sender, db_session):
    create_user(
        db_session,
        email="renewed.member@up.edu.ph",
        full_name="Lebron James",
        role_names=["MEMBER"],
        membership_status="RENEWED",
    )

    login_flow(client, email="renewed.member@up.edu.ph")
    response = client.get("/api/v1/divisions", headers=json_headers())
    assert response.status_code == 200
    names = [item["name"] for item in response.json()["items"]]
    assert "Academic Affairs Division" in names
    assert "Executive Board" in names
    assert len(names) == 7
    exec_board = next(i for i in response.json()["items"] if i["name"] == "Executive Board")
    assert exec_board["is_standing_division"] is False


def test_global_resources_exclude_division_owned(client, capturing_email_sender, db_session):
    create_user(
        db_session,
        email="renewed.member@up.edu.ph",
        full_name="Lebron James",
        role_names=["MEMBER"],
        membership_status="RENEWED",
    )
    category = _create_category(db_session, scope="ORGANIZATIONAL", name="Communication")
    division = _get_division(db_session, "Publicity Division")
    global_resource = _create_resource(
        db_session,
        category=category,
        title="Constitution",
    )
    division_resource = Resource(
        category_id=category.id,
        division_id=division.id,
        title="Publicity GC",
        description="Division chat",
        url="https://chat.example.com/pub",
        resource_type="EXTERNAL_LINK",
        display_order=0,
        is_active=True,
    )
    db_session.add(division_resource)
    db_session.commit()

    login_flow(client, email="renewed.member@up.edu.ph")
    global_response = client.get("/api/v1/resources?scope=organizational", headers=json_headers())
    assert global_response.status_code == 200
    titles = [item["title"] for item in global_response.json()["items"]]
    assert global_resource.title in titles
    assert division_resource.title not in titles

    division_response = client.get(
        f"/api/v1/resources?scope=organizational&division_id={division.id}",
        headers=json_headers(),
    )
    assert division_response.status_code == 200
    division_titles = [item["title"] for item in division_response.json()["items"]]
    assert division_resource.title in division_titles
    assert global_resource.title not in division_titles


def test_super_admin_can_update_division_description(client, capturing_email_sender, db_session):
    create_user(
        db_session,
        email="super.admin@up.edu.ph",
        full_name="Super Admin",
        role_names=["MEMBER", "SUPER_ADMIN"],
        membership_status="RENEWED",
    )
    division = _get_division(db_session, "Academic Affairs Division")

    login_flow(client, email="super.admin@up.edu.ph")
    response = client.patch(
        f"/api/v1/divisions/{division.id}",
        json={"description": "The Academic Affairs Division is responsible for academic programs."},
        headers=json_headers(),
    )
    assert response.status_code == 200
    assert "Academic Affairs Division is responsible" in response.json()["description"]


def test_division_name_stays_authoritative(client, capturing_email_sender, db_session):
    create_user(
        db_session,
        email="super.admin@up.edu.ph",
        full_name="Super Admin",
        role_names=["MEMBER", "SUPER_ADMIN"],
        membership_status="RENEWED",
    )
    division = _get_division(db_session, "Finance Division")
    original_name = division.name

    login_flow(client, email="super.admin@up.edu.ph")
    response = client.patch(
        f"/api/v1/divisions/{division.id}",
        json={"description": "Finance division page intro."},
        headers=json_headers(),
    )
    assert response.status_code == 200
    assert response.json()["name"] == original_name


def test_requests_category_seeded(client, capturing_email_sender, db_session):
    create_user(
        db_session,
        email="renewed.member@up.edu.ph",
        full_name="Lebron James",
        role_names=["MEMBER"],
        membership_status="RENEWED",
    )

    login_flow(client, email="renewed.member@up.edu.ph")
    response = client.get(
        "/api/v1/resource-categories?scope=organizational",
        headers=json_headers(),
    )
    assert response.status_code == 200
    names = [item["name"] for item in response.json()["items"]]
    assert "Requests" in names
