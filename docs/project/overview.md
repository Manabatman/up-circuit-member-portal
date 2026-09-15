# Project Overview

**Product name:** UP Circuit Member Portal  
**Repository codename:** `upcircuit-portal`  
**Status:** Phase 1 architecture documentation complete — **MVP milestones M0–M7 implemented** (M7: Real Circuit Member Home)

---

## What this is

The UP Circuit Member Portal is an **internal web platform** for UP Circuit (EEE student organization). It gives members one place to find resources, submit requests, and manage their profile — and gives administrative teams tools to manage links, membership, and content **without editing source code**.

The portal does **not** replace Google Workspace in the first version. It organizes and connects existing Google Forms, Sheets, and Drive links behind authentication, membership rules, and role-based admin tools.

---

## Why it exists

UP Circuit's operations are spread across Messenger, Google Forms, Sheets, Drive, and Docs. Members struggle to find the right link; admins repeat configuration work; membership data is re-entered every year.

The portal addresses five problems documented in [`PHASE0.md`](../PHASE0.md) §1:

1. Information fragmentation  
2. Repetitive data entry  
3. Workflow fragmentation  
4. Event-operation fragmentation (flagship projects)  
5. Admin dependency on developers for ordinary content changes  

---

## Who uses it

| Audience | Role | Access |
|---|---|---|
| **Members** | Ordinary Circuit members | Member portal (full or restricted by renewal status) |
| **Admins** | Officers with portal roles (Renewals, Academic, Finance, Publicity, Super Admin) | Admin dashboard — content and configuration only |
| **WebDev** | Source code and infrastructure maintainers | GitHub, deployment, database — **not** the same as an organizational admin role |

Members may be **renewed**, **pending**, or **not renewed** for the current academic year. That status controls member-facing access separately from admin roles. See [how-it-works.md](../how-it-works.md#membership-status-and-staff-permissions).

Officers manage the portal through the **admin UI**, not GitHub.

---

## What we are building (levels)

| Level | Description | When |
|---|---|---|
| **Level 1 (MVP)** | Organized layer over Google tools — links, directory, Academic Drive, admin-managed resources | First release |
| **Level 2** | Portal-native workflows — tracked requests, notifications, import | After MVP stabilizes |
| **Level 3** | Full operating platform — Google API integration, analytics, advanced automation | Long term |

MVP scope details: [`scope.md`](scope.md)

---

## Technology summary

| Layer | Choice |
|---|---|
| Frontend | React, Vite, TypeScript |
| Backend | FastAPI, Python |
| Database | PostgreSQL via Supabase (managed hosting only) |
| Auth | FastAPI-owned sessions — not Supabase Auth |
| Hosts | Vercel (frontend), Render (backend) |

Full stack rationale: [`02-technology-decisions.md`](../architecture/phase-1/02-technology-decisions.md)

---

## Current project status

| Milestone | Status |
|---|---|
| Phase 0 requirements | Complete — [`PHASE0.md`](../PHASE0.md) (requirements baseline) |
| Phase 1 architecture (Sections 00–15) | Complete |
| Application code | **M0–M7 implemented locally** — auth, resources, directory, account, admin, divisions, renewals page, member home |
| Production deployment | Not started |
| Google Docs development journal | Not created yet (rules in Section 14) |

---

## Where to go next

| If you are… | Start here |
|---|---|
| Officer or stakeholder | This page → [`scope.md`](scope.md) |
| New WebDev member | [`docs/README.md`](../README.md) → [`getting-started/local-setup.md`](../getting-started/local-setup.md) → [`guides/where-to-edit.md`](../guides/where-to-edit.md) |
| Implementing a feature | [`15-development-roadmap.md`](../architecture/phase-1/15-development-roadmap.md) |
| Understanding a design choice | [`decisions/`](../architecture/phase-1/decisions/) (ADRs) |

---

## MVP implemented subset (vs Phase 1 architecture)

The presentable MVP implements a vertical slice of Phase 1:

| Implemented in MVP (M0–M7) | Deferred to later Phase 1 work |
|---|---|
| Login, OTP, sessions, logout | Password reset, trusted devices, production email |
| Academic + organizational resources (member + admin) | Request types directory, notifications |
| Member directory | Division grouping by member assignment, committees |
| Divisions (standing divisions + division resources) | Member-to-division assignment |
| Renewals page + login onboarding | — |
| Own account (read-only) | `PATCH /members/me` profile editing |
| Admin membership status updates | Member import, role management UI |
| Audit log writes (no viewer) | Audit log admin UI |
| Code-defined navigation via `/auth/me` route keys | Navigation CMS (`/navigation`) |

---

## Related documents

- Requirements baseline: [`PHASE0.md`](../PHASE0.md)
- MVP boundaries: [`scope.md`](scope.md)
- Architecture handbook: [`architecture/phase-1/`](../architecture/phase-1/)
- Open questions: [`open-items.md`](../architecture/phase-1/open-items.md)
