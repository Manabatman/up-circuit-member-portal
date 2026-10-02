# Deploying the portal (first beta)

This guide is for bringing the portal to **Vercel (frontend)**, **Render (backend)**, and **Supabase (PostgreSQL)**. It does not perform deployment for you — follow these steps when Circuit is ready.

**Prerequisites:** Supabase and Render accounts, Vercel account, domain decisions, and Brevo (or another provider) for login emails in non-local environments.

---

## 1. Create the Supabase database

1. Create a Supabase project (Singapore region is recommended for latency to the Philippines).
2. Turn **off** the Data API (Integrations → Data API → disabled).
3. Run [scripts/supabase_production_bootstrap.sql](../scripts/supabase_production_bootstrap.sql) in the SQL editor to create `circuit_migrator` and `circuit_app` roles (replace placeholder passwords).
4. Note connection strings for the **session pooler** on port **5432** (Render is IPv4-only).

---

## 2. Configure Render (backend)

1. New **Web Service** from this repository; root directory **`backend/`**.
2. Build: install from `requirements.txt`.
3. **Pre-deploy command:** `alembic upgrade head` (uses `MIGRATOR_DATABASE_URL`).
4. **Start command:** run Uvicorn on the app (see `render.yaml` or team notes).
5. Set environment variables (see below). `APP_ENV` should be `dev` or `production`, not `local`.

---

## 3. Configure Vercel (frontend)

1. Import the repo; root directory **`frontend/`**.
2. Build command: `npm run build`; output **`dist/`**.
3. Set **`VITE_API_BASE_URL`** to the public Render API URL (no trailing path beyond the host, e.g. `https://your-api.onrender.com`).

---

## 4. Required environment variables

### Backend (`backend/.env` in production — set in Render dashboard)

| Variable | Purpose |
|----------|---------|
| `APP_ENV` | `dev` or `production` (not `local`) |
| `DATABASE_URL` | **Runtime only:** PostgreSQL user **`circuit_app`**, Supabase **session pooler** (port **5432**). Use the pooler host ending in `.supabase.com` and the tenant username form `circuit_app.<project-ref>` if shown in Supabase. |
| `MIGRATOR_DATABASE_URL` | **Alembic pre-deploy only:** user **`circuit_migrator`**, same pooler host/port/database. Do **not** swap these two URLs. |
| `PYTHON_VERSION` | `3.12.8` (Render reads `backend/.python-version` or this env var; `runtime.txt` alone is not enough) |
| `FRONTEND_ORIGIN` | **Required.** Exact Vercel URL (no trailing slash), e.g. `https://up-circuit-member-portal.vercel.app` — app will not start without this |
| `BREVO_API_KEY` | Required when `APP_ENV` is not `local` (login emails) |
| `EMAIL_FROM` | Sender address for OTP emails |
| `MAINTENANCE_TOKEN` | Optional; only if cleanup jobs are enabled later |
| `LOGIN_OTP_REQUIRED` | Set `false` for beta password-only login without Brevo; `true` when OTP email is configured |
| `SESSION_COOKIE_SAMESITE` | Optional override: `none` for Vercel + Render cross-site cookies (default `none` when `APP_ENV` is not `local`) |

### Frontend (Vercel)

| Variable | Purpose |
|----------|---------|
| `VITE_API_BASE_URL` | Render API base URL, e.g. `https://your-service.onrender.com` — **no** `/api/v1`, **no** trailing slash. Use Vercel type **Config** (not Secret); it is public in the built JS. Rebuild after changes. |

**Never** put database passwords or API secrets in Vite variables.

Local-only (not on Render/Vercel): `DEV_SEED_PASSWORD` in gitignored `backend/.env` for seed scripts.

---

## 5. Run migrations

On Render, migrations run in the pre-deploy step. Locally, from `backend/`:

```bash
alembic upgrade head
```

---

## 6. Seed data (non-production only)

Demo users and placeholder links are for **local and dev** testing.

- Run `scripts/seed_m1_users.py` only when `APP_ENV` is `local` or `dev`.
- Run `scripts/seed_verified_content.py` and `scripts/seed_beta_content.py` on dev after migrations.
- The seed script **refuses** to run when `APP_ENV=production`.
- Do not import real member rosters until leadership approves and backups are verified.

### Production admin bootstrap

After migrations on production, create the first super admin (does **not** use demo passwords):

```bash
cd backend
ADMIN_EMAIL=officer@up.edu.ph ADMIN_PASSWORD='your-secure-password' ADMIN_FULL_NAME='Officer Name' python ../scripts/create_admin.py
```

Document test accounts in [Local setup](getting-started/local-setup.md).

**Alternative (no local psycopg):** register on the deployed site, then in Supabase SQL Editor promote that email to super admin (replace the email literal only):

```sql
-- Run as postgres after the user has registered once on production.
INSERT INTO app.user_roles (user_id, role_id, assigned_at)
SELECT u.id, r.id, now()
FROM app.users u, app.roles r
WHERE lower(u.email) = lower('officer@up.edu.ph') AND r.name = 'SUPER_ADMIN'
ON CONFLICT DO NOTHING;

UPDATE app.membership_terms mt
SET status = 'RENEWED', renewed_at = now(), updated_at = now()
FROM app.users u, app.academic_years ay
WHERE mt.user_id = u.id AND mt.academic_year_id = ay.id
  AND ay.is_current = true AND lower(u.email) = lower('officer@up.edu.ph');
```

Then sign in on Vercel and use **Admin → Members** to approve other pending members.

---

## 7. Verify after deploy

Checklist:

1. **Liveness:** `GET /api/v1/health` returns `{"status":"ok"}` (no DB check).
2. **Readiness:** `GET /api/v1/health/ready` returns `{"status":"ok","database":"ok"}` when `DATABASE_URL` works; `503` with `"database":"unavailable"` when Postgres is unreachable.
3. **CORS:** `GET /api/v1/auth/me` without a cookie returns `401` and includes `access-control-allow-origin` matching `FRONTEND_ORIGIN`.
4. **Register / login:** create an `@up.edu.ph` account (password ≥ 12 chars), then sign in (`LOGIN_OTP_REQUIRED=false` skips email OTP).
5. **Session:** `/api/v1/auth/me` after login; cookie on the frontend origin.
6. **Authorization:** renewed member sees Academic Drive; pending members do not; officer admin tools work for admins.
7. **Core flows:** Resources, divisions, directory, feedback submit, logout.
8. **Frontend → backend → database:** create a test resource as an admin; member sees it.

---

## Render checklist (copy/paste)

| Setting | Value |
|---------|--------|
| Root directory | `backend/` |
| Build command | `pip install -r requirements.txt` |
| Pre-deploy command | `alembic upgrade head` (must be set; not optional) |
| Python version | Set `PYTHON_VERSION=3.12.8` or use committed `backend/.python-version` |
| Start command | `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |
| Health check path | `/api/v1/health` |

## Vercel checklist

| Setting | Value |
|---------|--------|
| Root directory | `frontend/` |
| Build command | `npm run build` |
| Output directory | `dist` |
| Env | `VITE_API_BASE_URL=https://your-api.onrender.com` |

## 8. What we are not deploying in this beta slice

No Redis, no Supabase Auth, no notification system, no native request workflows.

---

## Related

- [How it works](how-it-works.md)
- [Local setup](getting-started/local-setup.md)
- [Operations handover](operations/handover.md) (credentials and service ownership)
