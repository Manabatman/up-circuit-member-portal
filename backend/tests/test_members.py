"""Member directory and profile API tests."""

from tests.auth_helpers import create_user, json_headers, login_flow


def _enrich_profile(db, user, **fields) -> None:
    from app.models.profile import Profile
    from sqlalchemy import select

    profile = db.scalar(select(Profile).where(Profile.user_id == user.id))
    assert profile is not None
    for key, value in fields.items():
        setattr(profile, key, value)
    db.commit()


def test_directory_hides_sensitive_fields_from_members(client, capturing_email_sender, db_session):
    member = create_user(
        db_session,
        email="renewed.member@up.edu.ph",
        full_name="Lebron James",
        role_names=["MEMBER"],
        membership_status="RENEWED",
    )
    other = create_user(
        db_session,
        email="peer@up.edu.ph",
        full_name="Peer Member",
        role_names=["MEMBER"],
        membership_status="RENEWED",
    )
    _enrich_profile(
        db_session,
        other,
        student_number="202012345",
        contact_number="09171234567",
        degree_program="BS EE",
        batch="2020",
    )

    login_flow(client, email="renewed.member@up.edu.ph")
    response = client.get("/api/v1/members", headers=json_headers())
    assert response.status_code == 200
    item = next(row for row in response.json()["items"] if row["full_name"] == "Peer Member")
    assert "email" not in item
    assert "student_number" not in item
    assert "contact_number" not in item
    assert item["degree_program"] == "BS EE"


def test_admin_directory_includes_sensitive_fields(client, capturing_email_sender, db_session):
    create_user(
        db_session,
        email="renewals.admin@up.edu.ph",
        full_name="Lakan Fuentez",
        role_names=["MEMBER", "RENEWALS_ADMIN"],
        membership_status="RENEWED",
    )
    other = create_user(
        db_session,
        email="peer@up.edu.ph",
        full_name="Peer Member",
        role_names=["MEMBER"],
        membership_status="RENEWED",
    )
    _enrich_profile(
        db_session,
        other,
        student_number="202012345",
        contact_number="09171234567",
    )

    login_flow(client, email="renewals.admin@up.edu.ph")
    response = client.get("/api/v1/members", headers=json_headers())
    assert response.status_code == 200
    item = next(row for row in response.json()["items"] if row["full_name"] == "Peer Member")
    assert item["student_number"] == "202012345"
    assert item["contact_number"] == "09171234567"


def test_members_me_returns_own_restricted_fields(client, capturing_email_sender, db_session):
    user = create_user(
        db_session,
        email="renewed.member@up.edu.ph",
        full_name="Lebron James",
        role_names=["MEMBER"],
        membership_status="RENEWED",
    )
    _enrich_profile(
        db_session,
        user,
        student_number="202099999",
        contact_number="09179999999",
    )

    login_flow(client, email="renewed.member@up.edu.ph")
    response = client.get("/api/v1/members/me", headers=json_headers())
    assert response.status_code == 200
    body = response.json()
    assert body["email"] == "renewed.member@up.edu.ph"
    assert body["student_number"] == "202099999"
    assert body["contact_number"] == "09179999999"


def test_membership_me_returns_current_status(client, capturing_email_sender, db_session):
    create_user(
        db_session,
        email="notrenewed.member@up.edu.ph",
        full_name="Stephen curry",
        role_names=["MEMBER"],
        membership_status="NOT_RENEWED",
    )

    login_flow(client, email="notrenewed.member@up.edu.ph")
    response = client.get("/api/v1/membership/me", headers=json_headers())
    assert response.status_code == 200
    body = response.json()
    assert body["membership_status"] == "NOT_RENEWED"
    assert body["needs_renewal"] is True


def test_unauthenticated_directory_blocked(client):
    response = client.get("/api/v1/members")
    assert response.status_code == 401
