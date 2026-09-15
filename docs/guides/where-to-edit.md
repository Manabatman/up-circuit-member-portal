# Where Do I Edit?

Quick map from "I want to change X" to the file you open. Verify paths against the repo if something moved.

---

## Member-facing pages

| I want to change… | Edit this file |
|---|---|
| **Dashboard** (greeting, upcoming events, Constitution link) | `frontend/src/pages/DashboardPage.tsx` |
| **Login page** | `frontend/src/pages/LoginPage.tsx` |
| **Resources** (organizational documents, request forms) | `frontend/src/pages/ResourcesPage.tsx` and `frontend/src/pages/ResourceHubPage.tsx` |
| **Academic Drive** | `frontend/src/pages/AcademicDrivePage.tsx` (uses `ResourceHubPage.tsx`) |
| **Divisions list** | `frontend/src/pages/DivisionsPage.tsx` |
| **Division detail** (links inside one division) | `frontend/src/pages/DivisionDetailPage.tsx` |
| **Members** (directory) | `frontend/src/pages/DirectoryPage.tsx` |
| **My Account** | `frontend/src/pages/AccountPage.tsx` |
| **Renew Membership page** | `frontend/src/pages/RenewalsPage.tsx` |
| **Calendar** (showcase periods; edit data in `demo/calendar.ts`) | `frontend/src/pages/CalendarPage.tsx`, `frontend/src/pages/EventDetailPage.tsx` |
| **Projects / SquEEEze workspace** (showcase; edit data in `demo/`) | `frontend/src/pages/ProjectsPage.tsx`, `frontend/src/pages/SqueezeWorkspacePage.tsx` |

Routes (which URL loads which page): `frontend/src/App.tsx`

**Demo calendar / projects data** (not the official schedule): `frontend/src/demo/` — see [How it works](../how-it-works.md)

**Division image placeholders / future photos**: `frontend/src/content/divisionVisuals.ts`, `frontend/src/components/DivisionVisual.tsx`

**Event image placeholders / future photos**: `frontend/src/content/eventVisuals.ts`, `frontend/src/components/EventVisual.tsx`

**Project image placeholders / future photos**: `frontend/src/content/projectVisuals.ts`, `frontend/src/components/ProjectVisual.tsx`

---

## Layout and navigation

| I want to change… | Edit this file |
|---|---|
| **Sidebar** (nav links, mobile drawer, admin section) | `frontend/src/components/AppLayout.tsx` (Tailwind) |
| **Nav labels and paths** (Dashboard, Resources, …) | `frontend/src/constants.ts` (`ROUTE_LABELS`) |
| **Which pages require login** | `frontend/src/components/ProtectedRoute.tsx` |
| **Logged-in page wrapper** (loads user, passes data to pages) | `frontend/src/components/AuthShell.tsx` |

Nav items a member sees come from the backend (`/auth/me` → `route_keys`), but labels and paths are defined in `constants.ts`.

---

## Look and feel

| I want to change… | Edit this file |
|---|---|
| **Colors, fonts, spacing tokens** | `frontend/src/styles/tokens.css` and `frontend/src/styles/tailwind.css` |
| **Member page headers / section rhythm** | `frontend/src/components/ui.tsx` (`PageShell`, `PageHeader`, `SectionHeader`, `EventCardLink`) |
| **Buttons, cards, badges, forms** | `frontend/src/components/ui.tsx` and `frontend/src/components/ui.module.css` (CSS Modules) |
| **Icons** | `frontend/src/components/Icon.tsx` |
| **Logo** | Replace `frontend/public/circuit-logo.png`; path constant in `frontend/src/constants.ts` |

Member-facing surfaces use **Tailwind + Chakra Petch**; admin and form primitives still use CSS Modules. Prefer Tailwind when editing redesigned member pages; avoid duplicating the same styles in both systems.

---

## Admin pages

| I want to change… | Edit this file |
|---|---|
| **Admin → Resources** | `frontend/src/pages/admin/AdminResourcesPage.tsx` |
| **Admin → Divisions** | `frontend/src/pages/admin/AdminDivisionsPage.tsx` |
| **Admin → Membership** | `frontend/src/pages/admin/AdminMembersPage.tsx` |

---

## Backend API

| I want to change… | Edit this file |
|---|---|
| **Login, logout, OTP, session** | `backend/app/routers/auth.py`, `backend/app/services/auth.py` |
| **Resources API** (member + admin) | `backend/app/routers/resources.py`, `backend/app/services/resources.py` |
| **Divisions API** | `backend/app/routers/divisions.py`, `backend/app/services/divisions.py` |
| **Members, directory, membership status** | `backend/app/routers/members.py`, `backend/app/services/members.py` |
| **Academic years** | `backend/app/routers/academic_years.py` |
| **Permissions and route keys** | `backend/app/auth/deps.py` |
| **Register new routers** | `backend/app/main.py` |

There is no `backend/app/api/` folder — endpoints live in `backend/app/routers/`.

---

## Database

| I want to change… | Edit this file |
|---|---|
| **Table definitions** | `backend/app/models/` |
| **Add or change a column** | New file in `backend/alembic/versions/`, then `alembic upgrade head` |
| **Request/response shapes** | `backend/app/schemas/` (separate from models) |

---

## Real Circuit links — do not edit code

Officers add and update links in the portal:

**Admin → Resources** (organizational and academic resources)  
**Admin → Divisions** (division descriptions and division-scoped resources)

Hardcoding URLs in the frontend means officers cannot change them without a developer.

Exception: a few **fixed external URLs** (renewal portal, first-time renewal form) live in `frontend/src/constants.ts` because they are organization-wide constants, not admin-managed content.

---

## What not to touch (without reading architecture docs first)

| Area | Why |
|---|---|
| **New database tables** | Resources already support Category → Resource → optional Division. Do not create a table just because a page needs a field — check existing models first. |
| **Authentication and sessions** | `backend/app/auth/`, `backend/app/routers/auth.py` — read Section 07 and ADRs before changing. |
| **Permission checks** | `backend/app/auth/deps.py` — backend must stay authoritative; never trust the browser for roles. |
| **CSRF and CORS** | `backend/app/middleware/csrf.py`, CORS in `backend/app/main.py` |
| **Environment variables** | `backend/app/config.py`, `.env.example` files — see Section 10 |

If you are unsure whether something needs a database change, **ask before creating a migration**.

---

## Frontend API calls

If a page fetches data from the backend, the fetch function is usually in `frontend/src/api/` (e.g. `auth.ts`, `resources.ts`, `divisions.ts`).

---

## Related

- [Project structure](../getting-started/project-structure.md)
- [Common tasks](../getting-started/common-tasks.md)
- [Add a feature](../getting-started/add-a-feature.md) — new capabilities, not small edits
