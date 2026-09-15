"""Security-boundary tests for M1 authentication."""

from app.email.sender import CapturingEmailSender
from tests.auth_helpers import (
    TEST_PASSWORD,
    create_user,
    json_headers,
    login_flow,
)


def test_login_unknown_email_returns_generic_401(
    client, capturing_email_sender, db_session
):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "missing@up.edu.ph", "password": TEST_PASSWORD},
        headers=json_headers(),
    )
    assert response.status_code == 401
    assert response.json()["error"]["message"] == "Invalid credentials."
    assert CapturingEmailSender.last_code is None


def test_login_wrong_password_returns_generic_401(
    client, capturing_email_sender, db_session
):
    create_user(
        db_session,
        email="renewed.member@up.edu.ph",
        full_name="Lebron James",
        role_names=["MEMBER"],
        membership_status="RENEWED",
    )
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "renewed.member@up.edu.ph", "password": "wrong-password-12"},
        headers=json_headers(),
    )
    assert response.status_code == 401
    assert response.json()["error"]["message"] == "Invalid credentials."
    assert CapturingEmailSender.last_code is None


def test_login_success_generates_otp_without_session(
    client, capturing_email_sender, db_session
):
    create_user(
        db_session,
        email="renewed.member@up.edu.ph",
        full_name="Lebron James",
        role_names=["MEMBER"],
        membership_status="RENEWED",
    )
    CapturingEmailSender.last_code = None
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "renewed.member@up.edu.ph", "password": TEST_PASSWORD},
        headers=json_headers(),
    )
    assert response.status_code == 200
    assert response.json() == {"verification_required": True}
    assert CapturingEmailSender.last_code is not None
    assert len(CapturingEmailSender.last_code) == 6
    assert CapturingEmailSender.last_code.isdigit()
    assert client.get("/api/v1/auth/me").status_code == 401


def test_login_accepts_127_origin_alias(client, capturing_email_sender, db_session):
    create_user(
        db_session,
        email="renewed.member@up.edu.ph",
        full_name="Lebron James",
        role_names=["MEMBER"],
    )
    headers = json_headers()
    headers["Origin"] = "http://127.0.0.1:5173"
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "renewed.member@up.edu.ph", "password": TEST_PASSWORD},
        headers=headers,
    )
    assert response.status_code == 200
    assert CapturingEmailSender.last_code is not None


def test_login_otp_and_me(client, capturing_email_sender, db_session):
    create_user(
        db_session,
        email="renewed.member@up.edu.ph",
        full_name="Lebron James",
        role_names=["MEMBER"],
        membership_status="RENEWED",
    )
    login_flow(client, email="renewed.member@up.edu.ph")

    me = client.get("/api/v1/auth/me")
    assert me.status_code == 200
    body = me.json()
    assert body["email"] == "renewed.member@up.edu.ph"
    assert body["full_name"] == "Lebron James"
    assert body["membership_status"] == "RENEWED"
    assert "view_dashboard" in body["permissions"]
    assert "student_number" not in body
    assert "contact_number" not in body


def test_wrong_otp_returns_401(client, capturing_email_sender, db_session):
    create_user(
        db_session,
        email="renewed.member@up.edu.ph",
        full_name="Lebron James",
        role_names=["MEMBER"],
    )
    client.post(
        "/api/v1/auth/login",
        json={"email": "renewed.member@up.edu.ph", "password": TEST_PASSWORD},
        headers=json_headers(),
    )
    response = client.post(
        "/api/v1/auth/verify-code",
        json={"email": "renewed.member@up.edu.ph", "code": "000000"},
        headers=json_headers(),
    )
    assert response.status_code == 401
    assert client.get("/api/v1/auth/me").status_code == 401


def test_five_bad_otps_invalidate_token(client, capturing_email_sender, db_session):
    create_user(
        db_session,
        email="renewed.member@up.edu.ph",
        full_name="Lebron James",
        role_names=["MEMBER"],
    )
    client.post(
        "/api/v1/auth/login",
        json={"email": "renewed.member@up.edu.ph", "password": TEST_PASSWORD},
        headers=json_headers(),
    )
    for _ in range(5):
        client.post(
            "/api/v1/auth/verify-code",
            json={"email": "renewed.member@up.edu.ph", "code": "000000"},
            headers=json_headers(),
        )
    response = client.post(
        "/api/v1/auth/verify-code",
        json={
            "email": "renewed.member@up.edu.ph",
            "code": CapturingEmailSender.last_code,
        },
        headers=json_headers(),
    )
    assert response.status_code == 401


def test_expired_otp_returns_401(client, capturing_email_sender, db_session):
    from datetime import timedelta

    from app.auth.tokens import utcnow
    from app.models.auth_token import AuthToken

    user = create_user(
        db_session,
        email="renewed.member@up.edu.ph",
        full_name="Lebron James",
        role_names=["MEMBER"],
    )
    client.post(
        "/api/v1/auth/login",
        json={"email": "renewed.member@up.edu.ph", "password": TEST_PASSWORD},
        headers=json_headers(),
    )
    token_row = db_session.query(AuthToken).filter_by(user_id=user.id).one()
    token_row.expires_at = utcnow() - timedelta(minutes=1)
    db_session.commit()

    response = client.post(
        "/api/v1/auth/verify-code",
        json={
            "email": "renewed.member@up.edu.ph",
            "code": CapturingEmailSender.last_code,
        },
        headers=json_headers(),
    )
    assert response.status_code == 401
    assert client.get("/api/v1/auth/me").status_code == 401


def test_logout_clears_session(client, capturing_email_sender, db_session):
    create_user(
        db_session,
        email="renewed.member@up.edu.ph",
        full_name="Lebron James",
        role_names=["MEMBER"],
    )
    login_flow(client, email="renewed.member@up.edu.ph")
    logout = client.post("/api/v1/auth/logout", headers=json_headers())
    assert logout.status_code == 204
    assert client.get("/api/v1/auth/me").status_code == 401


def test_academic_year_requires_session(client, db_session):
    response = client.get("/api/v1/academic-years/current")
    assert response.status_code == 401


def test_renewed_member_can_load_academic_year(
    client, capturing_email_sender, db_session
):
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
    assert response.json()["label"] == "2026-2027"


def test_login_missing_origin_forbidden(client):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "a@up.edu.ph", "password": TEST_PASSWORD},
        headers={"Content-Type": "application/json"},
    )
    assert response.status_code == 403
    assert response.json()["error"]["code"] == "FORBIDDEN"


def test_login_with_allowed_origin(client, capturing_email_sender, db_session):
    create_user(
        db_session,
        email="renewed.member@up.edu.ph",
        full_name="Lebron James",
        role_names=["MEMBER"],
    )
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "renewed.member@up.edu.ph", "password": TEST_PASSWORD},
        headers=json_headers(),
    )
    assert response.status_code == 200


def test_session_cookie_flags(client, capturing_email_sender, db_session):
    create_user(
        db_session,
        email="renewed.member@up.edu.ph",
        full_name="Lebron James",
        role_names=["MEMBER"],
    )
    login_flow(client, email="renewed.member@up.edu.ph")
    cookie_header = client.cookies.get("session")
    assert cookie_header is not None
    # TestClient stores cookie value; inspect Set-Cookie from verify response directly.
    client.post(
        "/api/v1/auth/login",
        json={"email": "renewed.member@up.edu.ph", "password": TEST_PASSWORD},
        headers=json_headers(),
    )
    verify = client.post(
        "/api/v1/auth/verify-code",
        json={
            "email": "renewed.member@up.edu.ph",
            "code": CapturingEmailSender.last_code,
        },
        headers=json_headers(),
    )
    set_cookie = verify.headers.get("set-cookie", "")
    assert "HttpOnly" in set_cookie
    assert "SameSite=lax" in set_cookie.lower() or "samesite=lax" in set_cookie.lower()
    assert "Secure" not in set_cookie
