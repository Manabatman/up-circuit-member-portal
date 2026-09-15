# Contributing

Guidelines for changing the UP Circuit Member Portal repository.

**Audience:** WebDev members with GitHub access. Portal officers change content through the **admin UI**, not git.

---

## Workflow

All changes merge to `main` via **pull request**:

1. Branch from `main` (`feature/`, `fix/`, `docs/`)
2. Make changes and run tests locally when you touch code
3. Open a PR
4. Squash merge when checks pass (CI may be added later)

Do not force-push to `main`.

---

## What never goes in git

- `.env` files or secret values
- Member personal data or production database dumps
- Real one-time codes or activation tokens
- Screenshots of credentials

See `.gitignore`.

---

## Documentation changes

Documentation fixes go through PRs too.

If you change **behavior** members or developers rely on (API, permissions, env vars, setup):

1. Update [docs/how-it-works.md](docs/how-it-works.md) when rules or architecture change
2. Update [docs/getting-started/local-setup.md](docs/getting-started/local-setup.md) or [docs/deploy.md](docs/deploy.md) when setup or deploy steps change
3. Add a [docs/CHANGELOG.md](docs/CHANGELOG.md) entry for significant changes

---

## Code changes

- Follow [docs/getting-started/add-a-feature.md](docs/getting-started/add-a-feature.md) for new features
- Add or update backend tests in `backend/tests/` for API and permission behavior
- Add or update frontend tests when UI behavior changes

---

## Architecture and security changes

**Do not change these silently:**

- Backend-owned login and sessions
- Frontend must not talk directly to Supabase
- Membership status vs staff permissions (renewed-member pages keep checking membership)
- Backend enforcement of privileged actions

Before altering auth, sessions, schema, CORS/CSRF, or deploy topology:

1. Read [docs/how-it-works.md](docs/how-it-works.md)
2. Explain the problem and proposed change in the PR
3. Update documentation in the same PR

---

## Related

- [docs/README.md](docs/README.md)
- [docs/maintenance/commands.md](docs/maintenance/commands.md)
- [docs/operations/handover.md](docs/operations/handover.md)
