# Phase 1 Overview

This document explains what Phase 1 is, what it produces, and how to use the Phase 1 architecture documentation.

---

## Implementation status (read this first)

- **Phase 1 documentation (Sections 00–15):** complete — this is the technical handbook.
- **Application code:** M0–M7 implemented locally. See [`CHANGELOG.md`](../../CHANGELOG.md).
- **New WebDev members:** start at [`docs/README.md`](../../README.md), not here. Return to Phase 1 when you need design detail or are changing auth, schema, or security.

Production deployment and member rollout are not started.

---

## What is Phase 1?

**Phase 0** (documented in [`PHASE0.md`](../../PHASE0.md)) established *what* the UP Circuit Member Portal must do: problems, users, permissions, features, workflows, and constraints.

**Phase 1** transforms those requirements into a **concrete technical blueprint** — the architecture a developer can implement safely without re-deciding fundamentals on every feature.

Phase 1 was written as planning documentation before implementation. **Code now exists** for milestones M0–M7; use this handbook as the design reference and keep docs in sync when behavior changes.

**Status:** Phase 1 (Sections 00–15) is **complete**. Implementation history: [`15-development-roadmap.md`](15-development-roadmap.md) and [`CHANGELOG.md`](../../CHANGELOG.md).

---

## What Phase 1 is responsible for

Phase 1 answers questions such as:

- What major components exist, and how do they communicate?
- Why was each technology chosen?
- How is the database hosted, secured, and migrated?
- What tables and relationships will exist?
- What API endpoints will exist, and who may call them?
- How does login work?
- How is security enforced?
- How are environments, Git, deployment, testing, and documentation organized?
- In what order should features be implemented?

Phase 1 produces **architecture documents** in `docs/architecture/phase-1/`, an **open-items register**, and eventually **Architecture Decision Records (ADRs)**.

---

## What Phase 1 is explicitly NOT doing

Phase 1 does **not**:

- Write application code (React components, FastAPI routes, etc.)
- Install npm or pip packages
- Create Supabase projects or deploy services
- Implement features, even as a "quick MVP"
- Replace or rewrite Phase 0 requirements

If something is not yet decided in Phase 1, it appears in [`open-items.md`](open-items.md) — not as guessed implementation detail.

---

## Relationship to Phase 0

```
PHASE0.md                          Phase 1 documents
"What are we building?"     →      "How will we build it?"
(requirements, constraints)        (architecture, decisions)
```

Every major Phase 1 decision should trace back to a Phase 0 requirement or constraint. Examples:

| Phase 0 source | Phase 1 consequence |
|---|---|
| §0.6.17 — React hiding UI is not security | Backend-authoritative authorization in FastAPI |
| §0.7.23 — Content must be database-driven | Resources, request types, navigation in PostgreSQL |
| FR-AUTH-003 — Password then email OTP | FastAPI owns auth; Supabase Auth not used |
| FR-MEMBERSHIP-002 — Link to existing Renewals Portal | External hyperlink only in MVP |
| §0.10.28 — FastAPI owns business logic | No Supabase client in frontend |
| G8 — Maintainable by future members | Minimal dependencies, documented decisions |

Phase 0 remains the **requirements baseline**. Phase 1 must not silently change Phase 0 requirements. If Phase 1 discovers a genuine conflict, it is documented in `open-items.md` and escalated for approval.

---

## Relationship to later implementation

After Phase 1 is complete, implementation follows the development roadmap (Phase 1 §15, derived from Phase 0 §0.13):

```
Project setup
    → Backend foundation
    → Database + migrations
    → Authentication
    → Frontend foundation
    → Member features
    → Admin features
    → …
    → Deployment
    → Production
```

Each implementation stage should be checkable against the Phase 1 documents. If code diverges from the architecture, either update the code or update the documentation — not neither.

---

## Phase 1 document sequence

Read documents in this order. Each builds on earlier concepts.

| # | Document | Status | Question it answers |
|---|---|---|---|
| — | [`PHASE0.md`](../../PHASE0.md) | Complete | What are we building? |
| 00 | This overview | Complete | What is Phase 1? |
| 01 | [System architecture](01-system-architecture.md) | Complete | What are the major pieces? |
| 02 | [Technology decisions](02-technology-decisions.md) | Complete | What technologies are those pieces built with? |
| 03 | [Supabase architecture](03-supabase-architecture.md) | Complete | How does database infrastructure work? |
| 04 | [Database schema](04-database-schema.md) | Complete | What information do we store? |
| 05 | [Authorization architecture](05-authorization-architecture.md) | Complete | Who may do what, precisely? |
| 06 | [API architecture](06-api-architecture.md) | Complete | What endpoints exist? |
| 07 | [Authentication architecture](07-authentication-architecture.md) | Complete | How does login and activation work? |
| 08 | [Security architecture](08-security-architecture.md) | Complete | How do we protect the system? |
| 09 | [Git/GitHub strategy](09-git-github-strategy.md) | Complete | How do we collaborate on code? |
| 10 | [Environment management](10-environment-management.md) | Complete | How is configuration organized? |
| 11 | [Local development setup](11-local-development-setup.md) | Complete | How do I run it on my machine? |
| 12 | [Deployment architecture](12-deployment-architecture.md) | Complete | How does GitHub → Vercel/Render/Supabase work? |
| 13 | [Testing strategy](13-testing-strategy.md) | Complete | What do we test, and where? |
| 14 | [Documentation system](14-documentation-system.md) | Complete | GitHub docs + Google Docs journal |
| 15 | [Development roadmap](15-development-roadmap.md) | Complete | In what order do we implement? |

Supporting files:

- [`glossary.md`](../../glossary.md) — terminology
- [`open-items.md`](open-items.md) — unresolved decisions
- [`decisions/README.md`](decisions/README.md) — ADR index

---

## Architectural principles established (Sections 1–3)

These principles apply to all later sections and all implementation:

1. **Three-tier, backend-authoritative:** React → FastAPI → PostgreSQL. The browser is untrusted.
2. **No Supabase in the frontend:** The browser never receives a database credential. All data flows through `/api/v1`.
3. **FastAPI owns authentication:** Not Supabase Auth. Password hashing, OTP, sessions, rate limiting — all in FastAPI using established libraries.
4. **Authorization in one place:** FastAPI enforces permissions on every request. React only hides UI for convenience.
5. **Membership and roles are separate axes:** Membership status gates member-facing consumption. Roles grant admin capability. **A role may never satisfy a membership gate.**
6. **Content in the database, structure in code:** Officers change URLs and descriptions via admin UI; schema and permission names require a developer.
7. **Minimal dependencies:** Every new library needs a concrete justification.
8. **Security-critical auth code:** Small, isolated, library-based, thoroughly tested — not custom cryptography.
9. **Document reversals:** When a decision changes, the old decision, new evidence, and new decision are all recorded.

---

## Current status of Phase 1

| Section | Status |
|---|---|
| 1 — System Architecture | **Complete** — documented in `01-system-architecture.md` |
| 2 — Technology Decisions | **Complete** — documented in `02-technology-decisions.md` |
| 3 — Supabase Architecture | **Complete** — documented in `03-supabase-architecture.md` |
| 4 — Database Schema | **Complete** — documented in `04-database-schema.md` |
| 5 — Authorization Architecture | **Complete** — documented in `05-authorization-architecture.md` |
| 6 — API Architecture | **Complete** — documented in `06-api-architecture.md` |
| 7 — Authentication Architecture | **Complete** — documented in `07-authentication-architecture.md` |
| 8 — Security Architecture | **Complete** — documented in `08-security-architecture.md` |
| 9 — Git/GitHub Strategy | **Complete** — documented in `09-git-github-strategy.md` |
| 10 — Environment Management | **Complete** — documented in `10-environment-management.md` |
| 11 — Local Development Setup | **Complete** — documented in `11-local-development-setup.md` |
| 12 — Deployment Architecture | **Complete** — documented in `12-deployment-architecture.md` |
| 13 — Testing Strategy | **Complete** — documented in `13-testing-strategy.md` |
| 14 — Documentation System | **Complete** — documented in `14-documentation-system.md` |
| 15 — Development Roadmap | **Complete** — documented in `15-development-roadmap.md` |

**Phase 1 status: complete.** Architecture and planning documentation is finished. Implementation begins at Milestone 0 in [`15-development-roadmap.md`](15-development-roadmap.md) after approval.

---

## How future developers should use these documents

### Before changing anything

1. Read `PHASE0.md` for the requirement you are implementing.
2. Read the relevant Phase 1 section.
3. Check `open-items.md` for unresolved questions.
4. Check `decisions/` for ADRs related to your change.

### When making an architectural change

1. Document the problem, options, and reasoning.
2. Add or update an ADR in `decisions/`.
3. Update the relevant Phase 1 section and `open-items.md`.
4. Do not merge implementation that contradicts undocumented architecture.

### When onboarding

Start with [`docs/README.md`](../../README.md) → this document → `01` → `02` → `03` → `glossary.md`.

You should be able to answer: what the system is, how it works, why it was built this way, and what not to change — **without asking the original developer**.

