# Project Scope

What the UP Circuit Member Portal **includes**, **defers**, and **explicitly excludes** for the first release and beyond.

**Authoritative technical design:** [`architecture/phase-1/`](../architecture/phase-1/)  
**Requirements baseline:** [`PHASE0.md`](../PHASE0.md) — goals (§4), functional requirements (§6), release scope (§9)

---

## Goals (in scope for the project)

From Phase 0 G1–G9 — see [`overview.md`](overview.md) for summary.

The portal must be **data-driven**: officers change URLs, categories, and links through the admin UI without a code deploy (G2, FR-CONFIG).

---

## Non-goals (out of scope)

These apply to the whole project, not only MVP:

| ID | Non-goal |
|---|---|
| NG1 | Do not immediately replace Google Workspace (Drive, Sheets, Forms, Gmail) |
| NG2 | Do not rebuild the existing Membership Division renewal portal — link to it in MVP |
| NG3 | Do not build a general-purpose website builder |
| NG4 | Do not make every Circuit activity a complex event-management system |
| NG5 | Do not build every Level 3 feature at once |

---

## MVP (P0) — confirmed in Phase 0 §9

| Area | In MVP |
|---|---|
| **Authentication** | Login, password, OTP (with trusted-device exception), logout, activation |
| **Members** | Profiles, membership status, member directory |
| **Membership** | Status display, renew redirect, admin status management |
| **Information** | Academic Drive, Resources, Request directory (Google Form redirects) |
| **Admin** | Dashboard, RBAC, manage resources, manage request links, manage members in scope |
| **Infrastructure** | FastAPI, React, Supabase PostgreSQL, Vercel, Render, GitHub |

### MVP boundaries requiring explicit confirmation

The following items have mixed priority signals across requirements and architecture. Phase 1 resolves some; others remain **Decision Required** until Circuit leadership confirms.

| Feature | Phase 0 signal | Phase 1 resolution | Status |
|---|---|---|---|
| **In-app notifications** | FR-NOTIF-001 P0 | Tier 1 table in Section 4; Phase F | **MVP** — basic in-app notifications |
| **Email notifications** | FR-NOTIF-002 P0 ("important actions") | EmailSender abstraction; OTP/activation emails required for auth | **MVP for auth emails only**; broader "important actions" email list **undefined — confirm with leadership** |
| **Membership import tool** | FR-MEMBERSHIP-007 P1 | Import API designed in Section 6; Phase F builds tool; **production member data import after Phase K** | **MVP: admin import tool with preview/confirm; P1: first production import of real roster** |
| **Flagship workspaces** | G6 emphasis; FR-FLAG P1 | Tier 3 tables; C2 permission split designed; no MVP UI | **Not MVP** — link/navigation only if needed; full workspaces P1+ |
| **Request history ("My Requests")** | FR-DASH-006 P1 | C5: **P1 only** — MVP is redirect directory | **Not MVP** |
| **Audit logs UI** | §6.13 P1 | Tier 2; audit events defined | **Not MVP** |
| **Native request workflows** | Level 2 vision | Phase 2 / P1 | **Not MVP** |

> **DECISION REQUIRED (D4):** Confirm the email notification scope for MVP — auth/activation/reset only, or a defined list of "important actions." Update this table after confirmation.

---

## Phase 2 (P1) — after MVP stabilizes

From Phase 0 §9 (P1):

- Portal-native forms and database-backed request workflows  
- Request tracking and approval/rejection  
- Flagship project workspaces (TEP, InteraCKT, SquEEEze)  
- Membership spreadsheet import at scale (if not done in MVP tool phase)  
- Advanced member filtering  
- Announcements  
- Audit log UI  
- Advanced notifications  

---

## Level 3 / Future (P2)

- Portal builder / advanced configuration  
- Google API integration (Drive, Sheets, Gmail)  
- Analytics and advanced dashboards  
- Automations  

Architecture should **permit** Level 3 without building it now (NG5).

---

## Constraints

| Constraint | Detail |
|---|---|
| **Team size** | 1–3 WebDev members — minimal dependencies, documented decisions |
| **Budget** | ~$8/mo at launch (Render Starter + domain) — see Section 2 |
| **Maintainability** | Future officers manage content via admin UI; future WebDev inherits documented architecture |
| **Privacy** | Philippine Data Privacy Act considerations — N2 organizational sign-off before production import |
| **External renewal** | Existing Renewals Portal remains external in MVP (NG2) |

---

## Non-functional requirements (summary)

Detailed in Phase 1 Sections 7–8, 13. High-level list:

| Category | Requirement |
|---|---|
| **Security** | Backend-authoritative auth/authz; hashed passwords; HttpOnly sessions; CSRF/CORS controls |
| **Maintainability** | Monorepo; ADRs; vertical-slice roadmap; officers do not need GitHub |
| **Availability** | Render Starter recommended before member rollout; health endpoint |
| **Performance** | ~1,200 members, ~50 concurrent — monolith sufficient |
| **Cost** | Free-tier limits documented; staging environment deferred |
| **Testability** | pytest + real PostgreSQL; CI merge blockers |
| **Accessibility** | **RATIONALE NOT YET DOCUMENTED** — not specified in Phase 0 or Phase 1 |

---

## Related documents

- [`overview.md`](overview.md) — project summary  
- [`PHASE0.md`](../PHASE0.md) §6 — full functional requirements  
- [`15-development-roadmap.md`](../architecture/phase-1/15-development-roadmap.md) — implementation order  
- [`open-items.md`](../architecture/phase-1/open-items.md) — unresolved decisions (N1–N20)
