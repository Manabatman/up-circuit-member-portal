# Sprint 1 runtime notes

Verified against the repository after Sprint 1 engineering work. This document names environment variables only; never commit secrets.

## Request path

1. Browser → Vercel (static React app, `VITE_API_BASE_URL` points at Render API).
2. Render FastAPI → Supabase Postgres via SQLAlchemy (`DATABASE_URL`, role `circuit_app`).
3. Alembic pre-deploy on Render uses `MIGRATOR_DATABASE_URL` (`circuit_migrator`).

Health: `GET /api/v1/health/ready` checks database connectivity.

## Migrations

- Apply with `alembic upgrade head` only on databases you own (local, CI, approved production window).
- Production head is `0007_event_time_location`; do not re-run 0007 as a “fix.”
- **Downgrade warning:** revision `0001` downgrade drops schema `app`. Treat downgrades as destructive, not rollback.

## Backups

- Supabase project **up-circuit-member-portal** (Free): **no automated backups** on the current plan.
- A Render uptime ping to `/health/ready` is **not** a database backup.
- Do not run `pg_dump` to git or public storage without an approved private destination and retention policy.

## Connection pool (Render)

- Documented production target: **session pooler, port 5432** (see [deploy.md](../deploy.md)).
- SQLAlchemy uses `pool_pre_ping`, `pool_recycle=300`, and a small pool in `backend/app/db/session.py`.
- **Unverified:** whether live Render `DATABASE_URL` uses port 5432 or transaction pooler 6543. Confirm in the Render dashboard (host/port only). Do not add `prepare_threshold=None` unless 6543 is confirmed.

## CI

- GitHub Actions workflow `.github/workflows/ci.yml`: backend pytest + `pip-audit`, frontend `npm test` + `npm run build` + `npm audit`, Postgres 17 service, `alembic upgrade head` on empty DB.
