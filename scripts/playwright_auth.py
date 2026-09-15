#!/usr/bin/env python3
"""Issue a browser session cookie for Playwright visual QA (local only).

Uses in-process TestClient against the same database as the running API.
The cookie is valid for requests to localhost:8000 from the Vite dev server.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
BACKEND = REPO_ROOT / "backend"
sys.path.insert(0, str(BACKEND))

from fastapi.testclient import TestClient  # noqa: E402

from app.email.sender import CapturingEmailSender, get_email_sender  # noqa: E402
from app.main import app  # noqa: E402
from tests.auth_helpers import login_flow  # noqa: E402

app.dependency_overrides[get_email_sender] = lambda: CapturingEmailSender()


def _read_dev_password() -> str:
    env_path = BACKEND / ".env"
    for line in env_path.read_text(encoding="utf-8-sig").splitlines():
        stripped = line.strip()
        if stripped.startswith("DEV_SEED_PASSWORD="):
            return stripped.split("=", 1)[1]
    raise SystemExit("DEV_SEED_PASSWORD not found in backend/.env")


def main() -> None:
    if len(sys.argv) < 2:
        raise SystemExit("Usage: playwright_auth.py <email>")

    email = sys.argv[1].strip().lower()
    password = _read_dev_password()
    CapturingEmailSender.last_code = None

    client = TestClient(app)
    login_flow(client, email=email, password=password)

    session = client.cookies.get("session")
    if not session:
        raise SystemExit("No session cookie after login flow")

    print(
        json.dumps(
            {
                "email": email,
                "cookie_name": "session",
                "cookie_value": session,
                "origin": "http://localhost:5173",
                "api_base": "http://localhost:8000",
            }
        )
    )


if __name__ == "__main__":
    main()
