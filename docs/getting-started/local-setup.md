# Local Setup (Tutorial)

Get the UP Circuit Member Portal running on your laptop for the first time.

**Status:** MVP milestones M0–M7 are implemented (through Real Circuit Member Home: renewals page, verified content seed, dashboard home).

More detail on architecture (optional): [How it works](../how-it-works.md).

---

## Prerequisites

Install before cloning:

| Tool | Version |
|---|---|
| Git | Latest |
| Python | 3.12+ |
| Node.js | 20 LTS+ |
| PostgreSQL | 15+ (local install — Docker not required) |

Verify in PowerShell:

```powershell
git --version
python --version
node --version
psql --version
```

---

## 1. Configure environment files

```powershell
Copy-Item backend\.env.example backend\.env
Copy-Item frontend\.env.example frontend\.env
```

Edit `backend/.env`: replace `PASSWORD` with the local role passwords you set in the next step. Never commit `.env`. Never put real passwords in `.env.example`.

---

## 2. Database

Edit password placeholders in [`scripts/bootstrap_postgres.sql`](../../scripts/bootstrap_postgres.sql), then:

```powershell
psql -U postgres -f scripts/bootstrap_postgres.sql
```

On Windows, if `psql` is not on PATH, use the installer location (example):

```powershell
& "C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -f scripts/bootstrap_postgres.sql
```

This creates `upcircuit_local`, `upcircuit_test`, and roles `circuit_app` / `circuit_migrator`.

If you created the databases and roles by hand, still apply the bootstrap `GRANT` lines as the Postgres superuser: `CONNECT` on both databases for both roles, and `CREATE` on both databases for `circuit_migrator` only. Without `CREATE`, Alembic cannot create schema `app`.

From `backend/` with the venv active (step 3):

```powershell
alembic upgrade head
```

Alembic uses `MIGRATOR_DATABASE_URL`. Running it as `circuit_app` fails by design.

Seed demo users (local only — requires `DEV_SEED_PASSWORD` in `backend/.env`, at least 12 characters; **not** in `.env.example`):

```powershell
python scripts/seed_m1_users.py
```

Demo emails (password = `DEV_SEED_PASSWORD` in gitignored `backend/.env`, at least 12 characters):

| Email | What to test |
|-------|----------------|
| `renewed.member@up.edu.ph` | Renewed member; Academic Drive; Academic Affairs (directory) |
| `notrenewed.member@up.edu.ph` | Not renewed; blocked from Academic Drive; External Affairs (directory) |
| `academic.admin@up.edu.ph` | Academic admin tools; not renewed; Finance (directory) |
| `renewals.admin@up.edu.ph` | Membership status admin; Internal Affairs (directory) |
| `super.admin@up.edu.ph` | Super admin; Publicity (directory) |

Re-run `python scripts/seed_m1_users.py` after migrations to refresh division assignments. The seed script refuses to run when `APP_ENV=production`.

After seeding users, seed **verified** Circuit content (real URLs only):

```powershell
python scripts/seed_verified_content.py
```

Optional fake demo resources (local UI experiments only — not for officer demos):

```powershell
python scripts/seed_demo_content.py
```

`start-local.bat` runs migrations and user seed only; it does **not** auto-run demo content.

---

## Every time you run the app

**Easiest (Windows):** from the repo root, double-click or run:

```powershell
.\start-local.bat
```

This starts backend (8000) and frontend (5173) in two windows, syncs demo users from `DEV_SEED_PASSWORD`, frees those ports first, checks `.env` alignment, and opens the browser. To stop: close both windows or run `.\stop-local.bat`.

### Login and OTP (M1)

1. Open **http://localhost:5173/login** (use `localhost`, not `127.0.0.1` — both work, but stay consistent with `FRONTEND_ORIGIN`).
2. Enter a demo email and the password from **`DEV_SEED_PASSWORD`** in `backend/.env` (never committed).
3. Click **Continue**. If the password is wrong, the form shows **Invalid credentials** and **no OTP is sent** — re-run `python ..\scripts\seed_m1_users.py` from `backend/` after changing `DEV_SEED_PASSWORD`.
4. On success, the **Backend** window (uvicorn) prints a line like `[OTP] login code for ...: 123456` and the browser shows the OTP field. That window is a **server log** — you do not type commands into it.
5. Enter the 6-digit code in the **browser**, then you should reach `/dashboard`.

If the browser shows **Failed to fetch**, the request never reached the API — check that both servers are running and that `VITE_API_BASE_URL=http://localhost:8000` in `frontend/.env` (restart `npm run dev` after editing).

**Manual (two terminals):**


**Session cookie:** The API sets an HttpOnly `session` cookie. JavaScript cannot read it; the browser sends it automatically on credentialed requests (`credentials: "include"`). The backend stores only a SHA-256 hash of the token.

### Manual terminals (alternative)

**Terminal 1 — backend:**

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --port 8000
```

- `GET http://localhost:8000/api/v1/health` → `{ "status": "ok" }`
- Auth endpoints under `/api/v1/auth/*` (login sends OTP to the **uvicorn console** when `APP_ENV=local`)
- OpenAPI: `http://localhost:8000/api/docs`

**Terminal 2 — frontend:**

```powershell
cd frontend
npm run dev
```

Open `http://localhost:5173`. Unauthenticated visits redirect to `/login`. After password + OTP, the dashboard shows your name, membership status, and current academic year.

---

## 5. Tests

```powershell
# backend, venv active
pytest

# frontend
npm test
```

pytest uses `upcircuit_test` (same roles, different database). It does not use SQLite.

---

## Local-only exceptions

These relaxations apply **only** when `APP_ENV=local`:

| Setting | Local | Production |
|---|---|---|
| Cookie `Secure` | `false` (M1) | `true` |
| OTP delivery | Console (M1) | Brevo |
| TLS | Not required | Required |

Never copy local cookie settings to deployed environments.

---

## Common problems

See [`troubleshooting.md`](../maintenance/troubleshooting.md) and Section 11 failure table.

---

## Next steps

- [Project structure](project-structure.md) — frontend, backend, database
- [Where do I edit?](../guides/where-to-edit.md) — which file to open
- [Common tasks](common-tasks.md) — run the app after a change, run tests
- Run tests: [`maintenance/commands.md`](../maintenance/commands.md)
- Add a feature: [`add-a-feature.md`](add-a-feature.md)
- What shipped: [`CHANGELOG.md`](../CHANGELOG.md) — M0–M7 are in the repo; next major slice after M7 is Events/flagships (later)
