#!/usr/bin/env python3
"""Verify the MVP demo flow via HTTP (session cookie, same as browser)."""

from __future__ import annotations

import os
import sys
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
BACKEND_ROOT = SCRIPT_DIR.parent
sys.path.insert(0, str(BACKEND_ROOT))


def _read_env_file(path: Path) -> dict[str, str]:
    if not path.exists():
        return {}
    values: dict[str, str] = {}
    for line in path.read_text(encoding="utf-8-sig").splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("#") or "=" not in stripped:
            continue
        key, _, value = stripped.partition("=")
        values[key.strip()] = value.strip()
    return values


def main() -> None:
    file_env = _read_env_file(BACKEND_ROOT / ".env")
    for key, value in file_env.items():
        os.environ[key] = value

    password = file_env.get("DEV_SEED_PASSWORD", "")
    if len(password) < 12:
        raise SystemExit("DEV_SEED_PASSWORD missing from backend/.env")

    from fastapi.testclient import TestClient

    from app.email.sender import CapturingEmailSender, get_email_sender
    from app.main import app

    origin = file_env.get("FRONTEND_ORIGIN", "http://localhost:5173").rstrip("/")
    headers = {"Origin": origin, "Content-Type": "application/json"}
    sender = CapturingEmailSender()
    app.dependency_overrides[get_email_sender] = lambda: sender

    with TestClient(app) as client:
        def login(email: str) -> None:
            r = client.post(
                "/api/v1/auth/login",
                json={"email": email, "password": password},
                headers=headers,
            )
            assert r.status_code == 200, r.text
            code = sender.last_code
            assert code is not None
            v = client.post(
                "/api/v1/auth/verify-code",
                json={"email": email, "code": code},
                headers=headers,
            )
            assert v.status_code == 200, v.text

        login("notrenewed.member@up.edu.ph")
        me = client.get("/api/v1/auth/me", headers=headers)
        assert me.status_code == 200
        assert me.json()["membership_status"] == "NOT_RENEWED"
        assert "academic_drive" not in me.json()["route_keys"]

        blocked = client.get("/api/v1/resources?scope=academic", headers=headers)
        assert blocked.status_code == 403
        assert blocked.json()["error"]["code"] == "MEMBERSHIP_REQUIRED"

        client.post("/api/v1/auth/logout", headers=headers)
        login("renewals.admin@up.edu.ph")
        members = client.get("/api/v1/members?q=Blair", headers=headers)
        assert members.status_code == 200
        blair = next(
            row for row in members.json()["items"] if row["full_name"] == "Stephen curry"
        )
        patch = client.patch(
            f"/api/v1/membership/{blair['user_id']}/status",
            json={
                "status": "RENEWED",
                "academic_year": "2026-2027",
                "reason": "MVP demo renewal",
                "confirm_full_name": "Stephen curry",
            },
            headers=headers,
        )
        assert patch.status_code == 200, patch.text

        client.post("/api/v1/auth/logout", headers=headers)
        login("notrenewed.member@up.edu.ph")
        allowed = client.get("/api/v1/resources?scope=academic", headers=headers)
        assert allowed.status_code == 200, allowed.text
        old_url = allowed.json()["items"][0]["url"]

        client.post("/api/v1/auth/logout", headers=headers)
        login("academic.admin@up.edu.ph")
        resource_id = allowed.json()["items"][0]["id"]
        new_url = "https://drive.google.com/file/d/demo-updated-url/view"
        updated = client.patch(
            f"/api/v1/resources/{resource_id}",
            json={"url": new_url},
            headers=headers,
        )
        assert updated.status_code == 200, updated.text

        client.post("/api/v1/auth/logout", headers=headers)
        login("notrenewed.member@up.edu.ph")
        refreshed = client.get("/api/v1/resources?scope=academic", headers=headers)
        assert refreshed.status_code == 200
        assert refreshed.json()["items"][0]["url"] == new_url
        assert refreshed.json()["items"][0]["url"] != old_url

        directory = client.get("/api/v1/members", headers=headers)
        assert directory.status_code == 200
        sample = directory.json()["items"][0]
        assert "student_number" not in sample
        assert "contact_number" not in sample

        account = client.get("/api/v1/members/me", headers=headers)
        assert account.status_code == 200
        assert account.json()["email"] == "notrenewed.member@up.edu.ph"

        logout = client.post("/api/v1/auth/logout", headers=headers)
        assert logout.status_code in {200, 204}

    print("MVP demo flow verified successfully.")


if __name__ == "__main__":
    main()
