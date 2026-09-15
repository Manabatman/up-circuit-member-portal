# Environment Management

This document defines **how configuration is organized** across Local, Dev, and Production — what environment variables exist, where their values live, and how the backend and frontend load them safely.

**Prerequisites:** Read [`03-supabase-architecture.md`](03-supabase-architecture.md) (environment model, database roles) and [`08-security-architecture.md`](08-security-architecture.md) (secrets never in git).

**Phase 0 reference:** §0.12.7 (environments), §0.12.8 (environment variables), §0.14.7 (document each variable without secret values)

---

## What is an environment?

An **environment** is the same application code running with **different configuration values**.

| Analogy | In this project |
|---|---|
| A recipe is the same; the kitchen changes | FastAPI + React code is identical in git |
| Ingredients differ by kitchen | `DATABASE_URL`, API keys, origins differ by environment |
| You don't rewrite the recipe for each kitchen | You don't branch code per environment — only values change |

Changing `DATABASE_URL` from local Postgres to Supabase Dev does **not** change business rules, permissions, or API shapes. It only changes **which database** the backend connects to.

**What environments are not:**

- Separate git branches (Section 9 — one `main`, env vars distinguish runtime)
- Separate frontend/backend repos (Section 9 — monorepo)
- A reason to commit secrets "because it's only Dev"

---

## The three environments (ADR-008)

Phase 0 §0.12.7 described Development → Staging → Production. **Cost constraints** narrowed this to three operational environments (Section 3):

```mermaid
flowchart TB
    Local["Local: laptop Postgres + Vite + FastAPI"]
    Dev["Dev: Supabase project 1 — fake data only"]
    Prod["Production: Supabase project 2 — real members"]
    Local -->|"migrations proven locally"| Dev
    Dev -->|"migration promoted after verification"| Prod
```

| Environment | Database | Data | Typical use |
|---|---|---|---|
| **Local** | PostgreSQL on your machine | Disposable seed data | Daily development, offline work |
| **Dev** | Supabase project #1 | Fake / anonymized only | Integration testing, shared WebDev testing |
| **Production** | Supabase project #2 | Real member PII | Live portal after launch |

### What each layer provides

| Layer | Local | Dev | Production |
|---|---|---|---|
| **Git branch** | Any feature branch / `main` | `main` after merge | `main` |
| **Backend host** | Your laptop (`uvicorn`) | Render ([`12-deployment-architecture.md`](12-deployment-architecture.md)) | Render |
| **Frontend host** | Vite dev server | Vercel ([`12-deployment-architecture.md`](12-deployment-architecture.md)) | Vercel |
| **Database** | localhost Postgres | Supabase #1 | Supabase #2 |

### Dedicated staging — deferred

A fourth environment (second Render service + third Supabase project) would mirror production for pre-release testing. **Rejected for MVP** because:

- Supabase free tier: 2 projects only (Dev + Production)
- Render free tier: 750 instance-hours/month — cannot keep prod + staging warm

Local + Dev cover migration testing. Revisit staging if budget allows (Section 3).

### Honest note: "Dev" often means local laptop → Dev database

Until a deployed Dev frontend exists, **Dev** frequently means:

- FastAPI and Vite running **on your laptop**
- `APP_ENV=dev`
- `DATABASE_URL` pointing at Supabase project #1
- `FRONTEND_ORIGIN=http://localhost:5173`

That is **allowed and expected** early on. What is **not** allowed: putting the **Production** `DATABASE_URL` in a laptop `.env` for casual development.

---

## Where configuration values live

Secrets and environment-specific values **never go in git**. They live in host-specific stores.

| Environment | Backend values | Frontend values |
|---|---|---|
| **Local** | `backend/.env` (gitignored) | `frontend/.env` (gitignored) |
| **Dev (deployed)** | Render dashboard → Environment | Vercel dashboard → Environment Variables |
| **Production** | Render dashboard → Environment | Vercel dashboard → Environment Variables |

### Committed templates (names only)

| File | Package | Loaded by |
|---|---|---|
| `backend/.env.example` | FastAPI | `pydantic-settings` at boot |
| `frontend/.env.example` | React + Vite | Vite at build/dev time |

**There is no root `.env.example`.** Vite only reads from `frontend/`; FastAPI only from `backend/`. Copy each example to `.env` in the same directory.

### Where to obtain values

| Source | What you get |
|---|---|
| **WebDev lead** | Local dev values, Brevo key for testing, guidance |
| **Supabase dashboard** | Connection strings for Dev and Production projects |
| **Brevo dashboard** | API key, verified sender domain |
| **Render / Vercel dashboards** | Set values for deployed Dev and Production |

Never paste secret **values** into architecture docs, GitHub issues, or chat. Document **names and purpose** only.

---

## How the backend loads configuration

**Decision (ADR-036):** Use `pydantic-settings` `BaseSettings` — typed fields, validated at process start.

### Fail-loud at boot

If a **required** variable is missing or empty, the FastAPI process **refuses to start**. This is intentional:

| Fail-loud | Fail-silent (rejected) |
|---|---|
| Missing `DATABASE_URL` → crash immediately | Missing `DATABASE_URL` → API starts, 500 on every request |
| Developer fixes `.env` before coding | Bug discovered during member login |

### Rules

| Rule | Detail |
|---|---|
| **One settings object** | Single `Settings` class loaded once at import |
| **Typed fields** | `APP_ENV: Literal["local", "dev", "production"]`, not raw strings everywhere |
| **No ad hoc `os.environ`** | Handlers do not read env vars directly — use injected settings |
| **Ignore unknown vars** | Extra keys in `.env` do not crash the app |

### Example shape (illustrative — not implementation)

```python
# Conceptual — actual code comes in implementation
class Settings(BaseSettings):
    app_env: Literal["local", "dev", "production"]
    database_url: PostgresDsn
    migrator_database_url: PostgresDsn
    frontend_origin: AnyHttpUrl
    brevo_api_key: SecretStr
    email_from: EmailStr

    model_config = SettingsConfigDict(env_file=".env")
```

---

## Frontend vs backend split (critical)

### The `VITE_` prefix rule (ADR-037)

Vite **bakes** any `VITE_*` variable into the **public JavaScript bundle** at build time. Every member who loads the portal can read these values in browser devtools.

| Allowed in frontend | Forbidden in frontend |
|---|---|
| `VITE_API_BASE_URL` — public API origin | `VITE_DATABASE_URL` |
| | `VITE_BREVO_API_KEY` |
| | Any secret, API key, or DB credential |

**Rule:** The frontend knows **where to call the API**. It never knows **how to reach the database** or **how to send email**.

### How the frontend uses `VITE_API_BASE_URL`

```typescript
// Conceptual — built into bundle, visible to everyone
const API_BASE = import.meta.env.VITE_API_BASE_URL;
fetch(`${API_BASE}/api/v1/resources`, { credentials: "include" });
```

| Environment | Typical value |
|---|---|
| Local | `http://localhost:8000` |
| Production | `https://api.{domain}` |

This is **not secret** — the API URL is public. Security comes from session cookies + CORS + authorization, not from hiding the API hostname.

---

## `APP_ENV` — one discriminator

Instead of many boolean flags (`DEBUG`, `ENABLE_DOCS`, `COOKIE_SECURE`), use **`APP_ENV`** with three values: `local`, `dev`, `production`.

### Derived behavior

| Setting | `local` | `dev` | `production` |
|---|---|---|---|
| Cookie `Secure` | `false` | `false` if laptop → Dev DB; `true` if served over HTTPS | `true` |
| OpenAPI `/api/docs` | **on** | **on** | **off** (Section 6) |
| HSTS header | off | off | deferred until N4 (custom domain) |
| Typical `FRONTEND_ORIGIN` | `http://localhost:5173` | `http://localhost:5173` or future dev subdomain | `https://portal.{domain}` |

**Why one knob:** Prevents contradictory config (`DEBUG=true` in production). Code branches on `app_env`, not scattered env flags.

---

## Vercel PR previews and CORS (ADR-038)

Section 9 requires PRs for every change — Vercel creates a **unique preview URL** per PR (e.g. `upcircuit-portal-abc123.vercel.app`).

Section 8 requires **exact-origin** CORS with credentials — not wildcards.

### The conflict

| If we… | Result |
|---|---|
| Add `*.vercel.app` to CORS | Effectively allows any Vercel site to make credentialed API calls — weakens Section 8 |
| Dynamically echo request Origin | Same vulnerability — attacker domain accepted |
| Add every preview URL manually | Unmaintainable; new URL per PR |

### The rule

**PR preview deploys are for static UI review only** — layout, routing, copy, styling.

| PR preview | Allowed | Not allowed |
|---|---|---|
| Visual review of React pages | ✓ | |
| Credentialed login against Production API | | ✗ |
| Credentialed login against Dev API | | ✗ |
| Adding preview URLs to `FRONTEND_ORIGIN` | | ✗ |

**Where to test login and API flows:**

1. **Local** — laptop FastAPI + Vite ([`11-local-development-setup.md`](11-local-development-setup.md))
2. **Production** — after merge to `main` ([`12-deployment-architecture.md`](12-deployment-architecture.md))

This preserves Section 9's "review UI before merge" without weakening CORS.

---

## Full variable catalog

Phase 0 §0.14.7 requires: purpose, where obtained, which environments, whether required. **Values are never documented here.**

### Backend variables

#### Required

| Variable | Purpose | Where obtained | Environments | Required |
|---|---|---|---|---|
| `APP_ENV` | Environment discriminator (`local` \| `dev` \| `production`) | Set manually per deployment | All | **Yes** |
| `DATABASE_URL` | Runtime DB connection for `circuit_app` role via session pooler :5432 (or local Postgres) | Supabase dashboard (Dev/Prod) or local install | All | **Yes** |
| `MIGRATOR_DATABASE_URL` | Alembic migrations as `circuit_migrator` role; same host, different credentials | Supabase dashboard — separate role password | All (same URL locally with migrator role) | **Yes** |
| `FRONTEND_ORIGIN` | Single exact origin for CORS allowlist and CSRF Origin validation | `http://localhost:5173` locally; `https://portal.{domain}` in production (N4) | All | **Yes** |
| `BREVO_API_KEY` | EmailSender — OTP, activation, password reset | Brevo dashboard | All | **Yes** |
| `EMAIL_FROM` | Verified sender address (e.g. `portal@upcircuit.org`) | Brevo + org decision on which address | All | **Yes** |
| `MAINTENANCE_TOKEN` | Shared secret for infrastructure cleanup endpoint (GitHub Action → FastAPI); not portal RBAC | Generate random secret; set in Render + GitHub Actions secrets | Dev / Production deployed | **Yes** when cleanup Action enabled |

#### Database URL rules

| Rule | Detail |
|---|---|
| **`DATABASE_URL` uses `circuit_app`** | DML only on `app` schema — least privilege (Section 3) |
| **`MIGRATOR_DATABASE_URL` uses `circuit_migrator`** | DDL only — never used by running FastAPI |
| **Never `postgres` superuser for app runtime** | Superuser bypasses role grants |
| **Session pooler port 5432** | IPv4-compatible from Render (Section 3) |
| **Local uses localhost** | `postgresql://user:pass@localhost:5432/upcircuit_local` |

See [`03-supabase-architecture.md`](03-supabase-architecture.md) for connection string format and role setup.

#### Not used — Phase 0 leftovers (do not add)

| Variable | Why rejected |
|---|---|
| `JWT_SECRET` | No JWTs — opaque DB sessions (Section 2, 7) |
| `SUPABASE_KEY` / anon key | No Supabase client in app |
| `SUPABASE_URL` (REST) | Direct PostgreSQL via `DATABASE_URL` only |
| `SESSION_SECRET` | Session tokens are random opaque values stored hashed — **not signed**. No server-side signing secret needed |

### Frontend variables

#### Required

| Variable | Purpose | Where obtained | Environments | Required |
|---|---|---|---|---|
| `VITE_API_BASE_URL` | Public API origin for all `fetch` calls | `http://localhost:8000` local; `https://api.{domain}` production | All | **Yes** |

#### Forbidden (never add)

| Pattern | Why |
|---|---|
| `VITE_DATABASE_URL` | DB credentials in public JS bundle |
| `VITE_BREVO_*` | API keys in public JS bundle |
| Any `VITE_` secret | Vite exposes all `VITE_*` to every browser |

### Not environment variables (keep in code)

| Setting | Why not env |
|---|---|
| Argon2 parameters (`m`, `t`, `p`) | N1 benchmark locks values in ADR-013; laptop `.env` bump to 64 MiB OOMs Render |
| Session idle timeout (7 days) | Section 7 policy — changing without review risks security |
| Session absolute cap (30 days) | Section 7 policy |
| OTP length, expiry | Section 7 policy |
| Rate limit thresholds | Section 7 policy |

Expose these as env vars only with an ADR and evidence (e.g. N1 for Argon2 after Render benchmark).

---

## Example files (committed — names only)

### `backend/.env.example`

```env
APP_ENV=local
DATABASE_URL=postgresql://circuit_app:PASSWORD@localhost:5432/upcircuit_local
MIGRATOR_DATABASE_URL=postgresql://circuit_migrator:PASSWORD@localhost:5432/upcircuit_local
FRONTEND_ORIGIN=http://localhost:5173
BREVO_API_KEY=
EMAIL_FROM=portal@example.org
MAINTENANCE_TOKEN=
```

### `frontend/.env.example`

```env
VITE_API_BASE_URL=http://localhost:8000
```

Copy to `.env` in the same directory. Fill values from WebDev lead or dashboards. **Never commit `.env`.**

---

## Fail-loud, rotation, and leak response

Recap from Section 8 — operational rules for secrets:

| Event | Action |
|---|---|
| **Missing required var at boot** | Process exits — fix config before continuing |
| **Secret committed to git** | Rotate immediately; assume compromised if pushed |
| **`DATABASE_URL` leaked** | Rotate password in Supabase; update Render env; redeploy; **invalidate all sessions** |
| **`BREVO_API_KEY` leaked** | Regenerate in Brevo dashboard; update Render; redeploy |
| **Value in chat / issue / doc** | Rotate; treat as compromised |

Rotation means: new value in dashboard → redeploy affected service. Git history is not enough — the old value may already be copied.

---

## Who may access configuration dashboards

| Actor | GitHub | Render / Vercel env | Supabase dashboard | Brevo |
|---|---|---|---|---|
| **WebDev member** | ✓ | ✓ (as granted) | ✓ | ✓ |
| **Portal Super Admin** | **No** (C8) | **No** | **No** | **No** |
| **Portal officer** | **No** | **No** | **No** | **No** |
| **Member** | **No** | **No** | **No** | **No** |

Changing portal content (Google Form URL, resource title) is an **admin UI action**, not an environment variable change. Officers do not need infrastructure access "to be helpful."

**N19 (GitHub org succession)** includes Render, Vercel, Supabase, and Brevo dashboard ownership — not GitHub alone.

---

## Practice classification

### Required rules

| Rule |
|---|
| Three environments: Local, Dev (Supabase #1), Production (Supabase #2) |
| Secrets never in git — `.env` gitignored (Section 9) |
| `backend/.env.example` and `frontend/.env.example` committed — names only |
| Backend: `pydantic-settings`, fail-loud on missing required vars |
| Frontend: only `VITE_API_BASE_URL` — no secrets in `VITE_*` |
| `DATABASE_URL` for `circuit_app`; `MIGRATOR_DATABASE_URL` for `circuit_migrator` |
| `FRONTEND_ORIGIN` — one exact origin, not wildcard or preview URLs |
| Production OpenAPI off; Local/Dev on (Section 6) |
| No `JWT_SECRET`, `SESSION_SECRET`, `SUPABASE_KEY` |

### Recommended practices

| Practice |
|---|
| Use `APP_ENV` instead of scattered debug flags |
| Document new vars in this catalog before adding to code |
| Separate `.env` per package — no monorepo root `.env` |
| Never store Production `DATABASE_URL` on laptop for daily work |
| Rotate secrets after any suspected leak |

### Optional practices

| Practice |
|---|
| `.env.local` override pattern (if tooling supports) |
| Different Brevo sub-accounts for Dev vs Production email |

### Explicitly rejected

| Practice | Why rejected |
|---|---|
| Secrets in git "just for Dev" | Dev keys grant real access; git history is forever |
| `VITE_` prefix on secrets | Baked into public JS bundle |
| Wildcard or `*.vercel.app` CORS for PR previews | Weakens Section 8 session protection (ADR-038) |
| Production DB URL on developer laptops | PII exposure risk; use Dev project |
| `SESSION_SECRET` / JWT signing | Opaque DB sessions — no signing (Section 7) |
| `postgres` superuser for app runtime | Bypasses least-privilege roles |
| Many boolean env flags instead of `APP_ENV` | Contradictory config risk |
| dotenv libraries beyond pydantic-settings + Vite built-in | Unnecessary dependencies |

### Deferred to later sections

| Topic | Section |
|---|---|
| Render/Vercel project creation and env var UI | [`12-deployment-architecture.md`](12-deployment-architecture.md) |
| Local Postgres install and first `.env` setup | [`11-local-development-setup.md`](11-local-development-setup.md) |
| CI/CD secrets (GitHub Actions) | [`13-testing-strategy.md`](13-testing-strategy.md) — CI uses Postgres service container; ops secrets in Section 12 |
| SPF/DKIM/DMARC DNS for `EMAIL_FROM` | [`12-deployment-architecture.md`](12-deployment-architecture.md) |
| Production `FRONTEND_ORIGIN` value (domain) | N4 / [`12-deployment-architecture.md`](12-deployment-architecture.md) |

---

## Newcomer checklist

When configuring environments for the first time:

1. **Read** this document and [`03-supabase-architecture.md`](03-supabase-architecture.md).
2. **Copy** `backend/.env.example` → `backend/.env` and `frontend/.env.example` → `frontend/.env`.
3. **Get values** from WebDev lead — never from git, docs, or old chat logs.
4. **Set** `APP_ENV=local` and local `DATABASE_URL` for first run ([`11-local-development-setup.md`](11-local-development-setup.md)).
5. **Never commit** `.env` files — verify with `git status` before every commit.
6. **Never add** `VITE_` secrets — only `VITE_API_BASE_URL`.
7. **Do not** point PR preview URLs at Production API for login testing.
8. **Ask** if unsure whether a value belongs in backend or frontend env.

You should configure Local safely **without needing the conversation where these rules were decided**.

---

## Mapping Phase 0 §0.12.7, §0.12.8, §0.14.7

| Phase 0 item | Section 10 decision |
|---|---|
| §0.12.7 three environments | **Local → Dev → Production** (staging deferred) — ADR-008 |
| §0.12.8 secrets not in GitHub | **Confirmed** — Render/Vercel dashboards + local `.env` |
| §0.12.8 example vars (`DATABASE_URL`, `JWT_SECRET`, …) | **Catalog complete** — JWT/Supabase/SESSION rejected |
| §0.14.7 document vars without values | **This catalog** — purpose, source, environments, required |
| Local `.env` | `backend/.env`, `frontend/.env` |
| Production secrets | Render + Vercel dashboards |

---

## Related documents

| Topic | Document |
|---|---|
| Database roles and pooler | `03-supabase-architecture.md` |
| Secrets principles | `08-security-architecture.md` |
| CORS and CSRF origins | `08-security-architecture.md` |
| Session cookies (no JWT) | `07-authentication-architecture.md` |
| OpenAPI policy | `06-api-architecture.md` |
| `.gitignore` and `.env.example` | `09-git-github-strategy.md` |
| Local setup steps | [`11-local-development-setup.md`](11-local-development-setup.md) |
| Deploy env var wiring | [`12-deployment-architecture.md`](12-deployment-architecture.md) |
| Testing strategy and CI | [`13-testing-strategy.md`](13-testing-strategy.md) |
| Documentation system | [`14-documentation-system.md`](14-documentation-system.md) |
| Development roadmap | [`15-development-roadmap.md`](15-development-roadmap.md) |

---

## Do not change without ADR

- Local → Dev → Production model (no silent fourth staging environment)
- Fail-loud required vars via pydantic-settings
- No secrets in `VITE_*` variables
- Single exact `FRONTEND_ORIGIN` (no wildcards, no PR preview origins)
- Two database URLs: `DATABASE_URL` (app) and `MIGRATOR_DATABASE_URL` (migrations)
- No `JWT_SECRET`, `SESSION_SECRET`, or `SUPABASE_KEY`
- Production OpenAPI disabled

---

*Section 10 complete. Section 15 documents the development roadmap.*
