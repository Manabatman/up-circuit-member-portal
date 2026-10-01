"""Calendar event API tests."""

from tests.auth_helpers import create_user, json_headers, login_flow


def test_member_lists_events_with_time_and_location(client, capturing_email_sender, db_session):
    create_user(
        db_session,
        email="renewed.member@up.edu.ph",
        full_name="Test Member",
        role_names=["MEMBER"],
        membership_status="RENEWED",
    )
    create_user(
        db_session,
        email="super.admin@up.edu.ph",
        full_name="Super Admin",
        role_names=["SUPER_ADMIN"],
        membership_status="RENEWED",
    )

    login_flow(client, email="super.admin@up.edu.ph")
    create_resp = client.post(
        "/api/v1/events",
        json={
            "title": "Member Assembly",
            "category": "ORGANIZATION",
            "starts_on": "2026-10-08",
            "start_time": "18:00:00",
            "location": "EEEI Room 120",
        },
        headers=json_headers(),
    )
    assert create_resp.status_code == 201, create_resp.text
    body = create_resp.json()
    assert body["start_time"] == "18:00:00"
    assert body["location"] == "EEEI Room 120"

    login_flow(client, email="renewed.member@up.edu.ph")
    list_resp = client.get("/api/v1/events", headers=json_headers())
    assert list_resp.status_code == 200
    items = list_resp.json()["items"]
    assert any(item["title"] == "Member Assembly" for item in items)


def test_create_event_rejects_inverted_single_day_times(client, capturing_email_sender, db_session):
    create_user(
        db_session,
        email="super.admin@up.edu.ph",
        full_name="Super Admin",
        role_names=["SUPER_ADMIN"],
        membership_status="RENEWED",
    )
    login_flow(client, email="super.admin@up.edu.ph")
    response = client.post(
        "/api/v1/events",
        json={
            "title": "Bad Times",
            "category": "ACADEMIC",
            "starts_on": "2026-10-10",
            "start_time": "18:00:00",
            "end_time": "09:00:00",
        },
        headers=json_headers(),
    )
    assert response.status_code == 422
