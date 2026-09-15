# Git and GitHub Strategy

This document defines **how UP Circuit WebDev members collaborate on portal source code** — what Git and GitHub are, why we use them, and the rules that keep the project maintainable and recoverable.

**Prerequisites:** Read [`01-system-architecture.md`](01-system-architecture.md) (monorepo layout) and [`08-security-architecture.md`](08-security-architecture.md) (secrets never in git).

**Phase 0 reference:** §0.12.9 (GitHub architecture), §0.14.2 (GitHub documentation), §0.13 Stage 1 (create repository)

---

## What are Git and GitHub?

| | Git | GitHub |
|---|---|---|
| **What it is** | Version control on your computer | Hosting + collaboration for Git repos |
| **Analogy** | Save points in a game — every commit is a snapshot you can return to | Google Drive for code — stores the repo, shows history, enables review |
| **Who uses it** | WebDev members only | WebDev members only |
| **Officers need it?** | **No** — officers change content via the portal admin UI (C8) | **No** |

**Git** tracks every change to every file: who changed what, when, and why (via commit messages). If a deploy breaks production, you can identify the change and revert it.

**GitHub** hosts the shared copy of the repository, provides pull requests for review, connects to Vercel and Render for deployment, and stores issues. It is not the portal — members never visit GitHub to use the portal.

**Phase 0 ref:** §0.5C — "An ordinary officer should not need GitHub access just to change a Google Form link."

---

## Why we use Git and GitHub

| Goal | How Git/GitHub helps |
|---|---|
| **Recoverability** | Revert a bad merge; restore yesterday's code without guessing |
| **Collaboration** | Two WebDevs work on different branches without overwriting each other |
| **Handoff** | Next year's WebDev clones the repo and reads history + docs — no oral tradition |
| **Deploy traceability** | Every production deploy traces to a commit on `main` |
| **Review before merge** | PRs show diffs — catch Alembic mistakes, secret leaks, permission bugs |

This is **code history**, distinct from **`audit_logs`** in the portal (which records officer actions on member data). Both matter; they answer different questions.

---

## Monorepo — one repository for everything

**Decision (Phase 0 §0.12.9, ADR-033):** One Git repository contains frontend, backend, docs, and scripts together.

```
upcircuit-portal/          (repo root — Phase 0 called it circuit-portal; same layout)
├── frontend/              React + Vite + TypeScript
├── backend/               FastAPI + Python
├── docs/                  Architecture and requirements (this handbook)
├── scripts/               One-off tooling, import helpers
├── .github/               GitHub Actions — CI (Section 13) + ops (Section 12)
├── .gitignore
└── README.md
```

### Why one repo, not separate frontend/backend repos

| Monorepo advantage | Split-repo cost at our scale |
|---|---|
| One clone, one PR for a feature touching API + UI | Two PRs, two CI pipelines, coordinated merges |
| Alembic migration + API change + React change in one PR | Cross-repo versioning pain |
| One set of GitHub secrets / deploy hooks to configure | Double the onboarding for new WebDev |
| Matches 1–3 person team reality | GitFlow ceremony for enterprise teams |

**Rejected:** Separate repositories for frontend and backend. Revisit only if WebDev grows past ~5 active contributors with independent release cycles — unlikely for Circuit.

---

## Who has access to what

| Actor | GitHub access | Portal access | Infrastructure |
|---|---|---|---|
| **WebDev member** | Read/write repo (via org invite) | Own member account + dev testing | Render/Vercel/Supabase dashboard as granted |
| **Portal Super Admin** | **None required** | Admin dashboard | **None** — C8 |
| **Portal officer (Academic Admin, etc.)** | **None** | Admin dashboard for their domain | **None** |
| **Ordinary member** | **None** | Member-facing portal | **None** |

Changing a Google Form URL is a **database change via admin UI**, not a git commit. Do not give officers GitHub access "to be helpful" — it exposes secrets, deployment controls, and member data import scripts.

**Phase 0 ref:** §0.6.11, §0.6.12 — Source Code and Production Infrastructure rows are WebDev-only.

---

## The required workflow

Every code or documentation change follows this path. No exceptions for "small fixes."

```mermaid
flowchart LR
    Clone["1. Clone repo\nmain branch"] --> Branch["2. Create short-lived branch"]
    Branch --> Work["3. Edit + commit locally"]
    Work --> Push["4. Push branch to GitHub"]
    Push --> PR["5. Open pull request"]
    PR --> Checks["6. CI checks pass\nSection 13"]
    Checks --> Review["7. Review if 2+ WebDevs"]
    Review --> Merge["8. Squash merge to main"]
    Merge --> Deploy["9. Auto-deploy\nSection 12"]
```

### Step-by-step (for someone new to the project)

1. **Clone** the repository. You get a full copy on your machine including all history.
2. **Create a branch** from latest `main` — never commit directly on `main`.
3. **Make changes** in small commits with clear messages.
4. **Push** your branch to GitHub (`git push -u origin your-branch`).
5. **Open a pull request (PR)** — GitHub compares your branch to `main` and shows the diff.
6. **Wait for checks** — lint, tests (when CI exists in Section 13).
7. **Get review** — if two or more WebDevs exist, someone else approves. If solo, self-merge after checks pass.
8. **Squash merge** into `main` — one clean commit per PR on the main history.
9. **Deploy happens automatically** — Vercel and Render watch `main` (Section 12).

---

## Branches

### `main` — the production line

- **`main` is always deployable.** Never push broken code to `main`.
- **Protected:** no direct pushes; changes only via merged PR.
- **No force-push to `main`** — ever. Use revert if something bad merged.

### Feature branches — short-lived

| Prefix | Use for | Example |
|---|---|---|
| `feature/` | New capability | `feature/member-directory-filters` |
| `fix/` | Bug fix | `fix/login-rate-limit-off-by-one` |
| `docs/` | Documentation only | `docs/section-9-git-strategy` |

**Rules:**

- Branch from latest `main` before starting work.
- Delete branch after merge (GitHub option on merge).
- **No long-lived personal branches** (`mark/dev`, `working`) — they diverge and cause painful merges.
- **One branch per task** — if scope grows, split into two PRs.

### Rejected: GitFlow

GitFlow (`develop`, `release/*`, `hotfix/*` branches) is designed for teams with scheduled releases and QA gates. We deploy from `main` continuously. GitFlow adds ceremony without benefit at our scale.

---

## Commits

A **commit** is a snapshot with a message explaining **why** the change was made.

### Good commit practices (required)

| Rule | Reason |
|---|---|
| **Small commits** — one logical change | Easier to revert, easier to review |
| **Message explains why**, not just what | Future WebDev understands intent |
| **Never commit secrets** | `.env`, passwords, API keys — see Section 8 |
| **Never use `--no-verify`** unless explicitly approved | Skips hooks that may catch mistakes |

### Commit message format (recommended)

```
Short summary (50 chars or less)

Optional body: why this change was needed, what it fixes,
any caveats for the reviewer.
```

**Examples:**

```
Add view_member_directory permission to MEMBER role seed

Non-renewed members need directory access per Section 5 C2 resolution.
```

```
Fix OTP attempt counter not incrementing on wrong code

FR-AUTH-005 requires tracking failed verification attempts.
```

### What not to commit

| Never commit | Why |
|---|---|
| `.env` files | Secrets (Section 8) |
| `node_modules/` | Reinstall with `npm install` |
| `__pycache__/`, `.venv/` | Regenerated locally |
| `dist/`, `build/` | Build output — CI builds fresh |
| Member data CSVs/exports | PII — import via admin tool only |
| IDE settings (`.vscode/` except shared extensions.json) | Personal preference |

---

## Pull requests

A **pull request (PR)** is a proposal to merge your branch into `main`. It is the review checkpoint.

### Why PRs even when working alone

| Benefit | Explanation |
|---|---|
| **Vercel preview** | Every PR gets a temporary URL — test UI before production |
| **Reviewable history** | Diff shows exactly what changed; commit message alone is not enough |
| **Alembic + code together** | Migration and API change reviewed in one place |
| **Habit for collaboration** | When a second WebDev joins, the workflow already exists |

### PR description template (recommended)

```markdown
## What
Brief description of the change.

## Why
Link to requirement, open item, or bug report.

## How to test
Steps a reviewer can follow to verify.

## Checklist
- [ ] No secrets in diff
- [ ] Migrations included if schema changed
- [ ] Docs updated if architecture changed
```

### Merge policy (approved — ADR-034)

| Situation | Rule |
|---|---|
| **Solo WebDev** | Open PR → checks pass → **self-merge** (squash) |
| **Two or more WebDevs** | Open PR → checks pass → **require one approval** from another WebDev → merge |
| **Default merge method** | **Squash merge** — one commit per PR on `main` (ADR-035) |
| **Merge commit** | Only if PR tells a multi-step story that must stay separate (rare — justify in PR) |
| **Rebase merge** | Not used — rewrites history, confuses newcomers |

**Why squash:** `main` history stays readable — one line per feature/fix, not "wip", "fix typo", "actually fix" noise from development.

---

## Branch protection on `main`

Configure on GitHub when the repository is created (Section 12):

| Setting | Value |
|---|---|
| Require pull request before merging | **Yes** |
| Require approvals | **1**, only when ≥2 WebDevs with write access |
| Require status checks to pass | **Yes** (when CI exists — Section 13) |
| Require branches to be up to date | **Yes** |
| Allow force pushes | **No** |
| Allow deletions | **No** |

Until CI exists, the "status checks" requirement is deferred — but PRs are still required.

---

## `.gitignore`

Git ignores files matching patterns in `.gitignore` — they never enter version history.

### Required patterns (must be in root `.gitignore` before first commit)

| Pattern | Why |
|---|---|
| `.env`, `.env.*`, `!.env.example` | Secrets — Section 8 |
| `node_modules/` | npm install regenerates |
| `__pycache__/`, `*.pyc` | Python bytecode |
| `.venv/`, `venv/` | Local Python virtual environment |
| `dist/`, `build/` | Frontend build output |
| `.DS_Store`, `Thumbs.db` | OS junk |
| `*.log` | Local log files may contain sensitive data |
| `.idea/`, `*.swp` | IDE/editor temp files |

### `.env.example` (committed)

Per-package templates showing variable **names** without values. Full catalog in [`10-environment-management.md`](10-environment-management.md).

**`backend/.env.example`:**

```env
APP_ENV=local
DATABASE_URL=postgresql://circuit_app:PASSWORD@localhost:5432/upcircuit_local
MIGRATOR_DATABASE_URL=postgresql://circuit_migrator:PASSWORD@localhost:5432/upcircuit_local
FRONTEND_ORIGIN=http://localhost:5173
BREVO_API_KEY=
EMAIL_FROM=portal@example.org
MAINTENANCE_TOKEN=
```

**`frontend/.env.example`:**

```env
VITE_API_BASE_URL=http://localhost:8000
```

New WebDev copies each to `.env` in the same directory and fills in real values from the WebDev lead — never from git.

### Pre-commit secret scanning (recommended, not required)

Section 8 recommends scanning for accidental secret commits before they reach GitHub. Options: `gitleaks`, `detect-secrets`, or GitHub secret scanning (if org plan allows).

**Not mandatory in MVP** — do not block a newcomer who cannot install extra tools. Add when the team is stable or after a near-miss.

---

## What lives in Git vs elsewhere

| In Git (source of truth) | Not in Git |
|---|---|
| Application source code | Member data / PII |
| Alembic migrations | Production database dumps |
| Architecture docs (`docs/`) | `.env` secret values |
| Seed data **definitions** (permission names, role mappings) | Official division names until confirmed (N6) |
| `.env.example` (names only) | Google Docs visual journal ([`14-documentation-system.md`](14-documentation-system.md)) |
| GitHub Actions workflows | Render/Vercel env var **values** |

**Alembic migrations are non-negotiable in git.** The migration file is the contract for what the database schema should be. Manual SQL on production without a migration file causes drift — the next deploy breaks.

---

## Recoverability — fixing mistakes

| Mistake | Recovery |
|---|---|
| Bad commit on feature branch | `git reset` or new commit fixing it — branch not public yet |
| Bad PR merged to `main` | **Revert merge commit** on GitHub — creates a new commit undoing the change |
| Secret committed | Rotate the secret immediately; remove from history with `git filter-repo` only if not yet pushed; if pushed, assume compromised |
| Need code from 3 months ago | `git log` → find commit → `git checkout` or revert selectively |

### Force-push rules

| Target | Force-push |
|---|---|
| **`main`** | **Forbidden** — use revert |
| **Your feature branch** (before merge) | Allowed — rebase/squash locally to clean up |
| **Someone else's branch** | **Never** |

**Why no force-push to `main`:** Anyone who pulled `main` now has divergent history. Force-push destroys their base. Revert is safe and auditable.

---

## Practice classification

### Required rules

| Rule |
|---|
| Monorepo — one repo for frontend, backend, docs |
| All changes via PR to `main` — no direct push |
| No force-push to `main` |
| No secrets in git — `.env` in `.gitignore` |
| `main` always deployable |
| Squash merge as default |
| Second-person review when ≥2 WebDevs |
| Alembic migrations in git for every schema change |
| Delete feature branch after merge |

### Recommended practices

| Practice |
|---|
| Commit message explains why |
| PR description uses what/why/test template |
| Branch prefixes: `feature/`, `fix/`, `docs/` |
| Pre-commit secret scanning |
| Link PR to open item or requirement |

### Optional practices

| Practice |
|---|
| Conventional Commits prefix (`feat:`, `fix:`, `docs:`) |
| Draft PRs for early feedback |
| Assign PR to self for solo work (visibility) |

### Explicitly rejected

| Practice | Why rejected |
|---|---|
| **GitFlow** (develop/release branches) | Ceremony without benefit at our team size |
| **Separate frontend/backend repos** | Double onboarding, split PRs for full-stack features |
| **Direct push to `main`** | No review checkpoint, no Vercel preview |
| **Force-push to `main`** | Breaks collaborators, hides history |
| **Long-lived personal branches** | Merge hell |
| **Committing member data** | PII leak risk |
| **Officers with GitHub access** | C8 — portal admin ≠ infrastructure access |

### Deferred to later sections

| Topic | Section |
|---|---|
| CI pipeline jobs (lint, test, migrate check) | [`13-testing-strategy.md`](13-testing-strategy.md) |
| Deploy triggers from `main` | Section 12 |
| Environment variable catalog | Section 10 |
| Full docs folder layout vs Phase 0 §0.14.2 | [`14-documentation-system.md`](14-documentation-system.md) — ADR-044 |
| GitHub org / repository creation steps | Section 12 |

---

## Newcomer checklist

When you join as a WebDev member months from now:

1. **Read** [`docs/README.md`](../../README.md) → Phase 1 overview → Sections 1–8 as needed.
2. **Get GitHub access** from current WebDev lead (org invite).
3. **Clone** the repository. Copy `.env.example` to `.env` — get values from lead, never from git.
4. **Never commit** `.env` or member data.
5. **Create a branch** for your first task — do not push to `main`.
6. **Open a PR** even for documentation fixes — builds the habit.
7. **Ask** if unsure whether something belongs in git (migrations yes, data no).
8. **Set up local dev** — [`11-local-development-setup.md`](11-local-development-setup.md).

You should be able to contribute safely **without needing the conversation where these rules were decided**. That is why this document exists.

---

## Mapping Phase 0 §0.12.9 and §0.13 Stage 1

| Phase 0 item | Section 9 decision |
|---|---|
| Monorepo with frontend/, backend/, docs/, scripts/ | **Confirmed** — ADR-033 |
| `.gitignore` configured | **Required patterns listed above** |
| Create GitHub repository | Documented in [`12-deployment-architecture.md`](12-deployment-architecture.md) bring-up checklist |
| One repo preferable for team size | **Confirmed** — reject split repos |
| Phase 0 repo name `circuit-portal` | Workspace uses `upcircuit-portal` — naming only, same layout |

---

## Related documents

| Topic | Document |
|---|---|
| Monorepo layout | `01-system-architecture.md` |
| Secrets never in git | `08-security-architecture.md` |
| Alembic migrations | `03-supabase-architecture.md` |
| CI checks on PR | [`13-testing-strategy.md`](13-testing-strategy.md) |
| Deploy from `main` | [`12-deployment-architecture.md`](12-deployment-architecture.md) |
| Development roadmap | [`15-development-roadmap.md`](15-development-roadmap.md) |
| Environment variables | [`10-environment-management.md`](10-environment-management.md) |

---

## Do not change without ADR

- Monorepo structure (one repo)
- PR required for all changes to `main`
- No direct push or force-push to `main`
- No secrets in git
- Squash merge as default
- Officers do not receive GitHub access by default (C8)
- Alembic migrations must be in git

---

*Section 9 complete. Section 15 documents the development roadmap.*
