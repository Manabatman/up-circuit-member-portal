# Command Index

Quick map to **where commands are documented in full**. This file is an index only — not a third copy of every command.

When a command stabilizes during implementation, update the **owning section** first, then add or update a link here.

See [`architecture/phase-1/14-documentation-system.md`](../architecture/phase-1/14-documentation-system.md) for documentation rules.

---

## Git and GitHub

| Task | Document |
|---|---|
| Clone, branch, commit, PR, merge | [`09-git-github-strategy.md`](../architecture/phase-1/09-git-github-strategy.md) |
| `.gitignore` and `.env.example` | [`09-git-github-strategy.md`](../architecture/phase-1/09-git-github-strategy.md) |

---

## Local development

| Task | Document |
|---|---|
| Install prerequisites (Git, Python, Node, PostgreSQL) | [`11-local-development-setup.md`](../architecture/phase-1/11-local-development-setup.md) |
| Create local database and roles | [`scripts/bootstrap_postgres.sql`](../../scripts/bootstrap_postgres.sql) + [`11-local-development-setup.md`](../architecture/phase-1/11-local-development-setup.md) |
| Python venv and backend dependencies | [`11-local-development-setup.md`](../architecture/phase-1/11-local-development-setup.md) |
| Frontend `npm install` / `npm run dev` | [`11-local-development-setup.md`](../architecture/phase-1/11-local-development-setup.md) |
| `alembic upgrade head` (local) | [`11-local-development-setup.md`](../architecture/phase-1/11-local-development-setup.md) |
| Seed M1 demo users (`python scripts/seed_m1_users.py`) | [`getting-started/local-setup.md`](../getting-started/local-setup.md) |
| Start backend (`uvicorn`) | [`11-local-development-setup.md`](../architecture/phase-1/11-local-development-setup.md) |
| Start full stack locally (`start-local.bat`) | [`getting-started/local-setup.md`](../getting-started/local-setup.md) |
| Stop local servers (`stop-local.bat`) | [`getting-started/local-setup.md`](../getting-started/local-setup.md) |
| Environment variables (`.env`) | [`10-environment-management.md`](../architecture/phase-1/10-environment-management.md) |

---

## Database and migrations

| Task | Document |
|---|---|
| Alembic workflow and roles | [`03-supabase-architecture.md`](../architecture/phase-1/03-supabase-architecture.md) |
| Expand-then-contract migrations | [`03-supabase-architecture.md`](../architecture/phase-1/03-supabase-architecture.md) |
| Pre-Deploy on Render | [`12-deployment-architecture.md`](../architecture/phase-1/12-deployment-architecture.md) |

---

## Testing

| Task | Document |
|---|---|
| Local pytest (`cd backend` then `pytest`) | [`13-testing-strategy.md`](../architecture/phase-1/13-testing-strategy.md) |
| Frontend Vitest (`cd frontend` then `npm test`) | [`13-testing-strategy.md`](../architecture/phase-1/13-testing-strategy.md) |
| CI pipeline (when implemented) | [`13-testing-strategy.md`](../architecture/phase-1/13-testing-strategy.md) |

---

## Deployment and operations

| Task | Document |
|---|---|
| Vercel / Render setup and env wiring | [`12-deployment-architecture.md`](../architecture/phase-1/12-deployment-architecture.md) |
| Production bring-up checklist | [`12-deployment-architecture.md`](../architecture/phase-1/12-deployment-architecture.md) |
| GitHub Actions (backup, maintenance) | [`12-deployment-architecture.md`](../architecture/phase-1/12-deployment-architecture.md) |
| DNS and custom domain (N4) | [`12-deployment-architecture.md`](../architecture/phase-1/12-deployment-architecture.md) |

---

## Implementation order

| Task | Document |
|---|---|
| Milestone 0 and Phases A–L | [`15-development-roadmap.md`](../architecture/phase-1/15-development-roadmap.md) |
| Definition of done per change | [`15-development-roadmap.md`](../architecture/phase-1/15-development-roadmap.md) |

---

## Troubleshooting

| Task | Document |
|---|---|
| Common failure modes (index) | [`troubleshooting.md`](troubleshooting.md) |
| Local dev failure table | [`11-local-development-setup.md`](../architecture/phase-1/11-local-development-setup.md) |

---

## Milestone 0 commands (verified locally)

Owning write-up: [`getting-started/local-setup.md`](../getting-started/local-setup.md) and Section 11.

| Task | Command |
|---|---|
| Bootstrap Postgres | `psql -U postgres -f scripts/bootstrap_postgres.sql` |
| Backend venv + install | `cd backend`; `python -m venv .venv`; activate; `pip install -r requirements-dev.txt` |
| Migrate | `cd backend`; `alembic upgrade head` |
| Run API | `cd backend`; `uvicorn app.main:app --reload --port 8000` |
| Run UI | `cd frontend`; `npm install`; `npm run dev` |
| Backend tests | `cd backend`; `pytest` |
| Frontend tests | `cd frontend`; `npm test` |
