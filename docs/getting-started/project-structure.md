# Project Structure

This page explains how the UP Circuit Member Portal is organized in the repository.

---

## How the website works

The website has three main parts:

| Part | What it does | Folder |
|---|---|---|
| **Frontend** | What members see and interact with in the browser | `frontend/` |
| **Backend** | Handles accounts, permissions, and data | `backend/` |
| **Database** | Stores members, resources, divisions, and other information | PostgreSQL (local install or Supabase in production) |

When a member opens a page, the **frontend** asks the **backend** for the information it needs. The backend reads from or writes to the **database**, then sends JSON back to the browser.

Officers add Circuit links (Constitution, Drive folders, etc.) through the **admin UI** in the portal — not by editing code.

```
                 MEMBER
                   │
                   ▼
          ┌─────────────────┐
          │ React + Vite    │
          │   FRONTEND      │   frontend/
          └────────┬────────┘
                   │  API requests (JSON)
                   ▼
          ┌─────────────────┐
          │ FastAPI         │
          │   BACKEND       │   backend/
          └────────┬────────┘
                   │
                   ▼
          ┌─────────────────┐
          │ PostgreSQL      │
          │   DATABASE      │   Alembic migrations in backend/alembic/
          └─────────────────┘
```

---

## Repository layout

```
upcircuitportal/
├── frontend/          React app (pages, components, styles)
├── backend/           FastAPI app (routers, services, models)
├── docs/              Documentation (start at docs/README.md)
├── scripts/           Database bootstrap, seeds, test helpers
├── start-local.bat    Start backend + frontend on Windows
└── stop-local.bat     Stop local servers
```

---

## Frontend (`frontend/`)

| Folder / file | Purpose |
|---|---|
| `src/pages/` | One file per screen (Dashboard, Login, Resources, …) |
| `src/components/` | Reusable UI (sidebar layout, buttons, cards) |
| `src/styles/tokens.css` | Colors, fonts, spacing tokens |
| `src/constants.ts` | Nav labels, paths, shared URLs |
| `src/App.tsx` | Routes — maps URLs to page components |
| `src/api/` | Functions that call the backend API |

The frontend runs at **http://localhost:5173** during local development.

---

## Backend (`backend/`)

| Folder / file | Purpose |
|---|---|
| `app/routers/` | API endpoints (auth, resources, members, divisions, …) |
| `app/services/` | Business logic |
| `app/models/` | Database table definitions (SQLAlchemy) |
| `app/schemas/` | Request/response shapes (Pydantic) |
| `app/auth/` | Sessions, permissions, password checks |
| `app/main.py` | App entry point — wires routers and middleware |
| `alembic/versions/` | Database migration files |

The backend runs at **http://localhost:8000**. API docs: **http://localhost:8000/api/docs**.

There is no `backend/app/api/` folder — endpoints live in `backend/app/routers/`.

---

## Database

- **Local:** PostgreSQL databases `upcircuit_local` and `upcircuit_test`, created by `scripts/bootstrap_postgres.sql`.
- **Production (planned):** Supabase-hosted PostgreSQL — hosting only; auth runs in FastAPI, not Supabase Auth.
- **Schema changes:** Add a migration in `backend/alembic/versions/`, then run `alembic upgrade head` from `backend/`. Ask before creating a new table — see [where-to-edit.md](../guides/where-to-edit.md).

---

## URL → page file

Routes are defined in `frontend/src/App.tsx`. Page components live in `frontend/src/pages/`.

| URL | Page file |
|---|---|
| `/login` | `frontend/src/pages/LoginPage.tsx` |
| `/dashboard` | `frontend/src/pages/DashboardPage.tsx` |
| `/resources` | `frontend/src/pages/ResourcesPage.tsx` → uses `ResourceHubPage.tsx` |
| `/academic-drive` | `frontend/src/pages/AcademicDrivePage.tsx` → uses `ResourceHubPage.tsx` |
| `/divisions` | `frontend/src/pages/DivisionsPage.tsx` |
| `/divisions/:divisionId` | `frontend/src/pages/DivisionDetailPage.tsx` |
| `/directory` | `frontend/src/pages/DirectoryPage.tsx` |
| `/account` | `frontend/src/pages/AccountPage.tsx` |
| `/renewals` | `frontend/src/pages/RenewalsPage.tsx` |
| `/admin/resources` | `frontend/src/pages/admin/AdminResourcesPage.tsx` |
| `/admin/divisions` | `frontend/src/pages/admin/AdminDivisionsPage.tsx` |
| `/admin/members` | `frontend/src/pages/admin/AdminMembersPage.tsx` |

---

## URL → backend router

Routers are registered in `backend/app/main.py`.

| Area | Router file |
|---|---|
| Health check | `backend/app/routers/health.py` |
| Login, logout, session | `backend/app/routers/auth.py` |
| Academic years | `backend/app/routers/academic_years.py` |
| Resources (member + admin) | `backend/app/routers/resources.py` |
| Divisions | `backend/app/routers/divisions.py` |
| Members, directory, admin membership | `backend/app/routers/members.py` |

---

## What not to touch (day one)

- Do not add a database table just because a page needs some information — check whether an existing table already represents it (resources support Category → Resource → optional Division).
- Do not change authentication, session cookies, or permission checks without reading the architecture docs first.
- Do not hardcode Circuit links in the frontend — officers add them in **Admin → Resources**.

More detail: [where-to-edit.md](../guides/where-to-edit.md)

---

## Next steps

- [Common tasks](common-tasks.md) — run the app after a change
- [Where do I edit?](../guides/where-to-edit.md) — file-by-file guide
- [Local setup](local-setup.md) — first-time install
