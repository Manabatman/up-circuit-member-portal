# Technology Decisions

This document explains **what technologies** the UP Circuit Member Portal uses, **why each was chosen**, and **what alternatives were rejected**.

**Phase 0 reference:** §0.12.1–0.12.9

---

## Dependency philosophy

Every dependency must answer: **What concrete problem does it solve in this project?**

Before adding a library:

1. Name the simpler alternative.
2. Explain why it is not enough.
3. Consider what a future WebDev member must learn to maintain it.

**Principle:** Intentionally minimal dependencies. New libraries require explicit justification and documentation.

---

## Evaluation criteria

| Question | Why it matters |
|---|---|
| What does it earn? | Must solve a real project problem |
| What's the simpler alternative? | Avoid unnecessary complexity |
| Maintainer cost? | Future Circuit developers inherit every dependency |
| Exit cost? | Can we migrate if wrong? |

---

## Stack summary

| Layer | Technology | Role |
|---|---|---|
| Frontend | React + Vite + TypeScript | UI in the browser |
| Styling | CSS Modules | Scoped CSS, zero styling dependencies |
| Routing | React Router | Client-side page navigation |
| Server state | TanStack Query | API data caching and invalidation |
| Icons | Lucide React | Tree-shaken icons |
| Backend | Python + FastAPI | API, auth, business logic |
| Validation | Pydantic (via FastAPI) | Request/response validation |
| ORM | SQLAlchemy 2.0 | Database queries |
| Migrations | Alembic | Versioned schema changes |
| Database | PostgreSQL via Supabase | Persistent data |
| Email | Brevo via `EmailSender` | OTP and notifications |
| Frontend host | Vercel | Static SPA + CDN |
| Backend host | Render | FastAPI container |
| Source control | Git + GitHub | Monorepo |

---

## Frontend

### React

**What is it?** A JavaScript library for building user interfaces from reusable components.

**Why we need it:** The portal has substantial interactive UI — admin forms, reorderable lists, permission-gated tables, import previews. Plain HTML/JS would require manual DOM synchronization that becomes unmaintainable.

**Decision:** Use React.

**Alternatives considered:**

| Alternative | Rejected because |
|---|---|
| Plain HTML + vanilla JS | Admin UI state management becomes fragile |
| HTMX | Pushes rendering to backend; conflicts with static frontend + JSON API split |
| Svelte / Vue | Technically fine; React has larger hiring pool for future Circuit WebDev (Phase 0 G8) |

**Exit cost:** High (framework lock-in). Accepted — Phase 0 chose React deliberately.

**Phase 0 ref:** §0.12.2

---

### Vite

**What is it?** A build tool that bundles TypeScript/React into optimized static files for production and provides a fast development server.

**Why we need it:** Compiles TypeScript, resolves imports, minifies for production, enables hot module replacement during development.

**Decision:** Use Vite.

**Alternatives considered:**

| Alternative | Rejected because |
|---|---|
| **Next.js** | SSR/API routes create a second place backend logic could live; violates single enforcement point. No SEO need (all behind login). |
| No bundler (native ES modules) | Loses TypeScript compilation and production optimization |

**Phase 0 ref:** §0.12.2

---

### TypeScript

**What is it?** JavaScript with static type checking — catches many errors at compile time.

**Why we need it here specifically:** API responses vary by caller permissions. Fields like `contact_number` may or may not exist. TypeScript's optional fields (`contact_number?: string`) force developers to handle absence — enforcing the authorization model at the UI layer.

**Decision:** Use TypeScript.

**Phase 0 ref:** §0.12.2

---

### TanStack Query (React Query)

**What is it?** A library for fetching, caching, and synchronizing server state in React.

**Why we need it:** Without it, admin edits show stale lists until manual refresh. Hand-rolling cache invalidation across the admin surface reimplements this library, worse.

**Decision:** Include `@tanstack/react-query`.

**Alternatives considered:**

| Alternative | Rejected because |
|---|---|
| Plain `fetch` + `useEffect` | Stale data bugs; boilerplate for loading/error/retry |

---

### React Router

**What is it?** Client-side routing — maps URLs to page components without full page reloads.

**Why we need it:** Required for the route key registry (navigation items reference code-defined routes).

**Decision:** Include `react-router`.

---

### Lucide React

**What is it?** An icon library. Icons import individually (tree-shaken) so only used icons are bundled.

**Decision:** Include `lucide-react`.

**Alternatives considered:** Icon fonts (harder to tree-shake), inline SVG everywhere (verbose).

---

### CSS Modules

**What is it?** CSS files scoped to components — class names are automatically unique per file.

**Why we need it:** Phase 0 specifies HTML + CSS. CSS Modules need zero extra dependencies (built into Vite).

**Decision:** CSS Modules for styling. No Tailwind, MUI, or Chakra.

**Alternatives considered:**

| Alternative | Rejected because |
|---|---|
| Tailwind CSS | Build dependency; utility syntax future maintainers must learn |
| MUI / Chakra / shadcn | Large surface, opinionated design, upgrade churn; our UI is cards/tables/forms |

**Phase 0 ref:** §0.12.2 ("HTML + CSS")

---

## Backend

### Python + FastAPI

**What is FastAPI?** A modern Python web framework for building APIs with automatic validation and OpenAPI documentation.

**Why Python?** Primary developer already knows Python. At ~1,200 users, developer velocity matters more than micro-optimizations.

**Why FastAPI over alternatives?**

| Alternative | Rejected because |
|---|---|
| **Django + DRF** | Django admin is a developer tool, not an officer-friendly admin UI (Phase 0 NG3). Brings ORM/auth/middleware conventions larger than needed. |
| **Flask** | Would manually reimplement Pydantic validation, OpenAPI, dependency injection |
| **Litestar** | Better design but far smaller community/documentation |

**What FastAPI earns:**

- **Pydantic validation** — input validation layer (FR security requirements)
- **OpenAPI docs** — `/api/docs` for free (§0.11.16)
- **Dependency injection** — natural home for `require_permission("manage_academic_resources")`

**Phase 0 ref:** §0.12.3

---

### Synchronous SQLAlchemy (not async)

**What is SQLAlchemy?** Python's standard ORM — maps Python classes to database tables.

**Decision:** Synchronous SQLAlchemy with plain `def` endpoints (not `async def`).

**Why not async?** FastAPI runs `def` endpoints in a thread pool. Blocking database calls, Argon2 hashing, and HTTP to Brevo are then safe. Async endpoints with blocking calls stall the entire event loop — a subtle production bug.

At 50 concurrent users, sync is not a bottleneck.

**Phase 0 ref:** Silent — Phase 1 decision.

See [ADR-011](decisions/ADR-011-synchronous-sqlalchemy-not-async.md).

---

### Alembic

**What is it?** Database migration tool for SQLAlchemy — versioned, reviewable schema changes in git.

**Why we need it:** Phase 0 requires controlled schema evolution. Hand-managing schema across local/dev/production causes drift.

**Decision:** SQLAlchemy 2.0 + Alembic.

**Alternatives considered:**

| Alternative | Rejected because |
|---|---|
| Raw SQL + `psycopg` | Workable but no migration versioning |
| **SQLModel** | Blurs DB models and API schemas; response shaping requires separate Pydantic models |

**Phase 0 ref:** §0.10.1, §0.12.3

---

## Database

### PostgreSQL

**What is it?** A relational database with strong integrity (foreign keys, CHECK constraints, transactions).

**Why not SQLite?** Render's filesystem is ephemeral — data loss on restart. Poor dev/prod parity.

**What PostgreSQL earns:** CHECK constraints on status enums, transactions for audit+log atomicity, `jsonb` for future request payloads, composite indexes for directory filters.

**Phase 0 ref:** §0.12.4

---

### Supabase (as managed PostgreSQL only)

**What is Supabase?** Hosted PostgreSQL plus dashboard, pooler, and optional platform features (Auth, Storage, Realtime, Data API).

**Decision:** Use Supabase **only as managed PostgreSQL** — not Auth, not Realtime, not Edge Functions, not Data API.

**Why Supabase over Neon?** Two free projects (dev + prod), better dashboard for debugging, Storage pre-wired for later. Neon is arguably better pure-Postgres but marginal advantage does not overturn Phase 0.

**Lock-in:** Near zero — standard PostgreSQL via SQLAlchemy. Migration = `pg_dump` + new `DATABASE_URL`.

**Free tier constraints:**

- 500 MB per project (sufficient for years)
- Projects pause after 7 days inactivity (manual restore)
- **No automated backups** — offsite `pg_dump` required

See `03-supabase-architecture.md` for full database infrastructure design.

**Phase 0 ref:** §0.12.4

---

## Authentication technology

> **Treat authentication as a security-critical subsystem.** Custom code must be minimal, isolated, thoroughly tested, and based on established libraries — not custom cryptography.

### No JWT — opaque database-backed sessions

**What is a JWT?** A self-contained signed token the server can verify without a database lookup.

**Decision:** Do **not** use JWTs. Use opaque tokens stored as hashes in PostgreSQL.

**Flow:**

```
Login success → token = secrets.token_urlsafe(32)
             → store SHA-256(token) in sessions table
             → set token in HttpOnly cookie

Each request → hash cookie → lookup session → load user

Logout → delete session row
Revoke user → delete all their session rows
```

**Why not JWT?**

| JWT problem | Our situation |
|---|---|
| Cannot revoke until expiry | We need instant revocation when roles change or accounts disable |
| Requires PyJWT + crypto discipline | We have one DB — lookup is simpler |
| Designed for stateless multi-service | We have one monolith with a database |

**Challenges Phase 0:** §0.12.8 listed `JWT_SECRET` — superseded by this decision.

See [ADR-002](decisions/ADR-002-opaque-database-backed-sessions-instead-of-jwt.md).

---

### Password hashing: `pwdlib[argon2]`

**Decision:** Use `pwdlib` with Argon2id via `PasswordHash.recommended()`.

**Why not `passlib`?** Unmaintained; broken on Python 3.13+. Was incorrectly mentioned in early Section 1 discussion — corrected before implementation.

**What is Argon2id?** OWASP's current recommended password hashing algorithm (RFC 9106). Memory-hard — expensive for attackers, acceptable for single logins.

**Initial parameters:** `m=19456 (19 MiB), t=2, p=1` — OWASP-documented tier suitable for Render's 512 MB RAM limit.

**Important:** These parameters are **not permanently fixed**. They must be validated by benchmarking on the target Render environment (latency, memory under concurrent login load). Document final values with evidence. See `open-items.md` N1.

**Application code:** Two calls — `hash()` and `verify()`. No custom cryptography.

---

### OTP, rate limiting, CSRF

| Concern | Implementation | Library |
|---|---|---|
| OTP generation | `secrets.randbelow()` → 6-digit code | Python stdlib |
| OTP storage | Hashed in PostgreSQL, short expiry, `used_at` | PostgreSQL |
| OTP comparison | `hmac.compare_digest()` | Python stdlib |
| Rate limiting | Attempt counters in PostgreSQL | No Redis, no `slowapi` |
| CSRF | `SameSite=Lax` + Origin header validation | FastAPI middleware — see [`08-security-architecture.md`](08-security-architecture.md) |

**Why PostgreSQL for rate limiting?** FR-AUTH-005 requires durable attempt tracking anyway. Render free tier restarts wipe in-memory counters. One mechanism serves both requirements.

---

### Rejected: `fastapi-users`

**Why rejected:**

1. Wants to own the user model — collides with Phase 0's `users` / `profiles` / `memberships` separation
2. No first-class password-then-email-OTP support
3. Net result: more custom code, not less

**Total auth dependencies:** One — `pwdlib[argon2]`. Everything else is stdlib + PostgreSQL.

---

## Email

### Brevo behind EmailSender abstraction

**What is Brevo?** A transactional email service (formerly Sendinblue).

**Decision:** Brevo for launch. All email through one internal `EmailSender` interface so the provider can be swapped (e.g. to Amazon SES) by changing one module.

**Why not Gmail SMTP?** OTP email is login-critical. Gmail has send limits, poor deliverability for app-generated mail, and may disable accounts for automated sending. Silent login failure is the realistic failure mode.

**Free tier:** 300 emails/day (~9,000/month) — highest permanent free daily cap among providers evaluated.

**Volume implications:**

- OTP on every login does not fit free tiers comfortably at ~1,200 members → **"Remember this device for 30 days"** skips OTP on trusted devices ([`07-authentication-architecture.md`](07-authentication-architecture.md)); steady-state email volume drops sharply
- Bulk activation of 1,204 accounts exceeds daily cap → **staged onboarding by division** ([`15-development-roadmap.md`](15-development-roadmap.md))

**Deliverability:** SPF, DKIM, DMARC DNS records required before auth goes live.

**Alternatives considered:**

| Provider | Rejected because |
|---|---|
| Resend | 100/day cap — too low for busy days |
| SendGrid | No permanent free tier (2025+) |
| Amazon SES | Best at scale (~$0.10/1K); bare-metal DX — documented upgrade path |

See [ADR-009](decisions/ADR-009-brevo-email-behind-emailsender-abstraction.md). Resolves C10.

---

## Hosting

### Vercel (frontend)

**Role:** Static file host + CDN + preview deployments per PR.

**Plan:** Hobby (free). Internal non-profit student org use is within Vercel's fair use policy (no payments, ads, or paid developers).

**Alternatives:** Cloudflare Pages, Netlify — equally capable. Vercel stays for Phase 0 choice and PR preview DX.

---

### Render (backend)

**Role:** Runs FastAPI container.

**Free tier constraints:**

- Spins down after 15 min inactivity (~30–90s cold start for Python)
- 750 instance-hours/month — keeping one service warm ≈ entire allowance
- Cannot warm both prod and staging on free tier

**Recommendation:** Budget **$7/month Starter** before member rollout to eliminate login cold starts.

**Phase 0 ref:** §0.12.6

---

## Complete dependency lists

### Backend runtime (9 packages)

| Package | Purpose |
|---|---|
| `fastapi` | Web framework |
| `uvicorn[standard]` | ASGI server |
| `pydantic-settings` | Typed environment configuration |
| `sqlalchemy` | ORM |
| `alembic` | Migrations |
| `psycopg[binary]` | PostgreSQL driver |
| `pwdlib[argon2]` | Password hashing (only auth crypto dependency) |
| `httpx` | Email provider HTTP calls; FastAPI test client |
| `email-validator` | Pydantic `EmailStr` validation |

### Backend dev

`pytest`, `pytest-cov`, `ruff`, `mypy`

### Frontend runtime (4 packages)

| Package | Purpose |
|---|---|
| `react`, `react-dom` | UI framework |
| `react-router` | Routing + route key registry |
| `@tanstack/react-query` | Server state cache |
| `lucide-react` | Icons |

### Frontend dev

`vite`, `@vitejs/plugin-react`, `typescript`, `eslint`, `typescript-eslint`, `prettier`, `vitest`, `@testing-library/react`

---

## Explicitly rejected technologies

| Rejected | Reason |
|---|---|
| `passlib` | Unmaintained; Python 3.13 incompatible |
| `PyJWT` / `python-jose` | No JWTs — DB sessions |
| `fastapi-users` | Wrong user model; no email-OTP-2FA |
| `slowapi` | Postgres counters sufficient |
| Redis | Nothing needs it |
| Celery / task queues | No background jobs in MVP |
| `supabase-py` | SQLAlchemy direct; zero frontend lock-in |
| Next.js | Second backend surface |
| Docker (local dev) | Solo dev; Render uses buildpack |
| Tailwind / MUI / Chakra | CSS Modules sufficient |
| Redux / Zustand | TanStack Query + React Context |
| `axios` | Native `fetch` sufficient |
| `react-hook-form` | Native forms for now; revisit Section 6 if admin forms grow complex |
| `date-fns` / `moment` | `Intl.DateTimeFormat` built in |
| Gmail SMTP | Not viable for login-critical OTP (C10) |

---

## Estimated cost

| Item | Development | At member launch |
|---|---|---|
| Vercel Hobby | $0 | $0 |
| Render | $0 (cold starts) | **$7/mo recommended** |
| Supabase | $0 (2 projects) | $0 |
| Brevo | $0 (300/day) | $0 |
| Domain | $0 | ~$10–15/year |
| **Total** | **$0** | **~$8/month** |

Spend first on: Render Starter ($7/mo), then offsite database backups.

Domain and DNS: [`12-deployment-architecture.md`](12-deployment-architecture.md) (N4).

---

## What future WebDev members should know

**Adding a dependency:** Document why in this file or an ADR. Ask: can stdlib, Postgres, or existing packages already do this?

**Authentication code:** Small, isolated module. Libraries for crypto (`pwdlib`). Tests mandatory. Never invent algorithms. See [`13-testing-strategy.md`](13-testing-strategy.md).

**Testing stack:** `pytest`, `vitest`, `@testing-library/react` — already in dev dependencies above. Do not add frameworks without ADR.

**Do not swap without ADR:** Session model, password hasher, email provider interface, ORM.

**Argon2 parameters:** Benchmark before locking in. Do not assume 19 MiB is final.

**Local development:** Native Postgres + virtualenv — no Docker. See [`11-local-development-setup.md`](11-local-development-setup.md).

