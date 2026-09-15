"""Local login diagnostics — run: cd backend && python scripts/diagnose_login.py"""
from __future__ import annotations

import json
import os
import sys
from pathlib import Path

import httpx
from sqlalchemy import create_engine, func, select
from sqlalchemy.orm import Session

BACKEND = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND))


def load_env_force(path: Path) -> None:
    for line in path.read_text(encoding="utf-8-sig").splitlines():
        s = line.strip()
        if not s or s.startswith("#") or "=" not in s:
            continue
        k, _, v = s.partition("=")
        os.environ[k.strip()] = v.strip()


def main() -> None:
    env_path = BACKEND / ".env"
    load_env_force(env_path)

    pwd = os.environ.get("DEV_SEED_PASSWORD", "")
    print(f"DEV_SEED_PASSWORD present: {bool(pwd)}, length: {len(pwd)}")

    from app.auth.passwords import verify_password
    from app.auth.origins import frontend_origins, origin_allowed
    from app.config import settings
    from app.models.user import User

    print(f"APP_ENV: {settings.app_env}")
    print(f"FRONTEND_ORIGIN (settings): {settings.frontend_origin}")
    print(f"Allowed origins: {frontend_origins()}")
    print(f"Origin localhost:5173 allowed: {origin_allowed('http://localhost:5173')}")

    engine = create_engine(settings.sqlalchemy_database_url())
    with Session(engine) as db:
        user = db.scalar(
            select(User).where(func.lower(User.email) == "renewed.member@up.edu.ph")
        )
        if user is None:
            print("USER: NOT FOUND")
        else:
            match = bool(user.password_hash and verify_password(pwd, user.password_hash))
            print(f"USER: exists, active={user.is_active}, locked={user.locked_until}")
            print(f"PASSWORD_HASH_MATCHES_DEV_SEED: {match}")

    # CORS preflight (browser-like)
    preflight = httpx.options(
        "http://127.0.0.1:8000/api/v1/auth/login",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type",
        },
    )
    print(f"OPTIONS preflight: {preflight.status_code}")
    print(f"  ACAO: {preflight.headers.get('access-control-allow-origin')}")
    print(f"  ACAC: {preflight.headers.get('access-control-allow-credentials')}")

    # Login POST (browser-like)
    login = httpx.post(
        "http://127.0.0.1:8000/api/v1/auth/login",
        json={"email": "renewed.member@up.edu.ph", "password": pwd},
        headers={"Origin": "http://localhost:5173", "Content-Type": "application/json"},
    )
    print(f"POST /auth/login: {login.status_code}")
    print(f"  body: {login.text[:200]}")

    # Also test localhost:8000 vs 127.0.0.1:8000 URL (frontend uses localhost:8000)
    login2 = httpx.post(
        "http://localhost:8000/api/v1/auth/login",
        json={"email": "renewed.member@up.edu.ph", "password": pwd},
        headers={"Origin": "http://localhost:5173", "Content-Type": "application/json"},
    )
    print(f"POST via localhost:8000: {login2.status_code}")


if __name__ == "__main__":
    main()
