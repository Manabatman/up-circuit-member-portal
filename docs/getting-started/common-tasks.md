# Common Tasks

Everyday things a WebDev member does after the portal is set up locally.

**First time here?** Complete [local-setup.md](local-setup.md) before using this page.

---

## Run the app after a change

Most of the time you only need to save your file and refresh the browser.

| What you changed | What to do |
|---|---|
| Frontend page or component (`.tsx`, `.css`) | Save — Vite hot-reloads automatically. Refresh if something looks stuck. |
| Backend Python (`.py`) | Save — uvicorn `--reload` restarts the API. |
| `frontend/.env` | Restart the frontend (`npm run dev` or restart via `start-local.bat`). |
| `backend/.env` | Restart the backend (uvicorn or restart via `start-local.bat`). |
| Database migration | Run `alembic upgrade head` from `backend/`, then restart the backend. |

### Easiest: start-local.bat (Windows)

From the repo root:

```powershell
.\start-local.bat
```

This starts backend (port 8000) and frontend (port 5173), syncs demo users, and opens the browser. To stop: close both server windows or run `.\stop-local.bat`.

### Manual (two terminals)

**Backend:**

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --port 8000
```

**Frontend:**

```powershell
cd frontend
npm run dev
```

Open **http://localhost:5173**. Log in with a demo account from [local-setup.md](local-setup.md). OTP codes print in the **backend** terminal window.

---

## Check that things are working

| Check | URL or command |
|---|---|
| API health | http://localhost:8000/api/v1/health → `{ "status": "ok" }` |
| API docs | http://localhost:8000/api/docs |
| Frontend | http://localhost:5173 |
| Login flow | Demo email + `DEV_SEED_PASSWORD` from `backend/.env`, then OTP from backend console |

If the browser shows **Failed to fetch**, the request never reached the API — confirm both servers are running and `VITE_API_BASE_URL=http://localhost:8000` in `frontend/.env`.

---

## Run tests

```powershell
# Backend (from backend/, venv active)
pytest

# Frontend (from frontend/)
npm test
```

pytest uses the `upcircuit_test` database (real PostgreSQL, not SQLite).

Full command index: [maintenance/commands.md](../maintenance/commands.md)

---

## Seed demo data (local only)

After a fresh database or when demo users are missing:

```powershell
# From backend/, venv active
python ..\scripts\seed_m1_users.py
python ..\scripts\seed_verified_content.py
```

`seed_verified_content.py` adds real Circuit URLs (Constitution, Academic Drive, etc.) for local testing. Optional fake demo resources: `python ..\scripts\seed_demo_content.py`.

Requires `DEV_SEED_PASSWORD` in `backend/.env` (at least 12 characters, never committed).

---

## Make a code change (typical flow)

1. Create a branch from `main` (`feature/`, `fix/`, or `docs/`).
2. Edit the file — see [where-to-edit.md](../guides/where-to-edit.md) if you are not sure which one.
3. Run the app and check your change in the browser.
4. Run tests (`pytest` and/or `npm test`).
5. Open a pull request — see [CONTRIBUTING.md](../../CONTRIBUTING.md).

For a **new feature** (not a small edit), follow [add-a-feature.md](add-a-feature.md).

---

## Add or change a Circuit link (officers)

**Do not edit code** for ordinary links.

1. Log in as an admin user (e.g. `super.admin@up.edu.ph` locally).
2. Go to **Admin → Resources**.
3. Add or edit the resource there.

WebDev only changes code when the portal itself needs new behavior — not when officers add a Google Drive link.

---

## Something broke?

See [maintenance/troubleshooting.md](../maintenance/troubleshooting.md).

---

## Next steps

- [Where do I edit?](../guides/where-to-edit.md)
- [Project structure](project-structure.md)
- [Add a feature](add-a-feature.md) — for new capabilities, not small edits
