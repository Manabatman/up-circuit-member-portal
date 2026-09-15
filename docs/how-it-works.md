# How the portal works

This page explains how the UP Circuit Member Portal is put together, how login and access work, and where common features live. Read this when you need more than “which file do I edit?”

For setup steps, see [Local setup](getting-started/local-setup.md). For deployment, see [Deploy](deploy.md).

---

## The three parts

| Part | Role | Folder |
|------|------|--------|
| **Frontend** | What members see in the browser | `frontend/` |
| **Backend** | Login, permissions, and data rules | `backend/` |
| **Database** | Stored members, links, sessions, and so on | PostgreSQL (`app` schema), migrations in `backend/alembic/versions/` |

The browser loads the React app. The app calls the backend over HTTP with cookies for login. The backend reads and writes PostgreSQL. The frontend **does not** connect directly to Supabase or the database.

---

## How login works

1. The member enters email and password on the login page (`frontend/src/pages/LoginPage.tsx`).
2. The backend checks the password and sends a one-time code (locally, the code appears in the backend terminal).
3. The member enters the code; the backend creates a session and sets an HttpOnly cookie.
4. Protected pages call `GET /api/v1/auth/me` to load the current user, permissions, and membership status.

Login and session decisions belong in the **backend**, not in the frontend alone.

---

## Membership status and staff permissions

These are **different things**:

- **Membership status** — whether the member is renewed, not renewed, or pending for the current academic year. This controls member-facing areas such as Academic Drive.
- **Staff permissions** — what an officer can manage (resources, membership status, and so on), based on portal roles.

Being an officer or admin does **not** automatically make someone a renewed member. Renewed-member-only pages must still check membership status separately. An officer who is not renewed can often still use admin tools but may be blocked from member-only content such as Academic Drive.

Backend enforcement lives in `backend/app/auth/deps.py` and the services that call permission checks.

---

## Where common features live

| Feature | Member UI | Backend |
|---------|-----------|---------|
| Login | `frontend/src/pages/LoginPage.tsx` | `backend/app/routers/auth.py`, `backend/app/services/auth.py` |
| Home | `frontend/src/pages/DashboardPage.tsx` | `backend/app/routers/academic_years.py` |
| Resources / Academic Drive | `frontend/src/pages/ResourceHubPage.tsx` | `backend/app/routers/resources.py` |
| Divisions (content hubs) | `frontend/src/pages/DivisionsPage.tsx`, `DivisionDetailPage.tsx` | `backend/app/routers/divisions.py` |
| Member directory | `frontend/src/pages/DirectoryPage.tsx` | `backend/app/routers/members.py` |
| Account | `frontend/src/pages/AccountPage.tsx` | `backend/app/routers/members.py` |
| Admin (membership, categories) | `frontend/src/pages/admin/` | Same routers with permission checks |
| Share feedback (beta) | `frontend/src/components/` (feedback UI) | `backend/app/routers/feedback.py` |
| Calendar (demo schedule) | `frontend/src/pages/CalendarPage.tsx`, `frontend/src/demo/calendar.ts` | No events API — demo data only |

Officers add or change Circuit links in the **portal admin UI** (or contextual Add/Edit on resource pages when permitted), not by editing git.

---

## Content hubs and the directory

**Divisions** in the portal are **content hubs**: they group organizational links. They do not, by themselves, mean “this member officially belongs to this division” in the full membership model.

For the member directory, an optional **primary hub** on a profile is used **only** to show and filter the directory. It is not used to grant or deny access to pages.

There are **six Constitution standing divisions** plus an **Executive Board** hub for leadership content. Executive Board is not counted as a seventh standing division.

---

## Important rules — check before changing authentication or member access

Please do not change these casually. If a rule needs to change, update this documentation and explain why before implementing.

- **The frontend does not connect directly to Supabase.** The backend owns communication with the database.
- **The backend owns authentication.** Do not move login or session decisions into the frontend.
- **Membership status and staff permissions are different.** Renewed-member-only pages must keep checking membership separately.
- **Privileged writes must be enforced in the backend**, not only by hiding buttons in the UI.
- **Supabase is hosted PostgreSQL only.** Do not turn on Supabase Auth or the public Data API for app tables.
- **Application tables live in the `app` schema.** We do not rely on row-level security; the backend enforces access.
- **Sessions use HttpOnly cookies** backed by database rows, not JWTs in the browser.
- **Login and feedback abuse limits** use PostgreSQL. Do not add Redis for this beta.
- **Calendar events** in this beta are demo data in `frontend/src/demo/calendar.ts`, not an official schedule.
- **Schema changes** go through Alembic migrations. Ask before running new migrations on shared environments.

---

## Database

- Local: PostgreSQL on your machine (see [Local setup](getting-started/local-setup.md)).
- Production (when ready): Supabase PostgreSQL; the backend connects with credentials in environment variables.

Tables are in the `app` schema. Models: `backend/app/models/`. Migrations: `backend/alembic/versions/`.

---

## Related pages

- [Documentation home](README.md)
- [Where do I edit?](guides/where-to-edit.md)
- [Deploy](deploy.md)
- [Troubleshooting](maintenance/troubleshooting.md)
