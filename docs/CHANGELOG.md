# Changelog

## 2026-09-13 — First beta preparation

- Student-facing docs: [how-it-works.md](how-it-works.md), [deploy.md](deploy.md), rewritten [README.md](README.md)
- Removed ADR workflow from developer path; optional [history.md](history.md)
- Beta feedback (`POST /api/v1/feedback`), Share feedback modal with auto page context
- Calendar: events in grid cells, no agenda sidebar; honest demo subtitle
- Executive Board as clickable content hub (`is_standing_division = false`)
- Directory: search, standing-division filter, display-only `primary_division_id` on profiles
- Contextual Add/Edit resource on member resource and division pages
- Security: OTP IP rate limit, feedback rate limit, Brevo required outside local, seed blocked in production
- Deploy templates: `frontend/vercel.json`, `backend/render.yaml`
- Migration `0005_beta_feedback_hubs`

Chronological log of **significant project changes** — architecture milestones, major features, and security fixes.

This is not a SemVer release log. There is no versioned product yet. For line-by-line code history, use `git log`.

**Rules:** No member PII. No secret values. Link to PR or section when helpful.

---

## 2026-09-11 — IA, content, calendar, and UI cleanup

### Member-facing polish (showcase truth stays in code/docs)

- Sidebar IA: Projects under Discover; unlabeled My Account + Renew block; Circuit Work removed; no renewal nav reordering
- Removed Sample/Demo/Prototype disclaimers and chips from member UI
- Calendar: fixed 2026 month/range events, period strip, range day tint, thin event detail (no photos)
- Dashboard: Upcoming + Constitution only; removed Explore/Continue duplicates
- Academic Drive: featured Official Academic Drive; Divisions/Directory/Renew/Projects/SquEEEze/Account copy cleanup
- Division detail: full-width banner hero (21/9 desktop, 4/3 mobile)
- Renew: primary Open Membership Portal button; Membership title
- Docs: `visual-showcase.md` lists verified vs showcase inventory

---

## 2026-09-10 — Visual language reset

### Editorial composition + restrained typography

- Scoped global link color to `main` so sidebar nav is light gray (cyan active only), not bright blue
- Restricted Chakra Petch to page titles and featured object names; body, nav, metadata use system sans
- Dashboard: greeting-first home, inline membership context, image-forward upcoming events, text explore destinations
- Calendar: open month grid workspace, inline demo notice, image-forward event objects
- Projects: featured SquEEEze block + quieter coming-soon cards with branded placeholders (`projectVisuals.ts`)
- Section headers use typography + dividers instead of card wrappers

---

## 2026-09-10 — Premium visual redesign (Tailwind + Chakra Petch)

### Member portal visual language

- Tailwind CSS v4 via `@tailwindcss/vite`; Circuit tokens mapped in `frontend/src/styles/tailwind.css` alongside existing `tokens.css`
- **Chakra Petch** for display typography; body remains readable system sans-serif
- Redesigned application shell: branded sidebar, cyan active accent, improved nav hierarchy and user footer
- Member page chrome (`PageShell`, `PageHeader`, `SectionHeader`) uses Tailwind — fewer generic white-card wrappers
- Image-forward **event cards** on Calendar agenda, month grid list, Dashboard upcoming, and Event detail hero
- Event imagery config: `frontend/src/content/eventVisuals.ts`, `frontend/src/components/EventVisual.tsx`
- CSS Modules preserved for buttons, forms, admin pages, and untouched components
- ADR-052 (supersedes ADR-010 Tailwind prohibition for this pass)

---

## 2026-09-10 — Visual showcase pass

### Member portal visual potential (frontend-only)

- Grouped sidebar navigation: Home, Discover, Circuit Work; Calendar and Projects for all authenticated members
- New showcase routes: `/calendar`, `/calendar/:eventId`, `/projects`, `/projects/squeeeze`
- Sample data isolated in `frontend/src/demo/` (calendar, projects, SquEEEze workspace) with **Sample** UI labeling
- Dashboard member home: upcoming sample events, Explore, Continue (verified Start Here preserved)
- Resources / Academic Drive: `ResourceRow` with tool icons and external-system helper text
- Divisions: image-forward organizational directory; branded placeholders via `frontend/src/content/divisionVisuals.ts`
- Division detail: hero header, verified copy only, designed empty states
- Directory mobile cards; Account and Renewals visual alignment
- Extended UI primitives: `PageShell`, `EmptyState`, `DemoBanner`, `SampleChip`, `DivisionCardLink`, `DivisionHero`
- ADR-051; `docs/project/visual-showcase.md`
- **Not implemented:** calendar API, flagship DB, division assignment, notifications, external integrations

---

## 2026-09-09 (M7)

### Real Circuit Member Home

- Verified content inventory: Official Academic Drive, UP Circuit Constitution, Membership Portal URL, first-time renewal Google Form
- Opt-in seed script: `scripts/seed_verified_content.py` (replaces auto demo content on `start-local.bat`)
- Frontend constants: `RENEWAL_URL` → `https://membership.upcircuit.org/`, `FIRST_TIME_RENEWAL_FORM_URL`
- Authenticated `/renewals` page with status-aware copy; sidebar **Renew Membership** via existing `renew_membership` route key
- Login page: first-time renewal / new member **Get Started** → Google Form (unauthenticated)
- Dashboard member home: quick access, Start Here from resource APIs (no `is_featured`)
- Resources: honest empty state for seeded **Requests** category
- Admin Resources: officer help text for Category → Resource → optional Division
- ADR-050: Renewals IA; no renewal backend API

---

## 2026-09-06 (M6)

### Content Home + Divisions

- Alembic `0004`: `divisions` table (six Constitution standing divisions), `resources.division_id`, seeded ORGANIZATIONAL category **Requests** only
- Division APIs: `GET/PATCH /api/v1/divisions`; member `/divisions` and `/divisions/:id` pages
- Global organizational resources exclude division-owned rows; division detail filters by `division_id`
- Admin: category CRUD UI, optional division on resources, Admin Divisions page for page intro text
- Branding: Verdana display token, calmer headings, `BrandMark` loads `/circuit-logo.png` with fallback
- New route key `divisions` (permission: `view_resources`); `requests` / `notifications` / `renew_membership` still excluded from nav
- ADR-049: divisions are content hubs, not membership assignments
- Content inventory template: `docs/content-inventory-template.md`

---

## 2026-09-06

### Visual pass — UP Circuit design system (M0–M5 presentation)

- Centralized design tokens in `frontend/src/styles/tokens.css` (Circuit blue/cyan/purple palette, `#F5F8FA` canvas, system font stacks — no new npm dependencies)
- Extended shared UI primitives: `Button`, `Modal`, `ExternalLink`, `SearchInput`, `FormField`, `Icon`, `SegmentedControl`, `Avatar`, `BrandMark`, `SessionSplash`
- Rebuilt app shell: dark sidebar navigation (~248px), permission-aware nav via existing `route_keys` + `ROUTE_LABELS` allowlist (Requests/Notifications/Renew page still excluded)
- Polished all M0–M5 pages: Login, Dashboard, Academic Drive, Resources, Directory, Account (logout confirmation modal), Admin Resources, Admin Membership
- Client-side resource search/filter; responsive sidebar drawer below 900px
- Playwright visual QA suite: `scripts/visual-qa.spec.js` + `scripts/playwright_auth.py` (session cookie helper for local screenshots)
- Login primary button label: **Log In** (tests updated)

---

## 2026-09-05

### Milestone 5 — presentable hardening

- App shell navigation driven by `/auth/me` `route_keys`
- Shared UI tokens, loading/empty/error/access-denied states
- Dashboard landing page with quick links and membership badge
- Demo seed content script and five demo accounts in local startup

### Milestone 4 — admin membership management

- `PATCH /api/v1/membership/{member_id}/status` with full-name confirmation and reason
- Renewals admin workflow; membership gate unlocks Academic Drive after renewal
- Audit log entries for membership status changes

### Milestone 3 — member directory + own account

- `GET /api/v1/members`, `/members/me`, `/membership/me`
- Separate directory vs admin vs self response schemas (no sensitive field leaks)
- Directory and account frontend pages

### Milestone 2 — organized resources / Academic Drive

- Alembic `0003`: `resource_categories`, `resources`, `audit_logs`
- Resource listing with scope-based authorization (C3 preserved)
- Admin resource CRUD; URL updates visible to members without redeploy
- Academic Drive and organizational resources pages

---

## 2026-09-05

### Milestone 1 — login, session, dashboard

- Alembic `0002`: auth/RBAC tables; seeded roles and permissions (no committed password hashes)
- Auth flow: password → 6-digit OTP (console in local) → HttpOnly session cookie
- Endpoints: `POST /auth/login`, `POST /auth/verify-code`, `GET /auth/me`, `POST /auth/logout`
- `require_permission` + membership gates; `GET /academic-years/current` requires `view_dashboard`
- CSRF Origin allowlist on mutating requests
- React routes: `/login`, `/dashboard` via `react-router-dom`; credentialed API client
- Local seed script: `python scripts/seed_m1_users.py` (reads `DEV_SEED_PASSWORD` from gitignored `backend/.env`)
- pytest auth/authz security-boundary tests; Vitest login and protected-route tests

---

## 2026-09-05

### Milestone 0 — toolchain / foundation

- Added monorepo packages `backend/` (FastAPI) and `frontend/` (React + Vite)
- Local PostgreSQL bootstrap: [`scripts/bootstrap_postgres.sql`](../scripts/bootstrap_postgres.sql) (`upcircuit_local`, `upcircuit_test`, `circuit_app`, `circuit_migrator`)
- First Alembic migration: `app.academic_years` only, seeded `2026-2027`
- `GET /api/v1/health` (public); `GET /api/v1/academic-years/current` (protected from M1 onward)
- React page displays the current academic year via `VITE_API_BASE_URL`
- pytest on `upcircuit_test`; one Vitest component test
- Removed empty orphan [`phase1.md`](phase1.md)
- Section 15 notes M0–M5 as the presentable-MVP implementation strategy; Phases A–L remain the long-term production roadmap

---

## 2026-09-05

### Documentation cleanup and Phase 0 rewrite (Phase 3)

- Rewrote [`PHASE0.md`](PHASE0.md) from ~4,600-line conversational transcript to maintainable requirements document (~370 lines) — WHAT/WHY only; all FR-* IDs, G/NG, business rules, and deviation table preserved
- Rewrote [`glossary.md`](glossary.md) with thematic categories and alphabetized terms per category
- Slimmed [`docs/README.md`](README.md), [`architecture/README.md`](architecture/README.md), root [`README.md`](../README.md), and [`DOCUMENTATION-PLAN.md`](DOCUMENTATION-PLAN.md)
- Updated [`project/overview.md`](project/overview.md) and [`project/scope.md`](project/scope.md) to link to Phase 0 instead of duplicating requirements
- Fixed stale `See ADR-00N (planned)` links in Sections 02–03; updated Section 14 ADR guidance; renamed decisions index to **ADR Index**
- ADR spot-check: 48 files present, none empty, none marked planned

---

## 2026-09-05

### Documentation audit and hybrid layer (Phase 2)

- Approved **D1-B hybrid** information architecture (ADR-048) — added `docs/project/`, `docs/getting-started/`, `docs/operations/`, `docs/architecture/README.md` beside unchanged `phase-1/` sections
- Wrote **ADR-001 through ADR-048** as individual decision records
- Added [`project/overview.md`](project/overview.md), [`project/scope.md`](project/scope.md), stakeholder-facing MVP boundary table
- Added [`getting-started/local-setup.md`](getting-started/local-setup.md), [`getting-started/add-a-feature.md`](getting-started/add-a-feature.md)
- Added [`operations/handover.md`](operations/handover.md), [`maintenance/troubleshooting.md`](maintenance/troubleshooting.md)
- Added root [`CONTRIBUTING.md`](../CONTRIBUTING.md) and [`DOCUMENTATION-PLAN.md`](DOCUMENTATION-PLAN.md)
- Quarantined superseded PHASE0 §0.10–0.14 with historical banner; removed stray draft line; noted N5 on emergency contact
- Fixed stale cross-links (Section 05 Section 7 pointer, Section 00 approval wording)
- Updated [`docs/README.md`](README.md) with audience-based navigation

---

## 2026-08-29

### Phase 1 — Section 15 (Development Roadmap) — **Phase 1 complete**

- Final Phase 1 document: implementation Phases A–L, Milestone 0, vertical slices
- ADR-046: dependency-ordered vertical-slice roadmap (refines Phase 0 §0.13 where needed)
- ADR-047: developer-authored implementation; AI as teacher/reviewer/debugger
- Phase 1 architecture/planning documentation complete — implementation not started

### Phase 1 — Section 14 (Documentation System)

- Defined two-layer documentation: GitHub (technical) + Google Docs journal (visual)
- Confirmed current `docs/architecture/phase-1/` layout (ADR-044); rejected Phase 0 numbered folder tree
- Added root README, this changelog, and `docs/maintenance/commands.md` index
- Recorded ADR-045 (documentation layers + changelog location)

### Phase 1 — Section 13 (Testing Strategy)

- Defined testing pyramid, philosophy, and layers for 1–3 WebDev team
- Primary automated proof: pytest + real PostgreSQL (ADR-043)
- CI on PR documented (ADR-042); E2E deferred for MVP
- Established AI-as-teacher principle for test authorship

### Phase 1 — Section 12 (Deployment Architecture)

- Documented Vercel + Render + Supabase production topology
- ADR-040: git deploy from `main`; Actions for ops only
- ADR-041: encrypted backups to Cloudflare R2
- Resolved N14: maintenance cleanup via GitHub Action + token

### Phase 1 — Sections 1–11

- Completed technical architecture: system design, stack, database, schema, auth, authz, API, security, Git, env, local dev
- Resolved Phase 0 contradictions C2–C11 (documented in `open-items.md`)
- Established ADR index (ADR-001–041) in `decisions/README.md`

---

## Phase 0 (requirements baseline)

Phase 0 discovery and requirements captured in [`PHASE0.md`](PHASE0.md) — project genesis through documentation architecture (§0.1–0.14).

Implementation follows Phase 1 architecture; Phase 0 remains the requirements baseline and is not rewritten silently.
