# UP Circuit Member Portal — Documentation

The Member Portal is UP Circuit's place for members to find links, resources, division hubs, the member directory, and account tools — with officer admin tools behind the same login.

**New WebDev member?** Start below. You do not need to read old architecture binders or decision-number files to change a page.

---

## Start here (~10 minutes)

1. [Project overview](project/overview.md) — what the portal is and who uses it  
2. [Local setup](getting-started/local-setup.md) — run it on your laptop  
3. [How it works](how-it-works.md) — frontend, backend, database, login, and access rules  
4. [Project structure](getting-started/project-structure.md) — folders and routes  
5. [Where do I edit?](guides/where-to-edit.md) — which file to open  
6. [Common tasks](getting-started/common-tasks.md) — tests and day-to-day commands  

When you deploy: [Deploy guide](deploy.md).

---

## What the portal does today

- Login (password + one-time code + session cookie)  
- Resources and Academic Drive (renewal rules apply)  
- Six standing division hubs plus Executive Board hub  
- Member directory (search and filter by hub for display)  
- Account and renewals link-out  
- Officer admin for resources, division copy, membership status  
- Beta **Share feedback** for signed-in members  
- **Calendar** and **Flagship Events** use **demo data** in `frontend/src/demo/` — not the official Circuit schedule  

---

## What it does not do yet

Events database, notifications, native request workflows, committees/positions, member import UI, password reset in the app, production email until Brevo is configured, automated CI in the repo, or a separate CMS website.

---

## Quick answers (2-minute lookup)

| Question | Answer |
|----------|--------|
| How do I run the project? | [Local setup](getting-started/local-setup.md) or `start-local.bat` |
| Where is the member directory? | Route `/directory` — `frontend/src/pages/DirectoryPage.tsx` |
| Where does login happen? | `frontend/src/pages/LoginPage.tsx` + `backend/app/routers/auth.py` |
| How do I add a resource? | In the portal: Resources or a division page (if you have permission), or Admin → Resources for categories |
| How do I change a division page? | Admin → Divisions for intro text; links on `/divisions/:id` |
| How does the backend know if someone can do something? | [How it works — membership and permissions](how-it-works.md#membership-status-and-staff-permissions) + `backend/app/auth/deps.py` |
| Where does the database live? | Local Postgres; production Supabase — [How it works — database](how-it-works.md#database) |
| What must I not change casually? | [Important rules](how-it-works.md#important-rules--check-before-changing-authentication-or-member-access) |
| How do I deploy? | [Deploy](deploy.md) |
| What if a test fails? | [Common tasks](getting-started/common-tasks.md) → [Troubleshooting](maintenance/troubleshooting.md) |

---

## Where do I make changes?

| I want to… | Go here |
|------------|---------|
| Change a member page | `frontend/src/pages/` |
| Change layout, buttons, feedback modal | `frontend/src/components/` |
| Change API behavior | `backend/app/routers/` and `backend/app/services/` |
| Change database tables | `backend/app/models/` + new Alembic migration — **ask first** |
| Change Circuit links (Constitution, Drive, etc.) | Portal admin / contextual Add resource — **not git** |
| Update docs | `docs/` — keep [how-it-works.md](how-it-works.md) in sync if rules change |

Full map: [guides/where-to-edit.md](guides/where-to-edit.md).

---

## Important

Before changing authentication, membership rules, or database schema, read [How it works](how-it-works.md). When in doubt, ask before migrating production or shared dev databases.

Officers manage portal **content** through the admin UI, not GitHub.

---

## By audience

| Audience | Start here |
|----------|------------|
| New WebDev | Numbered path above |
| Officer / stakeholder | [overview](project/overview.md) → [scope](project/scope.md) |
| Deploy / handoff | [deploy.md](deploy.md) → [handover](operations/handover.md) |
| Old requirements archive | [history/](history/) (optional, not day-one reading) |

---

## Current status

First **beta** preparation: local MVP features plus feedback, directory hub display, calendar UX, and deploy documentation. Production rollout follows [Deploy](deploy.md) when Circuit is ready.

Recent changes: [CHANGELOG.md](CHANGELOG.md).

---

## Maintaining documentation

When behavior or rules change:

1. Update [how-it-works.md](how-it-works.md) if access, login, or architecture rules changed.  
2. Update [where-to-edit.md](guides/where-to-edit.md) or [local-setup.md](getting-started/local-setup.md) if paths or setup changed.  
3. Add a [CHANGELOG.md](CHANGELOG.md) entry for significant releases.  

Pull requests — see [CONTRIBUTING.md](../CONTRIBUTING.md).
