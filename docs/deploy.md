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
| `DATABASE_URL` | App role, session pooler |
| `MIGRATOR_DATABASE_URL` | Migrator role, for Alembic |
| `FRONTEND_ORIGIN` | Exact Vercel URL (CORS and CSRF), e.g. `https://portal.example.org` |
| `BREVO_API_KEY` | Required when `APP_ENV` is not `local` (login emails) |
| `EMAIL_FROM` | Sender address for OTP emails |
| `MAINTENANCE_TOKEN` | Optional; only if cleanup jobs are enabled later |
| `LOGIN_OTP_REQUIRED` | Set `false` for beta password-only login without Brevo; `true` when OTP email is configured |
| `SESSION_COOKIE_SAMESITE` | Optional override: `none` for Vercel + Render cross-site cookies (default `none` when `APP_ENV` is not `local`) |

### Frontend (Vercel)

| Variable | Purpose |
|----------|---------|
| `VITE_API_BASE_URL` | Render API base URL |

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

---

## 7. Verify after deploy

Checklist:

1. **Health:** `GET /api/v1/health` returns `{"status":"ok"}`.
2. **Login:** password + OTP email (not console-only in production).
3. **Session:** `/api/v1/auth/me` after login; cookie on the frontend origin.
4. **Authorization:** renewed member sees Academic Drive; not-renewed member does not; officer admin tools still work where expected.
5. **Core flows:** Resources, divisions, directory, feedback submit, logout.
6. **Frontend → backend → database:** create a test resource as an admin; member sees it.

---

## Render checklist (copy/paste)

| Setting | Value |
|---------|--------|
| Root directory | `backend/` |
| Build command | `pip install -r requirements.txt` |
| Pre-deploy | `alembic upgrade head` |
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
