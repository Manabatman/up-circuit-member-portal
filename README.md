# UP Circuit Member Portal

Internal web platform for **UP Circuit** members and officers — resources, division hubs, directory, membership, and admin tools in one place.

**Codename:** `upcircuit-portal`

**Status:** Local MVP plus first-beta improvements (feedback, directory hubs, calendar UX, deploy docs). Production deployment is documented but not automatic from this repo alone.

---

## New here?

Start at **[docs/README.md](docs/README.md)** — setup, how the system works, and where to edit files.

| Need | Document |
|------|----------|
| How it fits together | [docs/how-it-works.md](docs/how-it-works.md) |
| Run locally | [docs/getting-started/local-setup.md](docs/getting-started/local-setup.md) |
| Deploy | [docs/deploy.md](docs/deploy.md) |
| Product summary | [docs/project/overview.md](docs/project/overview.md) |

---

## Stack

| Layer | Technology |
|-------|------------|
| Frontend | React, Vite, TypeScript |
| Backend | FastAPI, Python |
| Database | PostgreSQL (Supabase in production) |
| Auth | FastAPI sessions — not Supabase Auth |

---

## Local quick start

See [docs/getting-started/local-setup.md](docs/getting-started/local-setup.md). Typical URLs:

- API health: `http://localhost:8000/api/v1/health`
- UI: `http://localhost:5173`

---

## Contributing

Pull requests to `main` — [CONTRIBUTING.md](CONTRIBUTING.md).

Portal **officers** change links and content in the **admin UI**, not in GitHub.
