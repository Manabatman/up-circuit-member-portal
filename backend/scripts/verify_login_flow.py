"""Full local login flow: login -> OTP in console -> verify -> session -> /me."""
from __future__ import annotations

import os
import re
import socket
import subprocess
import sys
import threading
import time
from pathlib import Path

import httpx

BACKEND = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND))


def _read_env(path: Path) -> dict[str, str]:
    out: dict[str, str] = {}
    for line in path.read_text(encoding="utf-8-sig").splitlines():
        s = line.strip()
        if not s or s.startswith("#") or "=" not in s:
            continue
        k, _, v = s.partition("=")
        out[k.strip()] = v.strip()
    return out


def _free_port() -> int:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.bind(("127.0.0.1", 0))
        return sock.getsockname()[1]


def main() -> None:
    env_vars = _read_env(BACKEND / ".env")
    password = env_vars.get("DEV_SEED_PASSWORD", "")
    if len(password) < 12:
        raise SystemExit("DEV_SEED_PASSWORD missing or too short in backend/.env")

    port = _free_port()
    base_url = f"http://127.0.0.1:{port}"
    run_env = {**os.environ, **env_vars, "PYTHONUNBUFFERED": "1"}
    log_lines: list[str] = []

    proc = subprocess.Popen(
        [
            sys.executable,
            "-m",
            "uvicorn",
            "app.main:app",
            "--host",
            "127.0.0.1",
            "--port",
            str(port),
            "--log-level",
            "info",
        ],
        cwd=str(BACKEND),
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        env=run_env,
    )

    def _collect_output() -> None:
        assert proc.stdout is not None
        for line in proc.stdout:
            log_lines.append(line)

    reader = threading.Thread(target=_collect_output, daemon=True)
    reader.start()
    headers = {"Origin": "http://localhost:5173", "Content-Type": "application/json"}

    try:
        for _ in range(30):
            if proc.poll() is not None:
                raise SystemExit(
                    f"Backend exited before startup:\n{''.join(log_lines)}"
                )
            try:
                if httpx.get(f"{base_url}/api/v1/health", timeout=1).status_code == 200:
                    break
            except httpx.HTTPError:
                pass
            time.sleep(0.5)
        else:
            raise SystemExit(f"Backend failed to start on {port}")

        login = httpx.post(
            f"{base_url}/api/v1/auth/login",
            json={"email": "renewed.member@up.edu.ph", "password": password},
            headers=headers,
        )
        print(f"POST /auth/login -> {login.status_code} {login.text}")
        assert login.status_code == 200, login.text

        code = None
        for _ in range(40):
            joined = "".join(log_lines)
            match = re.search(r"\[OTP\] login code for [^:]+: (\d{6})", joined)
            if match:
                code = match.group(1)
                break
            time.sleep(0.25)
        print(f"OTP in console -> {'YES' if code else 'NO'}")
        if code is None:
            raise SystemExit(
                "OTP not found in uvicorn console output:\n" + "".join(log_lines[-20:])
            )

        verify = httpx.post(
            f"{base_url}/api/v1/auth/verify-code",
            json={"email": "renewed.member@up.edu.ph", "code": code},
            headers=headers,
        )
        print(f"POST /verify-code -> {verify.status_code}")
        assert verify.status_code == 200

        client = httpx.Client(
            cookies=verify.cookies,
            headers={"Origin": "http://localhost:5173"},
            base_url=base_url,
        )
        me = client.get("/api/v1/auth/me")
        print(f"GET /auth/me -> {me.status_code}")
        assert me.status_code == 200
        body = me.json()
        assert body["email"] == "renewed.member@up.edu.ph"
        assert "student_number" not in body
        print("Full flow OK")
    finally:
        if proc.poll() is None:
            proc.terminate()
            proc.wait(timeout=5)


if __name__ == "__main__":
    main()
