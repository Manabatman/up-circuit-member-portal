# Open Items Register

Central register of **unresolved decisions, contradictions, and prove-it-early requirements** across Phase 1.

Update this file at the end of every Phase 1 section.

**Legend:** `Open` = not decided | `Resolved` = decided, documented elsewhere | `Prove early` = must be verified during implementation, before relying on it

---

## Phase 0 contradictions (identified during Phase 1)

### C2 — Non-renewed member permissions (⚠️ items)

| Field | Value |
|---|---|
| **Status** | **Resolved** |
| **Resolve in** | Section 5 — Authorization Architecture |
| **Correction history** | An earlier draft misread §0.6.3 as granting full access where §0.6.12 said restricted. **Both tables agree** — Member Directory, Requests, own request history, and flagship projects are all ⚠️ in both §0.6.3 and §0.6.12. Phase 0 explicitly deferred the precise rule: *"The ⚠️ items need a precise rule later. My initial recommendation: If something is specifically intended for active/renewed Circuit members, it should be restricted."* |
| **Resolution** | Applied Phase 0's heuristic per item (see `05-authorization-architecture.md`): |
| | • Member directory → `ANY` (§0.7.15 explicit: both renewed and non-renewed retain access) |
| | • Request directory → `ANY` |
| | • Own request history → `ANY` when built (P1; moot in MVP per C5) |
| | • Flagship → split: project info `ANY`, internal resources `RENEWED` |
| | • Academic Drive → `RENEWED` (§0.6.3 ❌) |
| | • `PENDING` status → fails `RENEWED` gate (same as `NOT_RENEWED`) |
| **Phase 0 refs** | §0.6.3, §0.6.12, §0.7.15 |
| **Documented in** | `05-authorization-architecture.md` |

---

### C3 — Membership status vs admin role interaction

| Field | Value |
|---|---|
| **Status** | **Resolved** |
| **Resolve in** | Section 5 — Authorization Architecture |
| **Description** | A naive union of membership access and role permissions would let an admin role bypass membership restrictions (e.g. a non-renewed Academic Admin viewing Academic Drive). |
| **Approved rule** | **Membership status gates member-facing consumption. Roles grant administrative capability. A role may never satisfy a membership gate.** |
| **Enforcement mechanism** | `permissions.kind` (`member_access` vs `admin_capability`) + `permissions.required_membership` (`ANY` / `RENEWED`). Four-step allow rule in FastAPI `require_permission()` dependency. Step 3 applies regardless of granting role — including `SUPER_ADMIN`. |
| **Example** | A non-renewed Academic Admin may **manage** academic resources (admin job) but may **not browse** Academic Drive as a member until renewed. |
| **Phase 0 refs** | §0.6.1 Rule 2, §0.6.18 Rules 1–2 |
| **Documented in** | `01-system-architecture.md`, `04-database-schema.md`, `05-authorization-architecture.md` |

---

### C4 — Imported members have no password (activation flow)

| Field | Value |
|---|---|
| **Status** | **Resolved** |
| **Decision** | **Emailed single-use activation link** — proves control of UP inbox. Member sets password via `POST /auth/activate`. Staged division-by-division rollout for Brevo daily cap. Enumeration-safe resend via `POST /auth/activate/resend`. |
| **Trust model** | Email-only (approved). Wrong import email → real member contacts admin; mitigated by import preview and staged rollout. |
| **Token** | `auth_tokens.purpose = ACTIVATION`, 7-day expiry, SHA-256 hash, single use |
| **Phase 0 refs** | FR-AUTH-001, FR-MEMBERSHIP-007, §0.9.2, §0.9.3 |
| **Documented in** | `07-authentication-architecture.md`, ADR-026 |

---

### C5 — Request history vs MVP redirect-only requests

| Field | Value |
|---|---|
| **Status** | **Resolved** |
| **Decision** | **Request history is P1, not MVP.** MVP ships the request **directory** with external Google Form redirects only. FR-DASH-006 ("My Requests" on dashboard) is deferred to P1 when native request workflows exist. |
| **Resolve in** | N/A — closed |
| **Phase 0 refs** | FR-REQUEST-003, FR-DASH-006, §0.9.6 |
| **Documented in** | `01-system-architecture.md` |

---

### C6 — Division, committee, position modeled as non-temporal

| Field | Value |
|---|---|
| **Status** | **Resolved** |
| **Decision** | **`membership_terms`** (status per academic year) + **`membership_term_assignments`** (division, committee, position; supports double division via multiple rows with `is_primary`). Stable identity on **`profiles`** only. |
| **Double division** | Option B approved — assignments table |
| **Phase 0 refs** | §0.10.4, §0.10.5, §0.8.12, §0.7.9 |
| **Documented in** | `04-database-schema.md` |

---

### C7 — Database-driven navigation vs React routes

| Field | Value |
|---|---|
| **Status** | **Resolved** |
| **Decision** | Navigation items reference **code-defined route keys**, not free-text paths. React exports a route registry; admin UI offers keys in a dropdown. |
| **Resolve in** | N/A — closed (Section 6 will detail React routing) |
| **Documented in** | `01-system-architecture.md` |

---

### C8 — WEBDEV as application role

| Field | Value |
|---|---|
| **Status** | **Resolved** |
| **Decision** | **No `WEBDEV` role in the database permission model.** WebDev access is infrastructure-only (GitHub, Supabase dashboard, Render, Vercel). Portal admin capabilities require an explicit portal role (e.g. `SUPER_ADMIN`). |
| **Resolve in** | N/A — closed |
| **Phase 0 refs** | §0.5C, §0.6.11, §0.6.12 |
| **Documented in** | `01-system-architecture.md`, `05-authorization-architecture.md` |

---

### C9 — Duplicate `scope` on resources and categories

| Field | Value |
|---|---|
| **Status** | **Resolved** |
| **Decision** | **`resource_categories.scope`** is the single authority. **`resources`** has `category_id NOT NULL` and **no `scope` column**. Flagship resources use separate **`flagship_resources`** table (Tier 3), not `resources`. |
| **Phase 0 refs** | §0.10.12, §0.10.13, §0.10.17 |
| **Documented in** | `04-database-schema.md` |

---

### C10 — Gmail for transactional email

| Field | Value |
|---|---|
| **Status** | **Resolved** |
| **Decision** | **Gmail SMTP rejected.** Brevo behind an `EmailSender` abstraction. SES documented as upgrade path. OTP email is login-critical. |
| **Documented in** | `02-technology-decisions.md` |

---

### C11 — `POST /auth/refresh` vs opaque DB sessions

| Field | Value |
|---|---|
| **Status** | **Resolved** |
| **Decision** | **`POST /api/v1/auth/refresh` is not implemented.** Opaque DB-backed sessions have no refresh token. Session lifetime is `sessions.expires_at`; logout deletes the row. |
| **Phase 0 ref** | §0.11.4 lists refresh — leftover from JWT implication, already rejected in Section 2 |
| **Documented in** | `06-api-architecture.md`, ADR-023 |

---

## New items from Phase 1 (Sections 1–3)

### N1 — Argon2id parameters need Render benchmark

| Field | Value |
|---|---|
| **Status** | Open — **Prove early** |
| **Resolve in** | Before production auth lock-in |
| **Description** | Starting parameters `m=19456, t=2, p=1` are provisional for Render 512 MB RAM. Must not be treated as final without benchmark evidence. |
| **Benchmark protocol** | See `07-authentication-architecture.md` § Password hashing (N1): 10 concurrent logins, p95 ≤ 500 ms, peak RSS ≤ 80% of instance limit, reduce `m` before `t` if fail |
| **Acceptance criteria** | Document final params in ADR-013 with latency and memory evidence |
| **Dependencies** | Render Starter deployment available for benchmark |

---

### N2 — Data Privacy Act / cross-border PII

| Field | Value |
|---|---|
| **Status** | Partially resolved — **organizational sign-off still required** |
| **Schema actions (Section 4)** | Omitted `emergency_contact`; restricted fields documented; audit log PII rules; retention policy; anonymization-on-erasure |
| **Still required** | Circuit leadership informed in writing what data is stored and where; agreement before production import |
| **Documented in** | `03-supabase-architecture.md`, `04-database-schema.md` |

---

### N3 — `pg_dump` via session pooler unverified

| Field | Value |
|---|---|
| **Status** | Open — **Prove early** |
| **Resolve in** | Backup workflow in Section 12 — **prove restore before member import** |
| **Description** | Backup plan uses `pg_dump` through Supavisor session mode (IPv4). Supabase recommends direct connection for dumps, which Render cannot reach on free tier. Must verify dump **and restore** before importing real member data. |
| **Dependencies** | Dev Supabase project, GitHub Actions |

---

### N4 — Custom domain not yet configured

| Field | Value |
|---|---|
| **Status** | Open — **documented in Section 12; purchase deferred** |
| **Resolve in** | Before production member auth go-live |
| **Description** | Architecture assumes custom domain with subdomains (`portal.*` + `api.*`) for same-site HttpOnly cookies. Domain not purchased or DNS configured yet — intentionally deferred. |
| **Dependencies** | Circuit domain decision, DNS access |

---

### N5 — Emergency contact field necessity

| Field | Value |
|---|---|
| **Status** | **Resolved** |
| **Decision** | **`emergency_contact` is not stored** in the portal schema. No portal feature consumes it; third-party PII with no consent. |
| **Phase 0 note** | Deliberate Phase 1 deviation from FR-MEMBER-001 field list for this field only. Membership Division systems retain if needed. |
| **Phase 0 refs** | FR-MEMBER-001, FR-MEMBER-005 |
| **Documented in** | `04-database-schema.md` |

---

## Prove-it-early checklist (from Section 3)

Complete these during early implementation, **before** production member data import:

| # | Test | Status | Blocks |
|---|---|---|---|
| 1 | `pg_dump` + full restore via session pooler into dev project | Not done | Production data import |
| 2 | Render → Supabase session pooler under concurrent load | Not done | Production deploy |
| 3 | Argon2id benchmark on Render (N1) | Not done | Auth parameter lock-in |
| 4 | Data API disabled + `app` schema unreachable via `/rest/v1/` | Not done | Any table creation |
| 5 | Alembic as `circuit_migrator` + app as `circuit_app` grants | Not done | First migration |

---

### N6 — Official seed data (divisions, committees, positions)

| Field | Value |
|---|---|
| **Status** | Open |
| **Resolve in** | Before production seed migration |
| **Description** | Phase 0 §0.10.6 requires official Circuit division naming. Seed data must come from org leadership, not guessed by WebDev. |
| **Phase 0 refs** | §0.10.6, §0.13.3 |

---

### N7 — Batch field format

| Field | Value |
|---|---|
| **Status** | Open |
| **Resolve in** | Before import tool design (Section 7 or import stage) |
| **Description** | `profiles.batch` is immutable but format undefined — year only (`2024`), label (`Batch 2024`), or other? Affects import mapping and directory display. |
| **Phase 0 refs** | FR-MEMBER-001, §0.8.12 |

---

### N8 — Double Division vs Phase 0 single division_id

| Field | Value |
|---|---|
| **Status** | **Resolved** |
| **Description** | Phase 0 §0.10.4 implied one division per profile; §0.7.9 lists Double Division as a request type. Section 4 resolves via assignments table. |
| **Documented in** | `04-database-schema.md` |

---

## New items from Phase 1 (Section 5)

### N9 — Renewal grace period during renewal window

| Field | Value |
|---|---|
| **Status** | Open |
| **Resolve in** | Organizational policy decision (before production launch) |
| **Description** | Phase 0 §0.9.4 transitions membership status at the renewal period boundary but does not define whether last year's `RENEWED` members retain Academic Drive access while actively renewing. Current architecture: status flips to `NOT_RENEWED` when the new academic year begins without renewal — no grace period. |
| **Working direction** | No grace period unless Circuit leadership explicitly approves one (would require a third gate value or time-bounded override). |
| **Phase 0 refs** | §0.9.4, §0.6.3 |

---

### N10 — Per-request-type membership gating

| Field | Value |
|---|---|
| **Status** | Open — deferred to P1 |
| **Resolve in** | P1, if Circuit requires it |
| **Description** | Should individual request types (e.g. Headships Form) be gated by membership status? MVP treats all request types as `ANY` — portal shows redirects; human review is the actual control. |
| **Revisit trigger** | Circuit reports non-renewed members abusing request forms that should be renewed-only. Implementation: add `request_types.required_membership` column. |
| **Phase 0 refs** | §0.6.3 ⚠️ Requests, §0.7.9 |

---

### N11 — Scoped permission model revisit trigger

| Field | Value |
|---|---|
| **Status** | Open — watch condition |
| **Resolve in** | When Circuit adds several more division admin roles |
| **Description** | Section 5 uses explicit permission names per domain (`manage_finance_request_types`) instead of Phase 0 §0.6.14's `(permission, scope)` pairs. Works for current six roles; may not scale. |
| **Revisit trigger** | More than ~3 additional scoped admin roles, or permission name proliferation becomes unmaintainable. |
| **Phase 0 refs** | §0.6.14 |

---

### N12 — Flagship admin per-project assignment

| Field | Value |
|---|---|
| **Status** | Open — P1 |
| **Resolve in** | P1 flagship feature design |
| **Description** | Phase 0 §0.6.15 describes assigning flagship project admins per project/iteration, not globally. Section 5 lists `manage_flagship_projects` as a P1 permission; per-project scoping mechanism not yet designed. |
| **Phase 0 refs** | §0.6.15, §0.7.12 |

---

## New items from Phase 1 (Section 6)

### N13 — Import preview → confirm state

| Field | Value |
|---|---|
| **Status** | Open — resolve during implementation |
| **Resolve in** | Import feature implementation (Section 7 or import stage) |
| **Description** | Section 6 defines `POST /members/import/preview` and `POST /members/import/confirm` as two-step import (§0.7.18). The mechanism linking preview results to confirm (server-side preview ID, short-lived token, or re-upload + re-validate) is not yet specified. |
| **Working direction** | Server stores preview result with expiring ID; confirm references preview ID and re-validates before commit. |
| **Phase 0 refs** | §0.7.18, FR-MEMBERSHIP-007 |

---

## New items from Phase 1 (Section 7)

### N14 — Scheduled cleanup job has no home

| Field | Value |
|---|---|
| **Status** | **Resolved** |
| **Decision** | Daily **GitHub Action** calls authenticated FastAPI maintenance endpoint (`MAINTENANCE_TOKEN` header). Deletes expired `sessions`, `auth_tokens`, aged `auth_attempts` (90d), aged `notifications` (12m). Opportunistic cleanup on write recommended as extra. |
| **Rejected** | Celery, Render cron (MVP), portal RBAC for maintenance |
| **Resolve in** | N/A — closed |
| **Phase 0 refs** | §0.7.17, retention in `04-database-schema.md` |
| **Documented in** | `12-deployment-architecture.md`, ADR-040 |

---

### N15 — Account unlock support path

| Field | Value |
|---|---|
| **Status** | Open — organizational |
| **Resolve in** | Before production launch |
| **Description** | Automatic locks self-expire (15 min), but members may not know why login failed. Who do they contact? Renewals Admin with `manage_members` can clear `locked_until` — confirm this is the intended support path and document for members. |
| **Phase 0 refs** | FR-AUTH-005 |

---

### N16 — OTP email delivery latency (prove early)

| Field | Value |
|---|---|
| **Status** | Open — **Prove early** |
| **Resolve in** | Before production auth go-live |
| **Description** | OTP email is sent **inline** during `POST /auth/login` (no task queue). Response time includes Brevo API call; member waits for email to arrive separately. Must measure real delivery latency and define timeout + user-facing message. |
| **Requirement** | End-to-end test: login → email received; document p95 delivery time; define "resend code" UX threshold |
| **Dependencies** | Brevo account with SPF/DKIM/DMARC configured |

---

## Decisions still requiring explicit approval

These were proposed in Sections 1–3 and are documented as decisions. They are listed here for tracking; approval was given in conversation for Sections 1–3 unless marked otherwise.

| Decision | Section | Approval status |
|---|---|---|
| FastAPI owns authentication entirely | 1, 2 | Approved |
| Opaque DB-backed sessions (not JWT) | 2 | Approved |
| Custom domain for same-site cookies | 1 | Approved (domain purchase deferred) |
| Data API disabled on Supabase | 3 | Approved |
| `app` schema, no RLS | 3 | Approved |
| Supavisor session mode port 5432 | 3 | Approved |
| Local → Dev → Production (no staging) | 3 | Approved |
| Brevo + EmailSender abstraction | 2 | Approved |
| C5: no request history in MVP | 2 | Approved |
| C3: asymmetric membership/role rule + kind enforcement | 5 | Approved |
| Budget ~$7/mo Render Starter before member rollout | 2 | Approved |
| Argon2 params require benchmark before lock-in | 2 | Approved (N1) |
| C6: temporal membership + assignments table | 4 | Approved |
| C9: category scope authority | 4 | Approved |
| C2: non-renewed ⚠️ items resolved | 5 | Approved |
| C2: flagship split (info ANY, resources RENEWED) | 5 | Approved |
| C2: PENDING fails RENEWED gate | 5 | Approved |
| N5: omit emergency_contact | 4 | Approved |
| N8: double division via assignments | 4 | Approved |
| No `/auth/refresh` endpoint | 6 | Approved |
| Same-resource REST (no `/admin` prefix) | 6 | Approved |
| `scope` query param on resources (not `category=academic`) | 6 | Approved |
| Public API uses `/members` not `/users` | 6 | Approved |
| Production OpenAPI disabled | 6 | Approved |
| Four-layer API pipeline (router/service/model/schema) | 6 | Approved |
| C4: activation via emailed single-use link | 7 | Approved |
| Session: sliding 7-day idle, 30-day absolute cap | 7 | Approved |
| SHA-256 for tokens, Argon2 for passwords | 7 | Approved |
| Trusted devices skip OTP (30-day, revocable) | 7 | Approved |
| OTP unless trusted device (FR-AUTH-003 relaxed) | 7 | Approved |
| CORS exact-origin allowlist with credentials | 8 | Approved |
| CSRF: SameSite=Lax + Origin validation (no token library) | 8 | Approved |
| Minimal security headers; HSTS deferred to N4 | 8 | Approved |
| CSP honest MVP default; strict CSP may be P1 (N18) | 8 | Approved |
| Monorepo — one repo for frontend, backend, docs (ADR-033) | 9 | Approved |
| All changes via PR to `main`; no direct push (ADR-034) | 9 | Approved |
| Second-person review required only when ≥2 WebDevs | 9 | Approved |
| Solo WebDev may self-merge after checks pass | 9 | Approved |
| Squash merge as default (ADR-035) | 9 | Approved |
| Officers do not receive GitHub access (C8 reaffirmed) | 9 | Approved |
| GitFlow rejected — `main` + short-lived branches only | 9 | Approved |
| pydantic-settings fail-loud at boot (ADR-036) | 10 | Approved |
| Frontend only `VITE_API_BASE_URL` — no secrets in VITE_* (ADR-037) | 10 | Approved |
| PR preview URLs are not CORS origins (ADR-038) | 10 | Approved |
| `APP_ENV` discriminator (local \| dev \| production) | 10 | Approved |
| Two DB URLs: DATABASE_URL + MIGRATOR_DATABASE_URL | 10 | Approved |
| No SESSION_SECRET / JWT_SECRET / SUPABASE_KEY | 10 | Approved |
| Per-package `.env.example` (backend/ + frontend/) | 10 | Approved |
| Native Postgres local dev — no Docker required (Section 2 reaffirmed) | 11 | Approved |
| Local roles mirror production: circuit_app + circuit_migrator | 11 | Approved |
| Console EmailSender when APP_ENV=local (ADR-039) | 11 | Approved |
| Cookie Secure=false only when APP_ENV=local | 11 | Approved |
| Default local ports: API 8000, Vite 5173 | 11 | Approved |
| Commands documented in Section 11 + maintenance/commands.md index | 11/14 | Approved |
| Vercel/Render git deploy from main — Actions for ops only (ADR-040) | 12 | Approved |
| Encrypted pg_dump to S3-compatible storage — R2 recommended (ADR-041) | 12 | Approved |
| Alembic Pre-Deploy on Render | 12 | Approved |
| N14: GH Action + MAINTENANCE_TOKEN cleanup endpoint | 12 | Approved |
| External keep-warm ping on Render free; Starter before members | 12 | Approved |
| /health without DB check on production | 12 | Approved |
| 14-day backup retention minimum | 12 | Approved |
| GitHub Actions CI on PR — lint, pytest, vitest, migration check (ADR-042) | 13 | Approved |
| Real PostgreSQL test DB — upcircuit_test local, Actions service in CI (ADR-043) | 13 | Approved |
| API/integration as primary automated test layer | 13 | Approved |
| CSRF/CORS/authz automated security tests required for MVP | 13 | Approved |
| E2E browser tests deferred for MVP | 13 | Approved |
| No APP_ENV=test — override DATABASE_URL in pytest | 13 | Approved |
| Coverage diagnostic only — no 100% gate | 13 | Approved |
| AI assists learning; developer writes and runs tests | 13 | Approved |
| Keep docs/architecture/phase-1/ layout — reject Phase 0 numbered tree (ADR-044) | 14 | Approved |
| Two-layer docs: GitHub technical + Google Docs journal (ADR-045) | 14 | Approved |
| Root README, CHANGELOG.md, maintenance/commands.md index | 14 | Approved |
| ADR index only until Phase 1 close — no 45 individual ADR files yet | 14 | **Superseded** — ADR-001–048 written |
| Hybrid docs layer (project/, getting-started/, operations/) | 14 | Approved — ADR-048 |
| Journal not in git; no secrets/PII in docs | 14 | Approved |
| Commands in owning sections; commands.md is index only | 14 | Approved |
| Vertical-slice implementation Phases A-L (ADR-046) | 15 | Approved |
| Learning-first authorship — developer writes/runs code; AI teaches (ADR-047) | 15 | Approved |
| Milestone 0 as first implementation gate | 15 | Approved |
| Tests and security distributed across phases — not only at end | 15 | Approved |
| Frontend after stable API auth/authz contract | 15 | Approved |
| Phase 0 §0.13 stage order refined where Sections 1-14 differ | 15 | Approved |

---

## New items from Phase 1 (Section 8)

### N17 — CORS and security headers prove-early

| Field | Value |
|---|---|
| **Status** | Open — **Prove early** |
| **Resolve in** | After N4 custom domain configured (Section 12) |
| **Description** | Verify CORS preflight and credentialed cross-subdomain requests (`portal.*` → `api.*`) in a real browser. Verify security headers (including HSTS when enabled) on production responses. |
| **Requirement** | Documented test checklist in `08-security-architecture.md` and [`13-testing-strategy.md`](13-testing-strategy.md); run before member rollout |
| **Dependencies** | N4 — custom domain and DNS |

---

### N18 — Strict Content-Security-Policy without unsafe-inline

| Field | Value |
|---|---|
| **Status** | Open — watch at first production build |
| **Resolve in** | P1 if Vite build requires `'unsafe-inline'` for scripts/styles |
| **Description** | MVP ships a honest CSP (`default-src 'self'`, `connect-src` to API). If Vite/React cannot run without `'unsafe-inline'`, document the gap and plan nonce-based CSP for P1 rather than shipping a broken strict policy. |
| **Working direction** | Test CSP on first Vercel production deploy; tighten in P1 if inline required |
| **Phase 0 refs** | §0.7.17 |

---

## New items from Phase 1 (Section 9)

### N19 — GitHub org ownership succession

| Field | Value |
|---|---|
| **Status** | Open — **organizational** |
| **Resolve in** | Before founding WebDev graduates or leaves the org |
| **Description** | Who owns the GitHub organization and repository when the founding WebDev member graduates? Org owner controls billing, branch protection, secrets, and member invites. Without succession planning, the repo can become inaccessible or orphaned. |
| **Working direction** | Transfer org ownership to incoming WebDev lead with documented handoff checklist (Section 9 newcomer checklist + Section 12 deploy access). Include **Vercel, Render, Supabase, Cloudflare R2, Brevo, domain registrar, and Google Docs development journal** — not GitHub alone. |
| **Phase 0 refs** | §0.12.9, §0.6.11, §0.6.12 |

---

## New items from Phase 1 (Section 10)

### N20 — Transactional email sender identity

| Field | Value |
|---|---|
| **Status** | Open — **organizational** |
| **Resolve in** | Before Brevo account setup and first OTP send (Section 12) |
| **Description** | Which email address sends OTP, activation, and password-reset mail (`EMAIL_FROM`)? Must be an address Circuit controls with SPF/DKIM/DMARC configured. Org leadership may prefer a specific domain or shared mailbox. |
| **Working direction** | Dedicated sender such as `portal@{circuit-domain}` or `noreply@{circuit-domain}` — confirm with leadership before production auth go-live. |
| **Phase 0 refs** | §0.12.8, FR-AUTH-003 (OTP delivery) |

---

## Phase 0 → Sections 1–15 consistency review

Performed after Section 15 documentation.

**Phase 1 architecture/planning is complete.** Implementation follows [`15-development-roadmap.md`](15-development-roadmap.md).

### §0.7.17 Security Requirements

| Requirement | Section(s) | Consistent? |
|---|---|---|
| Authenticate securely | 7 | ✓ |
| Hash passwords | 7 | ✓ |
| Secure sessions/tokens | 7 | ✓ |
| Validate API input | 6, 8 | ✓ |
| Backend authorization | 5 | ✓ |
| Protect admin endpoints | 5, 6 | ✓ |
| Protect sensitive member info | 4, 5, 8 | ✓ |
| Avoid unnecessary PII | 4, 5 | ✓ |
| Rate-limit auth | 7 | ✓ |
| Manage secrets | 8 (principles); 10 (catalog) | ✓ |
| Audit logs | 4, 8 | ✓ |
| FastAPI owns business rules | 1, 6 | ✓ |

### §0.13.13 Stage 13 — Testing

| Phase 0 item | Section 13 mapping | Consistent? |
|---|---|---|
| Unit, integration, API, frontend, E2E, manual acceptance | **Confirmed** — layers documented; E2E deferred for MVP | ✓ |
| Prioritize backend API, auth, authz, database tests | **Confirmed** — API/integration is primary automated layer | ✓ |
| Testing not left until the end | **Section 15** — tests from Phase B; Phase I = CI activation | ✓ |
| Critical workflow tests | **Representative integration + manual prove-early** | ✓ |

### §0.13 Development Roadmap (Stages 1–16)

| Phase 0 item | Section 15 mapping | Consistent? |
|---|---|---|
| §0.13.1 Project genesis | **Phase A** + Milestone 0 | ✓ |
| §0.13.2 Backend foundation | **Phase B** | ✓ |
| §0.13.3 Database foundation | **Phase C** — `membership_terms` not `memberships` | ✓ (deviation recorded) |
| §0.13.4 Authentication | **Phase D** | ✓ |
| §0.13.5 React foundation | **Phase G** — after API auth/authz stable | ✓ (deviation recorded) |
| §0.13.6 Frontend ↔ Backend | **Vertical slices** from Milestone 0 | ✓ (deviation recorded) |
| §0.13.7 Core member features | **Phase F + G** | ✓ |
| §0.13.8–9 Admin | **Phase F + G** | ✓ |
| §0.13.10 Notifications | **Phase F** (Tier 1) | ✓ |
| §0.13.11 Flagship | **Deferred** — Tier 3 | ✓ |
| §0.13.12 Data import | **Phase F**; production data after Phase K | ✓ |
| §0.13.13 Testing | **Distributed** — Phase I = CI activation | ✓ (deviation recorded) |
| §0.13.14 Security hardening | **Distributed** — Phase H = verification pass | ✓ (deviation recorded) |
| §0.13.15 Deployment | **Phases J–K** | ✓ |
| §0.13.16 Documentation | **Section 14 + throughout** (ADR-045) | ✓ |
| Vertical slices, not dashboard-first | **Confirmed** — ADR-046 | ✓ |

### §0.13.14 Security Hardening — automated proof

| Phase 0 item | Section 13 mapping | Consistent? |
|---|---|---|
| "Can normal member access admin endpoint?" | **Parameterized authz integration tests** — must fail | ✓ |
| Authentication / authorization / rate limiting | **API integration + unit tests** | ✓ |
| CORS / validation / error handling | **Security test module + error envelope tests** | ✓ |
| Manual production verification | **N17, N3, N4, N20 prove-early checklist** — stays open until infra exists | ✓ |

### §0.13.14 Security Hardening checklist (controls)

| Phase 0 item | Section 8 mapping |
|---|---|
| Authentication | Section 7 |
| Authorization | Section 5 |
| Rate limiting | Section 7 |
| Input validation | Sections 6, 8 |
| CORS | Section 8 — exact origin allowlist |
| Secrets | Section 8 principles; Section 10 catalog |
| Database permissions | Section 3 — `circuit_app` least privilege |
| Error handling | Sections 6, 8 |
| Logging | Section 8 — hygiene rules |
| Audit trails | Section 8 — event list |

**All §0.13.14 items mapped.** No new controls added beyond approved architecture.

### §0.12.9 GitHub Architecture

| Phase 0 item | Section 9 mapping | Consistent? |
|---|---|---|
| Monorepo: frontend/, backend/, docs/, scripts/ | **Confirmed** — ADR-033 | ✓ |
| One repo preferable for team size | **Confirmed** — split repos rejected | ✓ |
| `.gitignore` configured | **Required patterns documented** | ✓ |
| Create GitHub repository | **Documented** in Section 12 bring-up checklist — implementation step | ✓ |
| Phase 0 repo name `circuit-portal` | Workspace uses `upcircuit-portal` — naming only | ✓ (deviation recorded) |

### §0.14 Documentation Architecture

| Phase 0 item | Section 14 mapping | Consistent? |
|---|---|---|
| §0.14.1 Two-layer system (GitHub + Google Docs) | **Confirmed** — ADR-045 | ✓ |
| §0.14.2 GitHub folder tree | **Superseded** — `docs/architecture/phase-1/` live layout (ADR-044) | ✓ (deviation recorded) |
| §0.14.3 Root README | **Created** — thin repo entry point | ✓ |
| §0.14.4 Architecture docs | **Sections 01–03, 07–09, 12** | ✓ |
| §0.14.5 Database docs | **Sections 03–04** | ✓ |
| §0.14.6 API docs | **Section 06** (+ local OpenAPI) | ✓ |
| §0.14.7 Environment docs | **Section 10** | ✓ |
| §0.14.8 Command docs | **`maintenance/commands.md` index** + Sections 9, 11–13 | ✓ |
| §0.14.9 Changelog | **`docs/CHANGELOG.md`** | ✓ |
| §0.14.10 ADRs | **`decisions/README.md` index**; ADR-001–048 written | ✓ |
| §0.14.11–13 Google Docs journal | **Rules in Section 14**; Doc not created in Phase 1 | ✓ |
| §0.14.14 Two layers distinction | **Confirmed** | ✓ |
| §0.13.16 Docs throughout project | **Maintenance rules in Section 14** | ✓ |

### §0.14.2 Documentation Architecture (partial — historical)

| Phase 0 item | Section 9 mapping | Consistent? |
|---|---|---|
| Architecture docs in GitHub | **Confirmed** — `docs/` in monorepo | ✓ |
| Phase 0 nested `docs/00-project-genesis/` layout | **`docs/architecture/phase-1/`** — ADR-044; numbered tree rejected | ✓ (deviation recorded) |
| Google Docs visual journal | **Not in git** — Section 14 rules; creation at implementation | ✓ |

### §0.12.7 Environments

| Phase 0 item | Section 10 mapping | Consistent? |
|---|---|---|
| Development → Staging → Production (conceptual) | **Local → Dev → Production** — staging deferred (ADR-008) | ✓ |
| Architecture leaves room for staging | Documented as deferred; revisit with budget | ✓ |
| Local + Production for MVP | **Local + Dev + Production** — Dev is Supabase #1 | ✓ (enhanced) |

### §0.12.8 Environment Variables

| Phase 0 item | Section 10 mapping | Consistent? |
|---|---|---|
| Secrets never in GitHub | **Confirmed** — `.env` gitignored; dashboards for deployed | ✓ |
| Local `.env` | `backend/.env`, `frontend/.env` | ✓ |
| Production Render/Vercel env | **Confirmed** — Section 10 catalog | ✓ |
| `DATABASE_URL` | **Required** — `circuit_app` via session pooler | ✓ |
| `JWT_SECRET` | **Not used** — opaque DB sessions | ✓ |
| `SUPABASE_URL` / `SUPABASE_KEY` | **Not used** — direct PostgreSQL only | ✓ |
| `EMAIL_API_KEY` | **`BREVO_API_KEY`** — Brevo via EmailSender | ✓ |
| Exact variables during implementation | **Full catalog in Section 10** | ✓ |

### §0.14.7 Environment Documentation

| Phase 0 requirement | Section 10 mapping | Consistent? |
|---|---|---|
| Document vars without secret values | **Full catalog** — purpose, source, environments, required | ✓ |
| Variable / Purpose / Where obtained / Which environment / Required | All columns in catalog tables | ✓ |

### §0.13.1 Stage 1 — Project Genesis (local dev)

| Phase 0 item | Section 11 mapping | Consistent? |
|---|---|---|
| Establish development environment | **Full local setup** — clone, venv, npm, Postgres, `.env` | ✓ |
| Configure environment variables | Section 10 catalog + Section 11 first-run setup | ✓ |
| Configure `.gitignore` | Section 9 | ✓ |
| Initialize frontend / backend | Documented paths; package files at implementation | ✓ (planned) |

### §0.14.8 Command Documentation

| Phase 0 item | Section 11 mapping | Consistent? |
|---|---|---|
| Initial setup commands | **Section 11 newcomer checklist** | ✓ |
| Backend `python -m venv .venv` | **Confirmed** — `backend/.venv` | ✓ |
| Frontend `npm install` / `npm run dev` | **Confirmed** — from `frontend/` | ✓ |
| Database migration commands | **`alembic upgrade head`** documented | ✓ |
| `docs/12-maintenance/commands.md` | **`docs/maintenance/commands.md` index** — full commands in Sections 9, 11–13 | ✓ |

### §0.12.6 Hosting

| Phase 0 item | Section 12 mapping | Consistent? |
|---|---|---|
| GitHub → Vercel + Render + Supabase | **Confirmed** — production topology | ✓ |
| Frontend on Vercel, backend on Render | **Confirmed** — `frontend/` and `backend/` roots | ✓ |
| Render connects to Supabase | **Confirmed** — session pooler :5432 | ✓ |

### §0.13.15 Stage 15 — Deployment

| Phase 0 item | Section 12 mapping | Consistent? |
|---|---|---|
| Local → production-like testing | Local (11) + Dev Supabase; merge to `main` deploys | ✓ |
| Vercel → Render → Supabase → Domain | **Auto-deploy from `main`**; domain N4 deferred | ✓ |
| Monitoring | **Minimal** — health ping + platform logs | ✓ |

### Cross-section checks (Sections 1–15)

| Check | Result |
|---|---|
| No JWT / refresh / Bearer | ✓ |
| No second authz mechanism (RLS, API keys) | ✓ |
| CSRF + CORS consistent with Section 2 cookie decision | ✓ |
| Production OpenAPI off (Section 6) | ✓ |
| SSRF N/A — no URL fetching | ✓ documented |
| Phase 0 `SUPABASE_KEY` / `JWT_SECRET` unused | ✓ deviations table |
| Alembic migrations in git (Section 3 + 9) | ✓ |
| Alembic Pre-Deploy on Render (Section 3 + 12) | ✓ |
| Migration test in CI (Section 13 + ADR-042) | ✓ |
| `.env` / secrets never in git (Section 8 + 9) | ✓ |
| Officers ≠ GitHub access (C8, Section 9) | ✓ |
| WebDev infrastructure access separate from portal roles | ✓ |
| Secret catalog complete (Section 8 pointer) | ✓ |
| No secrets in VITE_* (Section 8 + 10) | ✓ |
| Two DB roles / two URLs (Section 3 + 10) | ✓ |
| CORS Dev origin resolved — localhost when laptop → Dev DB (ADR-038) | ✓ |
| No SESSION_SECRET (Section 7 opaque sessions + 10) | ✓ |
| Local setup documented (Section 11) | ✓ |
| Local cookie Secure=false exception (Section 7/8 + 11) | ✓ |
| Console EmailSender for local OTP (ADR-039) | ✓ |
| No Docker required for local/dev/deploy (Section 2 + 11 + 12) | ✓ |
| Test DB uses real PostgreSQL, not SQLite (ADR-043) | ✓ |
| Tests never target Production/Dev Supabase (Section 13) | ✓ |
| GitHub Actions: CI (13) + ops (12); CD stays Vercel/Render (ADR-040) | ✓ |
| Production DB never on laptop for daily work (Section 10 + 11) | ✓ |
| Deploy from `main` only (Section 9 + 12) | ✓ |
| Backups encrypted offsite — R2 recommended (Section 3 + 12, ADR-041) | ✓ |
| N14 cleanup resolved — GH Action + token (Section 12) | ✓ |
| Backup destination no longer TBD | ✓ |
| `/health` no DB check (Section 6 + 12) | ✓ |
| Singapore region Render + Supabase (Section 3 + 12) | ✓ |
| SUPER_ADMIN permission completeness test (Section 5 + 13) | ✓ |
| No APP_ENV=test (Section 10 + 13) | ✓ |
| Docs layout ADR-044 — no duplicate numbered tree | ✓ |
| Two-layer docs GitHub + Google Docs (ADR-045) | ✓ |
| Changelog + command index exist | ✓ |
| Journal not in git; no PII in docs | ✓ |
| Implementation order documented (ADR-046) | ✓ |
| Learning-first authorship model (ADR-047) | ✓ |
| Milestone 0 defined as first gate | ✓ |
| Open items carried forward — none silently closed | ✓ |

### Contradictions found

**None** between Phase 0 §0.7.17, §0.12.6, §0.12.7, §0.12.8, §0.12.9, §0.13.1–§0.13.16, §0.14.1–§0.14.14, §0.14.7, §0.14.8 and Sections 1–15.

### Remaining unresolved

| Item | Status |
|---|---|
| N1 — Argon2 benchmark | Open — prove early |
| N2 — leadership PII sign-off | Open — organizational |
| N3 — pg_dump via pooler restore drill | Open — prove early |
| N4 — custom domain purchase/DNS | Open — documented; purchase deferred |
| N6 — official seed data | Open |
| N7 — batch field format | Open |
| N9 — renewal grace period | Open — org policy |
| N10 — per-request-type gating | Open — P1 |
| N11 — scoped permission revisit | Open — watch |
| N12 — flagship admin assignment | Open — P1 |
| N13 — import preview state | Open — implementation |
| N15 — unlock support path | Open — organizational |
| N16 — OTP delivery latency | Open — prove early |
| N17 — CORS/headers prove-early | Open — after N4 |
| N18 — strict CSP | Open — watch at prod build |
| N19 — infrastructure succession | Open — organizational |
| N20 — email sender identity | Open — organizational |

---

*Last updated: after Phase 1 Section 15 documentation. **Phase 1 architecture/planning complete.***
