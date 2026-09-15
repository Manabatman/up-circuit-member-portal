# Supabase Architecture

This document explains **how the UP Circuit Member Portal uses Supabase** — what we use, what we ignore, how we connect, secure, migrate, and back up the database.

**Phase 0 reference:** §0.10.27–0.10.31, §0.12.4, §0.12.7

---

## What is Supabase?

Supabase is a hosted platform built around **PostgreSQL**. It also offers optional features: authentication, auto-generated REST API, file storage, realtime subscriptions, and edge functions.

**For this project, Supabase is managed PostgreSQL plus a web dashboard.** We do not use the platform features.

---

## What we use vs what we ignore

| Supabase feature | Used? | Notes |
|---|---|---|
| **PostgreSQL** | **Yes** | All application data |
| **Dashboard / SQL editor** | **Yes** | Debugging, manual inspection |
| **Connection pooler (Supavisor)** | **Yes** | Session mode, port 5432 |
| **Storage** | No (deferred) | Profile photos later — §0.10.27 |
| **Auth** | **No** | FastAPI owns authentication |
| **Data API (PostgREST)** | **Disabled** | Browser never talks to Supabase |
| **Realtime** | No | Not needed |
| **Edge Functions** | No | Not needed |

**Why this matters:** Using only PostgreSQL means **near-zero vendor lock-in**. The app connects via standard SQL through SQLAlchemy. Moving to Neon, RDS, or self-hosted Postgres = `pg_dump`, restore, change `DATABASE_URL`.

**Phase 0 ref:** §0.10.27

---

## Disable the Data API

### What is the Data API?

Supabase automatically generates a **public REST API** (PostgREST) for every table in exposed schemas (default: `public`). A table `profiles` becomes reachable at `/rest/v1/profiles` with full CRUD — without you writing any code.

By default, new tables grant `SELECT`, `INSERT`, `UPDATE`, `DELETE` to the `anon` role. The anon key is **designed to be public** (it ships in frontend bundles).

**Result:** A table in `public` without Row Level Security is **readable and writable by anyone on the internet** who knows the project URL.

### Our decision

**Decision:** Disable the Data API entirely on both Supabase projects, before creating any tables.

**Path:** Project Settings → Integrations → Data API → **Enable Data API: OFF**

**Effect:** No auto-generated REST endpoints respond, regardless of grants or RLS.

**Why we can do this:** Section 1 established the browser never holds a Supabase credential. All data flows through FastAPI. We have no use for PostgREST.

**Action required:** Verify after setup by curling `/rest/v1/` with the anon key — must return nothing useful.

See [ADR-004](decisions/ADR-004-disable-supabase-data-api.md).

---

## Dedicated `app` schema

### What is a schema?

In PostgreSQL, a **schema** is a namespace that groups tables. The default schema is `public`. Supabase's Data API exposes configured schemas to the internet.

### Decision

**All portal tables live in the `app` schema, not `public`.**

**Why:**

1. Defense in depth — if someone re-enables the Data API, `public` is empty
2. Clear separation between Supabase defaults and application data
3. Aligns with Supabase's own hardening guidance (custom schema isolation)

**Additional step:** Explicitly `REVOKE ALL` on `app` from `anon` and `authenticated` roles. Supabase default grants do not remove themselves when RLS is added — explicit revocation makes intent auditable in migration files.

See [ADR-005](decisions/ADR-005-dedicated-app-schema-not-public.md).

---

## Database roles (least privilege)

**What are database roles?** PostgreSQL identities with specific privileges. Each connection authenticates as a role.

### Three roles

| Role | Used by | Privileges |
|---|---|---|
| `postgres` | Humans via Supabase dashboard | Everything. **Never in application config.** |
| `circuit_migrator` | Alembic migrations only | Owns `app` schema. DDL: CREATE, ALTER, DROP. |
| `circuit_app` | FastAPI at runtime | DML only: SELECT, INSERT, UPDATE, DELETE on `app` tables. **No DDL. No DROP. No TRUNCATE.** |

### Why separate roles?

If a SQL injection bug bypasses parameterization, the attacker inherits `circuit_app` privileges — can read/modify rows, but **cannot drop tables, alter schema, or truncate audit logs**. An audit trail an attacker can erase is worse than no audit trail.

`circuit_app` also gets a `statement_timeout` to prevent one query from monopolizing shared free-tier CPU.

---

## Row Level Security (RLS) — decision reversal

This section documents an **architectural reversal**. The reasoning must be preserved for future maintainers.

### Previous recommendation (Section 1, early discussion)

> Enable RLS as "defense in depth" — belt and suspenders alongside FastAPI authorization.

### New evidence (Section 3 research)

1. **RLS is designed for a different architecture** — where the browser talks directly to Postgres and RLS is the *only* authorization layer. Our architecture has FastAPI as the sole enforcement point.

2. **With Data API disabled and tables in `app` schema**, there is no public door for RLS to guard.

3. **RLS with our role model requires permissive policies on every table** — `circuit_app` does not own tables (`circuit_migrator` does). Without `FOR ALL TO circuit_app USING (true)` on each table, the app reads zero rows.

4. **A policy of `USING (true)` provides no security** — it is theater that costs maintenance.

5. **RLS creates a second authorization system** — contradicts Section 1 Rule C (business rules in exactly one layer). Future debugging requires checking FastAPI dependencies *and* Postgres policies in two languages.

### Revised decision

**Decision:** Do **not** use RLS.

**Primary controls instead:**

- Data API disabled
- Tables in non-exposed `app` schema
- Explicit grant revocation from `anon` / `authenticated`
- Least-privilege `circuit_app` role
- All authorization in FastAPI

### Revisit triggers

Re-enable RLS evaluation if **any** of these become true:

- Data API is re-enabled
- Any client other than FastAPI connects to the database
- `supabase-js` appears in the frontend
- A third party is given direct database access

Document any revisit as a new ADR.

See [ADR-006](decisions/ADR-006-do-not-use-row-level-security-rls.md).

---

## Connection architecture

### The IPv4 problem

Supabase's **direct connection** (`db.[ref].supabase.co:5432`) is **IPv6-only** on the free tier.

**Render is IPv4-only** (Supabase documents this explicitly, alongside Vercel and GitHub Actions).

Therefore the direct connection string **cannot work** from Render without the paid IPv4 add-on.

### Decision: Supavisor session mode, port 5432

**What is Supavisor?** Supabase's connection pooler. It sits between the application and PostgreSQL, managing connections efficiently.

**What is session mode?** Each client gets a dedicated PostgreSQL connection for the duration of its session. Supports prepared statements, `LISTEN/NOTIFY`, and standard SQLAlchemy behavior.

| Mode | Port | IPv4? | Prepared statements? | Best for |
|---|---|---|---|---|
| Direct | 5432 | IPv6 only (free) | Yes | Migrations from IPv6 networks |
| **Session pooler** | **5432** | **Yes** | **Yes** | **Our persistent Render backend** |
| Transaction pooler | 6543 | Yes | **No** | Serverless / edge functions |

**Why not transaction mode (6543)?** SQLAlchemy uses prepared statements by default. Transaction mode does not support them — causes `prepared statement does not exist` errors under load. Session mode avoids this entirely.

**Why session mode fits us:** Section 2 chose a persistent synchronous backend (not serverless). Supabase's own docs recommend session mode for "persistent clients on IPv4-only networks."

See [ADR-007](decisions/ADR-007-supavisor-session-mode-port-5432.md).

### Connection pool sizing

Session mode assigns dedicated connections — do not open too many.

**Recommended SQLAlchemy settings:**

```
pool_size = 5
max_overflow = 5
pool_pre_ping = True    # detect dead connections after idle timeout
pool_recycle = < below upstream idle timeout
```

At ~50 concurrent users with millisecond queries, 10 connections is ample. The risk is exhaustion, not throughput.

---

## Environment model: Local → Dev → Production

### Why not Development → Staging → Production?

Phase 0 §0.12.7 described three environments. Cost constraints change the plan:

| Constraint | Effect |
|---|---|
| Supabase free: 2 active projects | Dev + Production only |
| Render free: 750 instance-hours/month | Cannot keep prod + staging warm |
| Staging purpose = test migrations safely | Local + Dev cover this |

### Three environments

```
┌─────────────────────────────────────────────────────────┐
│  LOCAL                                                   │
│  PostgreSQL on your machine                              │
│  Fast, offline, destructible                             │
│  Match PostgreSQL major version to Supabase              │
└───────────────────────────┬─────────────────────────────┘
                            │ migrations tested here first
                            ▼
┌─────────────────────────────────────────────────────────┐
│  DEV — Supabase project #1                               │
│  Shared integration testing                              │
│  Fake / anonymized data ONLY                             │
│  May pause after 7 days inactivity (manual restore)      │
└───────────────────────────┬─────────────────────────────┘
                            │ migration promoted after verification
                            ▼
┌─────────────────────────────────────────────────────────┐
│  PRODUCTION — Supabase project #2                        │
│  Real member data                                        │
│  Daily encrypted backups required                        │
└─────────────────────────────────────────────────────────┘
```

**Dedicated staging:** Deferred. Revisit if budget allows Render Starter for a second service + third Supabase project.

See [ADR-008](decisions/ADR-008-local-dev-production-environments.md).

---

## Migration workflow (Alembic)

**What is a migration?** A versioned script that changes the database schema (add table, add column, etc.). Alembic tracks which migrations have been applied.

### Rules

1. **Only Alembic changes schema** — never alter production tables manually without a migration file.

2. **Migrations run as `circuit_migrator`** through the session pooler (IPv4-compatible).

3. **Auto-run on deploy:** Render Pre-Deploy Command: `alembic upgrade head`

4. **Expand-then-contract:** Migrations must be backward-compatible with currently running code:
   - Add nullable column → deploy code that uses it → later migration drops old column
   - Never drop a column the running code still reads

5. **Destructive DDL is manual:** DROP TABLE, DROP COLUMN, bulk data rewrite → backup first, run deliberately, verify.

### Why auto-run on deploy?

Eliminates "deployed code but forgot migration" crash loops. With a single Render instance, no concurrent migration race.

### Connection strings

| Purpose | Role | Connection |
|---|---|---|
| App runtime | `circuit_app` | Session pooler :5432 |
| Migrations | `circuit_migrator` | Session pooler :5432 |
| Local dev | local postgres user | localhost:5432 |
| Backups (`pg_dump`) | `postgres` or dedicated backup role | Session pooler :5432 |
| Dashboard inspection | Human via Supabase UI | Supabase dashboard |

**Environment variables:** `DATABASE_URL` (runtime, `circuit_app`) and `MIGRATOR_DATABASE_URL` (Alembic, `circuit_migrator`) — see [`10-environment-management.md`](10-environment-management.md).

**Note:** Direct connection (IPv6) is unavailable from Render and GitHub Actions on free tier. All automation uses session pooler.

---

## Backup strategy

### The problem

**Supabase free tier has no automated backups and no point-in-time recovery.**

Losing Circuit's membership database would be unrecoverable without our own backups.

### Decision

**Daily encrypted `pg_dump` via scheduled GitHub Action**, through session pooler.

### Requirements

| Requirement | Detail |
|---|---|
| **Encrypt before storage** | Dump contains student numbers, phone numbers, emergency contacts |
| **Never store in git** | Artifacts must not land in the repository |
| **Access-controlled destination** | **Cloudflare R2** (S3-compatible) — encrypt before upload; see [`12-deployment-architecture.md`](12-deployment-architecture.md) |
| **Verify restore** | A backup never restored is a hypothesis, not a backup |

### Risk: `pg_dump` via pooler

Supabase recommends direct connection for dumps. We cannot reach direct from Render (IPv4). Session mode should work but is **unverified**.

**Prove-it-early:** Full dump + restore into dev project before importing real member data. See `open-items.md` N3.

---

## Region

**Decision:** Singapore (`ap-southeast-1`) for both Supabase and Render.

Closest region to the Philippines — reduces latency for synchronous request/response (Section 2: sync SQLAlchemy means latency is additive per query).

---

## Data privacy considerations

### What we store

The portal will hold personal information about Filipino students:

- Full name, UP email, student number
- Degree program, year level
- Contact number, **emergency contact**
- Division, committee, batch, position

Hosted on **US-owned infrastructure (Supabase)** in **Singapore**.

### Organizational responsibility

This may implicate the **Philippine Data Privacy Act of 2012**. UP Circuit becomes a personal information controller with obligations around lawful basis, data subject rights, breach notification, and cross-border transfer.

**This is not a decision for the developer alone.**

**Required action:** Circuit leadership should be informed **in writing** what data the portal holds and where it lives, and should agree before production import of real member data.

### Architectural responses (Section 4 will detail)

- Collect only what the portal actually needs
- Restrict directory fields aggressively (FR-MEMBER-005)
- Audit log retention limits (avoid unbounded PII in logs)
- Support data deletion requests without schema surgery
- Challenge necessity of emergency contact storage (open item N5)

See `open-items.md` N2.

---

## PostgreSQL conventions

Establish these before the first migration:

| Convention | Rule | Why |
|---|---|---|
| Timestamps | `TIMESTAMPTZ`, always UTC | OTP expiry and audit logs break with naive timestamps |
| UUIDs | `gen_random_uuid()` (built-in PG 13+) | No `pgcrypto` extension needed |
| Email uniqueness | `UNIQUE (lower(email))` + app normalization | Case-insensitive without `citext` |
| Status columns | `CHECK` constraint matching app enums | DB rejects invalid status even if app has a bug |
| Query timeout | `statement_timeout` on `circuit_app` | Protects shared free-tier CPU |
| SSL | Enforced in Supabase settings | Non-TLS connection strings fail loudly |
| Network IP allowlist | **Not available** on free Render | Cannot restrict by source IP — noted, not relied upon |

---

## 7-day inactivity pause (free tier)

Free Supabase projects **pause after 7 days of inactivity** and require **manual dashboard restore**.

| Environment | Impact |
|---|---|
| **Production** | Non-issue once members use portal daily; Render keep-warm ping touches DB |
| **Dev** | Will pause during quiet weeks — annoyance, not risk |

**Implication:** Dev project is not a data store of record. Production data lives in production or in backups.

Optional: weekly GitHub Action `SELECT 1` against dev to prevent pause.

---

## Prove-it-early checklist

Complete during early implementation, **before production member data import:**

| # | Test | Blocks |
|---|---|---|
| 1 | `pg_dump` + full restore via session pooler into dev | Production data import |
| 2 | Render → Supabase session pooler under concurrent load | Production deploy |
| 3 | Argon2id benchmark on Render (see N1) | Auth parameter lock-in |
| 4 | Data API disabled + `app` schema unreachable via `/rest/v1/` | Any table creation |
| 5 | Alembic as `circuit_migrator` + app as `circuit_app` grants | First migration |

Tracked in `open-items.md`.

---

## Decisions in this section

| # | Decision |
|---|---|
| 1 | Supabase = managed PostgreSQL only |
| 2 | Disable Data API on both projects |
| 3 | All tables in `app` schema; revoke grants from anon/authenticated |
| 4 | Three roles: postgres (human), circuit_migrator (DDL), circuit_app (DML) |
| 5 | **No RLS** — reversed from Section 1 early recommendation |
| 6 | Supavisor session mode, port 5432 (not direct, not transaction mode) |
| 7 | Pool: size 5, overflow 5, pre_ping True |
| 8 | Local → Dev → Production (staging deferred) |
| 9 | Alembic auto-run on deploy; expand-then-contract; destructive DDL manual |
| 10 | Daily encrypted pg_dump; verify restore before real data |
| 11 | Singapore region |
| 12 | Escalate Data Privacy Act question to Circuit leadership |
| 13 | PostgreSQL conventions as listed above |

---

## What future WebDev members should know

### Safe operations

- Query data via Supabase dashboard (read-only investigation)
- Run migrations locally first, then dev, then production
- Add tables/columns via Alembic migration files

### Dangerous operations

- Re-enabling Data API without understanding exposure
- Putting tables in `public` schema
- Using `postgres` role in application config
- Manual schema changes in production without migration
- Importing real member data before backup restore is verified

### Common questions

| Question | Answer |
|---|---|
| Why no RLS? | This doc, §RLS reversal. FastAPI is the enforcement point. |
| Why `app` schema? | Keeps tables off the Data API surface even if re-enabled. |
| Why session mode not transaction? | Prepared statement compatibility with SQLAlchemy. |
| Why no staging? | Cost — two Supabase projects, one warm Render service. |
| How do I change the schema? | Write Alembic migration → test local → dev → merge → auto-deploy |


