# System Architecture

This document describes the **major components** of the UP Circuit Member Portal, how they communicate, and the architectural rules that govern the system.

**Phase 0 reference:** §0.10.28–0.10.32, §0.11.1, §0.12.1

---

## What problem does this architecture solve?

UP Circuit's tools (Google Forms, Sheets, Drive, Docs, Messenger) are scattered. The portal becomes **one organized entry point** where members find what they need and officers manage content without editing source code.

The architecture must support:

- ~1,200 members, ~50 concurrent users at peak
- Role-based admin with membership-based access restrictions
- Database-driven content (links, resources, navigation)
- Security enforced on the server, not in the browser
- Maintainability by future student developers

---

## Architectural style

**Decision:** Three-tier, backend-authoritative web application.

```
Browser (React SPA)
       ↓  HTTPS / JSON
FastAPI (single modular monolith)
       ↓  SQL / TLS
PostgreSQL (Supabase)
```

**Not used:** Microservices, serverless per-endpoint, GraphQL, server-side rendering, direct browser-to-database access.

**Why a monolith?** One developer, one enforcement point, one codebase to debug. FastAPI is organized internally by domain (`auth`, `members`, `resources`, …) without network boundaries between services.

**Phase 0 ref:** §0.11.3 (API domain structure), §0.12.9 (monorepo)

---

## System diagram

```
                         MEMBER / ADMIN
                               │
                               ▼
                    ┌────────────────────┐
                    │  React + Vite      │  ← UI only (Vercel CDN)
                    │  TypeScript        │
                    └─────────┬──────────┘
                              │  HTTPS JSON  /api/v1/*
                              ▼
                    ┌────────────────────┐
                    │  FastAPI           │  ← Auth, authz, rules (Render)
                    │  Python            │
                    └─────────┬──────────┘
                              │  SQL (Supavisor session mode)
                              ▼
                    ┌────────────────────┐
                    │  PostgreSQL        │  ← Source of truth (Supabase)
                    │  schema: app       │
                    └────────────────────┘

External (browser leaves portal — plain links only in MVP):
  • Existing Renewals Portal
  • Google Forms / Sheets / Drive / Docs
  • Brevo (email — server-side only)
```

---

## Trust boundaries

Three zones define what the system is allowed to believe:

| Zone | What it contains | Rule |
|---|---|---|
| **1 — Untrusted** | Browser, React state, localStorage | Never trusted for identity, roles, or permissions |
| **2 — Trusted** | FastAPI | All authentication, authorization, validation, business rules |
| **3 — Secret** | PostgreSQL credentials, email API keys | Never reachable from Zone 1 |

### Rule A — The browser is an attacker

Every API request re-derives identity and permissions from the session. The client never sends a trusted user ID or role.

**Phase 0 ref:** §0.6.17, §0.6.18 Rule 8–9

### Rule B — No database credential in the browser

No `supabase-js`, no Supabase anon key, no service key in the frontend. The frontend's only backend is `/api/v1`.

**Phase 0 ref:** §0.7.17, §0.11.1

### Rule C — Business rules live in one layer

Example: "Non-renewed members cannot access Academic Drive" exists **once**, in FastAPI. React may hide the nav item because the API said so — not because React independently knows the rule.

---

## Component responsibilities

### React (frontend)

**What it is:** A single-page application (SPA) — HTML, JavaScript, and CSS loaded once, then updated in the browser without full page reloads.

**Owns:**

- Rendering pages and components
- Client-side routing (which page to show)
- Form input and inline validation (UX feedback only)
- Loading, error, and empty states
- Hiding controls the user cannot use (convenience, not security)

**Must never:**

- Decide whether an action is permitted
- Hold secrets or database credentials
- Be the only validator of anything important

**Hosted on:** Vercel (static files + CDN)

### FastAPI (backend)

**What it is:** A Python web framework that exposes HTTP API endpoints and runs server-side logic.

**Owns:**

- Authentication (password, OTP, sessions)
- Authorization (roles → permissions, membership gates)
- Input validation (Pydantic models)
- Business rules (membership status, audit logging, notifications)
- Response shaping (omit fields the caller is not entitled to see)

**Example — response shaping:** The member directory must not expose student numbers or phone numbers to ordinary members (FR-MEMBER-005). The backend **omits** those fields from JSON. Returning them and hiding them in React would still leak them via browser DevTools.

**Hosted on:** Render

**Phase 0 ref:** §0.10.28

### PostgreSQL (database)

**What it is:** A relational database — tables, rows, relationships, constraints.

**Owns:**

- Persistent data (members, resources, sessions, audit logs, …)
- Structural integrity (foreign keys, CHECK constraints, NOT NULL)

**Must never:**

- Be directly reachable from the browser
- Be the primary authorization layer (see Section 3 — no RLS)

**Hosted on:** Supabase (managed PostgreSQL)

**Phase 0 ref:** §0.10.30

### External services

| Service | Relationship in MVP |
|---|---|
| **Existing Renewals Portal** | Outbound hyperlink from `/membership` |
| **Google Forms/Sheets/Drive/Docs** | Outbound hyperlinks; URLs stored in database |
| **Brevo (email)** | FastAPI sends OTP and notification email server-side |

The portal **does not proxy, embed, or authenticate** against Google services in MVP.

**Phase 0 ref:** §0.4 NG1, FR-MEMBERSHIP-002

---

## Request flow examples

### Member opens Academic Drive

```
Member → React navigates to /academic
       → GET /api/v1/resources?scope=academic  (+ session cookie)
       → FastAPI: authenticate → load membership status
       → If NOT_RENEWED → 403 MEMBERSHIP_REQUIRED
       → If RENEWED → query PostgreSQL → return resource list
       → React renders cards
```

Same result whether the request comes from React or `curl` — that equivalence is the security property.

**Phase 0 ref:** FR-ACADEMIC-005

### Admin changes a Google Form URL

```
Admin → React admin UI → PATCH /api/v1/resources/{id}
      → FastAPI: authenticate → require manage_* permission → validate
      → UPDATE database → INSERT audit_log
      → 200 OK
Member → next GET /api/v1/resources → sees new URL (no deploy)
```

**Phase 0 ref:** G2, §0.7.23

### Login (full design in Section 7)

```
User → POST /api/v1/auth/login (email + password)
     → FastAPI verifies password hash → rate limit
     → If trusted device cookie valid → create session → Set HttpOnly cookie (skip OTP)
     → Else → store OTP hash → email code → no session yet
User → POST /api/v1/auth/verify-code
     → FastAPI verifies OTP → create session row → Set HttpOnly cookie
     → Optional: remember device → trusted_devices cookie
     → Authenticated
```

No session exists until OTP is verified **or** a valid trusted device bypasses OTP. Email delivery is on the critical path for untrusted devices.

**Phase 0 ref:** FR-AUTH-002, FR-AUTH-003 — see [`07-authentication-architecture.md`](07-authentication-architecture.md)

---

## Authentication ownership

**Decision:** FastAPI owns authentication entirely. Supabase Auth is **not used**.

| Concern | Owner |
|---|---|
| Password hashing | FastAPI (`pwdlib` + Argon2id) |
| OTP generation and verification | FastAPI (`secrets`, PostgreSQL) |
| Session lifecycle | FastAPI (opaque token + PostgreSQL `sessions` table) |
| Rate limiting | FastAPI (PostgreSQL attempt counters) |
| Account activation (C4) | FastAPI — [`07-authentication-architecture.md`](07-authentication-architecture.md) |
| Password reset | FastAPI — [`07-authentication-architecture.md`](07-authentication-architecture.md) |

Supabase provides **PostgreSQL only**. There is no second identity system.

**Why:** FR-AUTH-003 requires password **then** emailed OTP. Supabase Auth does not offer this flow natively. A single enforcement point avoids split session state.

**Phase 0 ref:** §0.10.3 (deferred to Phase 1 — now decided)

**Related:** [`04-database-schema.md`](04-database-schema.md) (RBAC tables), [`05-authorization-architecture.md`](05-authorization-architecture.md) (permission enforcement)

---

## Session transport

**Decision:** HttpOnly, Secure, `SameSite=Lax` cookies on a **custom domain** with subdomains.

Example topology (exact domain TBD):

- Frontend: `portal.upcircuit.org` (Vercel)
- Backend: `api.upcircuit.org` (Render)

Both share a registrable parent domain so cookies are **same-site** (not third-party). JavaScript cannot read the session token.

**Consequence:** CSRF protection required on state-changing requests (Origin validation). Detailed in [`08-security-architecture.md`](08-security-architecture.md).

**Domain purchase/DNS:** See [`12-deployment-architecture.md`](12-deployment-architecture.md) (N4 — purchase deferred).

---

## Authorization model

### Two independent axes

**Phase 0 ref:** §0.6.1 Rule 2

| Axis | Controls | Examples |
|---|---|---|
| **Membership status** | Member-facing **consumption** | Academic Drive, renewal-dependent features |
| **Administrative roles** | **Management** capabilities | Edit resources, change membership status |

A user may have multiple roles. Membership status and roles are stored separately.

### Approved rule (C3 — resolved)

> **Membership status gates member-facing consumption.**  
> **Roles grant administrative capability.**  
> **A role may never satisfy a membership gate.**

**Example:** A non-renewed member who is also Academic Admin:

- **Can** manage academic resources (admin job)
- **Cannot** browse Academic Drive as a member until they renew

Formal permission kinds are defined in [`05-authorization-architecture.md`](05-authorization-architecture.md):

- `member_access` — membership gate applies via `permissions.required_membership`
- `admin_capability` — role check only; membership irrelevant

The four-step allow rule and FastAPI `require_permission()` dependency enforce C3 structurally.

### RBAC structure (conceptual)

```
USER
 ├── Membership status (PENDING | RENEWED | NOT_RENEWED)
 ├── Roles (many-to-many: MEMBER, ACADEMIC_ADMIN, …)
 │     └── Permissions (manage_academic_resources, …)
 └── Session
```

**Phase 0 ref:** §0.6.13 — permissions as data, not `if role == "finance"`

Permissions are **not** hardcoded in FastAPI as role name checks. They are resolved from the database.

### WEBDEV is not an application role (C8 — resolved)

**Decision:** No `WEBDEV` role in the database permission model.

- **WebDev** = GitHub, Render, Vercel, Supabase dashboard access
- **Portal admin** = explicit role such as `SUPER_ADMIN`

An officer should not receive production database credentials because they are Academic Admin.

**Phase 0 ref:** §0.5C, §0.6.11

---

## Membership model

### Status values

`PENDING` → `RENEWED` → (renewal period) → `NOT_RENEWED` → (renew) → `RENEWED`

**Phase 0 ref:** FR-MEMBERSHIP-001, §0.9.4

### Temporal membership

Membership is **per academic year**, stored in `membership_terms` (not a field on `profiles`).

Organizational placement (division, committee, position) is stored in `membership_term_assignments` per term — supporting double division with `is_primary` for directory grouping.

See [`04-database-schema.md`](04-database-schema.md) for full schema.

### Non-renewed member access (C2 — resolved)

Non-renewed members retain login and limited access so the portal is where they learn to renew. Precise rules defined in Section 5.

| Capability | Non-renewed | Permission / gate |
|---|---|---|
| Login, dashboard, own account | Yes | `view_dashboard`, `view_own_profile`, `edit_own_profile` — `ANY` |
| Member directory | Yes | `view_member_directory` — `ANY` (§0.7.15) |
| Requests (directory / redirects) | Yes | `view_request_directory` — `ANY` |
| Request history | **No in MVP** (C5 — P1) | `view_own_requests` — `ANY` when built |
| Academic Drive | **No** | `view_academic_resources` — `RENEWED` gate |
| Flagship project info | Yes (P1) | `view_flagship_projects` — `ANY` |
| Flagship internal resources | **No** (P1) | `view_flagship_resources` — `RENEWED` gate |
| Renew Membership page | Yes | `view_renewal_info` — `ANY` |

**PENDING status:** Fails the `RENEWED` gate — same effective access as `NOT_RENEWED` for member-facing consumption.

### External Renewals Portal

**Decision:** MVP links to the existing Membership Division renewal system. Does not rebuild renewals.

**Phase 0 ref:** §0.4 NG2, FR-MEMBERSHIP-002

---

## Code vs database configuration boundary

Officers change content via admin UI. Developers change structure via code + migration.

| Database-driven (no deploy) | Code-defined (requires deploy) |
|---|---|
| Resource titles, URLs, descriptions, order | Database schema |
| Request type names, destinations | Permission **names** referenced in code |
| Announcements, navigation labels/visibility | Status enums (`RENEWED`, …) |
| Flagship iteration content | React pages and layout |
| Categories | Route keys registry |

### Navigation route keys (C7 — resolved)

Navigation items in the database reference **route keys** (`academic_drive`, `requests`, …), not free-text paths. React exports the registry of valid keys. Admins cannot create links to nonexistent pages.

**MVP (Section 4):** The `navigation_items` table is **P1**. MVP navigation is **code-defined** using the same route-key registry with required permissions per route. The database table is added later without refactoring routes.

---

## Deployment topology

```
GitHub (monorepo: frontend/ + backend/ + docs/)
   ├── push → Vercel  → static React build → CDN
   └── push → Render  → FastAPI container
                              ↓
                        Supabase PostgreSQL
```

**Environments:** Local → Dev (Supabase #1) → Production (Supabase #2). Dedicated staging deferred (cost). See `03-supabase-architecture.md`.

**Render cold start:** Free tier spins down after 15 minutes. Budget $7/mo Starter before member rollout. See `02-technology-decisions.md`.

---

## Request history (C5 — resolved)

**MVP:** Request **directory** only — cards that link to external Google Forms.

**Not in MVP:** Request submission tracking, status history, dashboard "My Requests" (FR-DASH-006).

**P1:** Native request workflows in the database with real history.

**Reason:** If MVP requests are redirects, the portal never learns whether a member submitted a form. Showing "history" would be misleading.

---

## Audit requirements

Sensitive admin actions record: actor, action, target, timestamp, previous value, new value.

Examples: membership status change, resource edit, role assignment, request type URL change.

**Phase 0 ref:** §0.6.16, FR-MEMBERSHIP-006, §0.7.16

Audit logging is a FastAPI responsibility on successful authorized actions.

---

## Explicitly excluded from MVP architecture

| Excluded | Reason |
|---|---|
| Browser → Supabase direct access | Violates trust boundary |
| Supabase Auth, Realtime, Edge Functions | Not needed; FastAPI owns app logic |
| Microservices | No scale justification |
| GraphQL | Single client; REST specified in Phase 0 |
| Redis / Celery | Sessions, OTP, rate limits in PostgreSQL |
| Google API integration | MVP uses stored URLs only |
| Supabase Storage | Deferred until file uploads needed |
| JWT sessions | DB sessions simpler and revocable — see Section 2 |
| Request history UI | C5 — P1 |

---

## Decisions documented in this section

| # | Decision |
|---|---|
| 1 | Three-tier monolithic FastAPI backend |
| 2 | No Supabase client or keys in frontend |
| 3 | FastAPI owns authentication |
| 4 | HttpOnly cookies on custom domain (DNS deferred) |
| 5 | C3: membership gates consumption; roles never satisfy membership gates |
| 6 | Response shaping as authorization |
| 7 | Navigation uses route keys |
| 8 | No WEBDEV application role |
| 9 | MVP Google/Renewals = hyperlinks only |
| 10 | C5: no request history in MVP |

---

## What future WebDev members should know

**Safe to change:** Admin UI copy, styling, new resources/request types via database, new API endpoints that follow existing auth patterns.

**Change with care:** Permission names, session handling, password/OTP code, database roles, migration workflow.

**Do not change without ADR + doc update:** Trust boundaries, "no Supabase in frontend," authentication ownership, C3 membership/role rule.

**Where to look:**

| Topic | Document |
|---|---|
| Technology choices | `02-technology-decisions.md` |
| Database hosting | `03-supabase-architecture.md` |
| Tables and columns | `04-database-schema.md` |
| Authorization / permissions | `05-authorization-architecture.md` |
| API endpoints | `06-api-architecture.md` |
| Authentication / login | `07-authentication-architecture.md` |
| Security (CORS, CSRF, headers) | `08-security-architecture.md` |
| Unresolved items | `open-items.md` |
| Terms | `glossary.md` |

---

*Section 1 — approved. See `00-phase-1-overview.md` for Phase 1 status.*
