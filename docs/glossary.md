# Glossary

Project-specific definitions for the **UP Circuit Member Portal** documentation.

Terms are grouped by **area** so you can start with "What am I dealing with?" Each category lists terms in **alphabetical order** (ignoring bold and backticks when sorting).

---

## Project terms

### Academic Admin

Portal admin role that manages Academic Drive resources.

### Academic Drive

Member-facing area for academic resources (Drive links, docs, sheets, forms). Restricted to **renewed** members.

### Academic year

One row in `academic_years` (e.g. 2026-2027). Exactly one row has `is_current = true` at a time.

### Activation

Process by which an imported member (`password_hash IS NULL`) claims their account via emailed single-use link and sets a password. See [`07-authentication-architecture.md`](architecture/phase-1/07-authentication-architecture.md).

### Activation token

High-entropy opaque token in activation email. Stored hashed in `auth_tokens` (`purpose = ACTIVATION`), 7-day expiry, single use.

### Admin

A member who holds one or more **portal administrative roles** (Renewals, Academic, Finance, Publicity, Super Admin). Admins manage content through the admin dashboard — not through GitHub.

### AuthContext

Object loaded per request containing user identity, roles, permissions (with kind and required membership), and current membership status. Passed to permission guards and handlers.

### Deliberate-action confirmation

Backend requirement that sensitive admin actions (e.g. membership status change) include `confirm_full_name` matching the target member.

### Finance Admin

Portal admin role for finance-related requests and resources.

### Flagship project

One of Circuit's three major projects: The E-Waste Project, InteraCKT, or SquEEEze.

### Iteration

A specific year's instance of a flagship project (e.g. SquEEEze 2026).

### Member

An ordinary UP Circuit member with a portal account. May be renewed, pending, or not renewed.

### Membership gate

Step in the authorization allow rule: for `member_access` permissions, current membership status must satisfy `required_membership`. A role may **never** satisfy a membership gate (C3).

### Membership status

Whether a member has renewed for the current academic year: `PENDING`, `RENEWED`, or `NOT_RENEWED`. Stored on **`membership_terms`**, not `profiles`. Controls member-facing access, separate from admin roles.

### Membership term

One row in `membership_terms`: a member's membership record for one academic year (status, renewal date).

### Permission

Specific capability (e.g. `manage_academic_resources`). Roles are assigned permissions.

### Permission kind

`member_access` (membership-gated) or `admin_capability` (role-gated). Enforces C3.

### Portal

The **UP Circuit Member Portal** — the internal website members and admins use.

### Publicity Admin

Portal admin role for publicity-related requests and resources.

### Required membership

On `permissions` rows where `kind = member_access`: `ANY` (all statuses) or `RENEWED` (only renewed members). `PENDING` and `NOT_RENEWED` fail the `RENEWED` gate.

### Renewals Admin

Portal admin role that manages membership status and member records.

### Renewals Portal

The **existing external** Membership Division renewal website. The **UP Circuit Member Portal** links to it in MVP; it does not replace it (NG2).

### Resource

Database-configured link or item shown to members (Google Form, Drive link, document, etc.). Belongs to exactly one **resource category**.

### Resource category

Grouping for resources (e.g. "Course Materials"). **`scope`** (`ACADEMIC` or `ORGANIZATIONAL`) lives on the category — single authority for academic vs organizational.

### Role

Named set of administrative capabilities (e.g. `ACADEMIC_ADMIN`). Stored in the database, not hardcoded.

### Route key

Code-defined identifier for a frontend page (e.g. `academic_drive`). Navigation items in the database reference route keys, not free-text URLs.

### Scope

Whether a resource category belongs to Academic Drive (`ACADEMIC`) or general Resources (`ORGANIZATIONAL`). Defined on `resource_categories` only — not duplicated on `resources`.

### Scoped permission

Permission tied to a resource domain (e.g. `manage_finance_request_types`). Implemented as explicit permission names, not a scope column.

### Super Admin

Highest portal admin role; can manage all portal content and configuration from the admin dashboard.

### Term assignment

One row in `membership_term_assignments`: division, committee, and position for a membership term. `is_primary` marks directory grouping.

### WebDev

Person or team maintaining **source code and infrastructure** (GitHub, deployment, database). **Not** a portal admin role (C8). Portal admin capabilities require an explicit portal role such as Super Admin.

---

## Web and API terms

### API

The FastAPI HTTP endpoints the frontend calls, under `/api/v1/`.

### Backend

The FastAPI application on Render. Handles authentication, authorization, validation, and business rules.

### Clickjacking

Embedding the portal in a hidden iframe to trick users into clicking. Mitigated by `X-Frame-Options: DENY`.

### Content-Security-Policy (CSP)

HTTP header restricting script/style/load sources. MVP uses a minimal policy; strict nonce CSP may be P1 (N18).

### CORS

Cross-Origin Resource Sharing. Browser rules for requests from the frontend domain to the API domain. Configured as an **exact origin allowlist** with credentials — never `*`. See Section 8.

### CORS allowlist

The explicit list of frontend origins FastAPI accepts (e.g. `https://portal.{domain}`). Origins are never dynamically echoed from the request.

### Endpoint

A specific API URL and HTTP method (e.g. `POST /api/v1/auth/login`).

### Error envelope

Standard API error shape: `{ "error": { "code", "message", "details?" } }`. See Section 6.

### Frontend

The React application in the member's browser. Handles UI only — not security enforcement.

### HSTS

HTTP Strict Transport Security. Forces HTTPS. Enabled only after custom domain is live (N4).

### HTTPS

Encrypted HTTP. All communication between browser, frontend host, and backend uses HTTPS.

### JSON

The format used for data sent between frontend and backend.

### Referer leak

Sensitive data (e.g. activation token in URL) sent to third parties via the `Referer` header. Mitigated by Referrer-Policy and POST-body token consumption.

### REST

API design using HTTP methods and resource paths (e.g. `GET /api/v1/resources`). Our API follows REST conventions.

### Route key (from API)

Route keys returned by `GET /auth/me` for React navigation. Computed from permissions — UI convenience only, not a security boundary.

### Scope-after-load

Authorization pattern where the required permission is determined after loading the target row (e.g. resource category scope).

### Security header

HTTP response headers (`X-Content-Type-Options`, CSP, etc.) that instruct browsers to enforce additional policies. See Section 8.

---

## Authentication and security terms

### Absolute session cap

Maximum session lifetime from `created_at` regardless of activity: 30 days.

### Account disable

Admin sets `is_active = false`. Indefinite until admin re-enables. Distinct from temporary **account lock**.

### Account lock

Temporary block (`locked_until`) after too many failed login or OTP attempts. Self-expires.

### Authentication

Proving who you are (login). FastAPI owns this entirely — not Supabase Auth. See [`07-authentication-architecture.md`](architecture/phase-1/07-authentication-architecture.md).

### Authorization

Deciding what you are allowed to do after login. Enforced in FastAPI, not in React. See [`05-authorization-architecture.md`](architecture/phase-1/05-authorization-architecture.md).

### Audit log

Record of sensitive admin actions: who did what, when, and what changed.

### CSRF

Cross-Site Request Forgery. Malicious site triggers actions using the victim's session cookie. Mitigated by `SameSite=Lax` cookies plus Origin allowlist on mutating requests — not CSRF token libraries (ADR-030).

### Dummy hash

Precomputed Argon2 hash verified when login email is unknown, so response time does not reveal account existence.

### Enumeration (account)

Attack to learn which emails are registered. Mitigated by identical error responses and dummy-hash timing equalization.

### HttpOnly cookie

Browser cookie that JavaScript cannot read. Used for session tokens to reduce XSS risk.

### MEMBERSHIP_REQUIRED

HTTP 403 response code when a user holds a permission but fails the membership gate. Frontend shows a renewal prompt.

### OTP

One-Time Password. Short code emailed after password verification; required before a session is created. May be skipped on **trusted devices** (ADR-029).

### Rate limiting

Restricting login or OTP attempts in a time window. Implemented using PostgreSQL, not Redis.

### RBAC

Role-Based Access Control. Users get roles; roles get permissions. Enforced in FastAPI.

### Response shaping

Returning different JSON fields depending on the caller's permissions. Restricted data is omitted from the response, not just hidden in the UI.

### Session

Proof of a successful login. Opaque token in an HttpOnly cookie; token hash stored in PostgreSQL.

### Sliding session expiry

Session `expires_at` extends on activity (throttled). Idle timeout: 7 days.

### Token hash vs password hash

Passwords use slow Argon2id. Machine-generated tokens use fast SHA-256.

### Trusted device

Device remembered for 30 days via separate HttpOnly cookie. Skips OTP on login but password still required. Revocable (ADR-029).

---

## Database terms

### Alembic

Python tool that runs and tracks database migrations.

### Connection pooler

Service that manages database connections efficiently. We use Supabase Supavisor in **session mode** on port 5432.

### DDL

Data Definition Language. Commands that change structure (`CREATE TABLE`, `ALTER`, `DROP`). Done by `circuit_migrator` only.

### DML

Data Manipulation Language. Commands that read/write rows (`SELECT`, `INSERT`, `UPDATE`, `DELETE`). Done by `circuit_app` at runtime.

### Migration

Versioned, reviewable script that changes the database schema. Managed by Alembic.

### ORM

Object-Relational Mapper. SQLAlchemy maps Python objects to database rows.

### PostgreSQL

Relational database engine. Stores all portal data.

### Request type

Configured category of organizational request (e.g. Finance Request) with a description and destination URL.

### RLS

Row Level Security. PostgreSQL feature that filters rows per database role. **Not used** in this project — see [`03-supabase-architecture.md`](architecture/phase-1/03-supabase-architecture.md) and ADR-006.

### Schema

Namespace inside PostgreSQL that groups tables. Application tables live in the `app` schema, not `public`.

### SQLAlchemy

Python library FastAPI uses to query PostgreSQL.

### Supabase

Hosted service providing managed PostgreSQL plus dashboard and pooler. Used **only as managed PostgreSQL** — not Auth, Realtime, or Data API.

### Table

Structured collection of rows in the database (e.g. `app.users`).

### Temporal data

Data that changes over time and should keep history (e.g. membership status per academic year).

### Tier 1 / Tier 2 / Tier 3 table

MVP / P1 / P2 migration tiers. All designed in Section 4; only Tier 1 created initially.

---

## Deployment and environment terms

### .env.example

Committed template listing variable **names** without values. Copy to `.env` (gitignored) and fill from WebDev lead or dashboards. One file per package: `backend/.env.example`, `frontend/.env.example`.

### APP_ENV

Backend discriminator: `local`, `dev`, or `production`. Drives cookie Secure flag, OpenAPI visibility, and other derived behavior — not a pile of separate debug flags.

### Branch

Parallel line of development. Short-lived branches (`feature/`, `fix/`, `docs/`) are created from `main`, merged back via pull request, then deleted.

### Changelog

[`docs/CHANGELOG.md`](CHANGELOG.md) — dated log of significant project changes.

### Checkpoint

Roadmap pause in Section 15 where the developer answers self-check questions before continuing.

### Definition of done

Per-change checklist: implemented → tested → documented → pull request → CI (Section 15).

### Dev

Supabase project #1 — shared integration testing with fake data only.

### Development journal

Google Docs visual history — screenshots, session notes, build narrative. Not in git. Rules in Section 14.

### Environment variable

Configuration stored outside source code (passwords, API keys, database URLs). Never committed to git. Full catalog in [`10-environment-management.md`](architecture/phase-1/10-environment-management.md).

### Force-push

Overwriting remote branch history. Allowed on your own feature branch before merge; **forbidden on `main`**.

### Keep-warm

External HTTP ping to `/api/v1/health` every ~10 minutes to prevent Render free-tier spin-down. Not needed on Starter plan.

### Local

Development on your own machine, using a local PostgreSQL install.

### Localhost exception

Documented relaxations for local dev only: cookie `Secure=false`, no TLS, console EmailSender for OTP. Never applies in production.

### Maintenance token

`MAINTENANCE_TOKEN` — infrastructure secret for GitHub Action cleanup calls. Not portal RBAC (C8).

### Merge blocker

CI check that must pass before a pull request can squash-merge to `main` (ADR-042).

### Milestone 0

Deliberately small first implementation slice in Section 15 — proves toolchain without auth or deploy.

### Monorepo

One Git repository containing `frontend/`, `backend/`, `docs/`, `scripts/`, and `.github/`.

### Non-functional requirement (NFR)

Quality attributes such as security, maintainability, and testability — detailed in Phase 1 Sections 7–8 and 13.

### Pre-Deploy command

Render step that runs before a new backend version serves traffic — `alembic upgrade head` using `MIGRATOR_DATABASE_URL`.

### Production

Supabase project #2 — real member data.

### Prove-early check

Manual verification requiring real deployment infrastructure (e.g. N17 production CORS). Closed only after actually performed.

### Pull request (PR)

GitHub proposal to merge a branch into `main`. Required for every change.

### Render

Hosts the FastAPI backend.

### Squash merge

Merge method combining all commits in a PR into one commit on `main`. Default (ADR-035).

### Technical documentation

GitHub `docs/` — versioned architecture, schema, API, env, deploy, and test handbooks. Source of truth for WebDev.

### Test database

Dedicated PostgreSQL database (`upcircuit_test` locally) used only by automated tests — never Production or Dev Supabase (ADR-043).

### Testing pyramid

Layered testing: static checks, unit, API/integration, selective E2E, manual prove-early at the top. See Section 13.

### Vercel

Hosts the static React frontend.

### Vertical slice

End-to-end feature path: database → model → API → test → UI. Preferred over building entire layers separately (ADR-046).

### VITE_ prefix

Vite convention: variables with this prefix are baked into the public JS bundle. **Only** `VITE_API_BASE_URL` is allowed — never secrets.

### Virtualenv (`.venv`)

Isolated Python environment for backend dependencies. Created with `python -m venv .venv` in `backend/`. Gitignored.

### Vite dev server

Local frontend development server with hot reload. Default: `http://localhost:5173`. Started with `npm run dev` from `frontend/`.

### uvicorn

ASGI server that runs FastAPI locally. Default local port: 8000.

---

## Acronyms

| Acronym | Expansion |
|---|---|
| **ADR** | Architecture Decision Record |
| **CORS** | Cross-Origin Resource Sharing |
| **CSRF** | Cross-Site Request Forgery |
| **MVP** | Minimum Viable Product |
| **OTP** | One-Time Password |
| **P0 / P1 / P2** | Phase 0 priority levels (MVP / soon after / future) |
| **RBAC** | Role-Based Access Control |
| **RLS** | Row Level Security |
| **SPF / DKIM / DMARC** | Email DNS records for deliverability |

Full project-specific definitions for these terms appear in the categories above.

---

## Related documents

- Requirements: [`PHASE0.md`](PHASE0.md)
- Documentation index: [`README.md`](README.md)
