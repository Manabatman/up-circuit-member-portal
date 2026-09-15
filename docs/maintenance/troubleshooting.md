# Troubleshooting Index

Quick map to known failure modes. This file is an **index** — full context lives in the linked sections.

Do not invent fixes here that contradict architecture docs.

---

## Local development

| Symptom | Likely cause | See |
|---|---|---|
| Backend crashes on start | Missing required env var | [`10-environment-management.md`](../architecture/phase-1/10-environment-management.md) — pydantic-settings fail-loud |
| `alembic upgrade` permission denied | Wrong DB role | [`11-local-development-setup.md`](../architecture/phase-1/11-local-development-setup.md) — use `circuit_migrator` |
| Frontend cannot reach API | Wrong `VITE_API_BASE_URL` or CORS | Section 11 + Section 8 |
| Login returns 401 but password is correct | Account locked or inactive | Section 07 — `locked_until`, `is_active` |
| OTP never arrives locally | Expected — check **backend console** | ADR-039 |
| pytest database errors | Using wrong DB or missing `upcircuit_test` | Section 13, ADR-043 |
| `psql` not recognized (Windows) | PostgreSQL `bin` not on PATH | [`getting-started/local-setup.md`](../getting-started/local-setup.md) — use `C:\Program Files\PostgreSQL\16\bin\psql.exe` |
| password authentication failed for `circuit_migrator` | Role exists but `.env` password does not match | Put the role password in `backend/.env` only — not `.env.example` |
| `permission denied` creating schema `app` | `circuit_migrator` has CONNECT but not CREATE | As superuser: `GRANT CREATE ON DATABASE upcircuit_local TO circuit_migrator;` (same for `upcircuit_test`) |
| Cookie not sent on API calls | `Secure=true` on localhost | Section 11 — `APP_ENV=local` exception |

Full local failure table: [`11-local-development-setup.md`](../architecture/phase-1/11-local-development-setup.md)

---

## Authentication

| Symptom | Likely cause | See |
|---|---|---|
| Session lost after browser restart | Expected if cookie expired or cleared | Section 07 — 7d idle / 30d absolute |
| OTP required every login | Trusted device cookie missing or expired | Section 07, ADR-029 |
| Activation link invalid | Token expired (7d) or already used | Section 07, C4 |
| "Invalid credentials" for valid email | Enumeration protection — same message for unknown email | Section 07 |

---

## Authorization

| Symptom | Likely cause | See |
|---|---|---|
| Admin cannot view Academic Drive | Non-renewed admin — C3 membership gate | Section 05, ADR-012 |
| 403 `MEMBERSHIP_REQUIRED` | Permission exists but membership gate failed | Section 05 |
| Super Admin blocked from member content | By design — roles never satisfy membership gates | C3 |

---

## Deployment and production

| Symptom | Likely cause | See |
|---|---|---|
| CORS error after deploy | Origin not in allowlist | Section 08, N17 prove-early |
| Login works locally, fails in production | Custom domain / cookie domain mismatch | N4, Section 07 |
| Migrations not applied | Pre-Deploy command failed on Render | Section 12 |
| Cold start timeout | Render free tier spin-down | Section 12 — keep-warm or Starter plan |
| Backup restore untested | N3 not completed | **Do not import production data until resolved** |

---

## Database

| Symptom | Likely cause | See |
|---|---|---|
| Connection pool exhausted | Too many connections — use Supavisor session mode :5432 | Section 03, ADR-007 |
| RLS confusion | Project does not use RLS | ADR-006 |

---

## Documentation

| Symptom | Likely cause | See |
|---|---|---|
| Phase 0 says JWT but Section 2 says no | §0.10–0.14 superseded by Phase 1 | [`PHASE0.md`](../PHASE0.md) deviation table |
| Two conflicting API paths | Section 06 is authoritative over §0.11 | [`06-api-architecture.md`](../architecture/phase-1/06-api-architecture.md) |

---

## When to escalate

| Situation | Action |
|---|---|
| Suspected security incident | Revoke sessions, rotate secrets, document in changelog |
| Production data loss | Restore from R2 backup (after N3 drill proves restore works) |
| Member locked out | Renewals Admin clears `locked_until` (confirm N15 support path) |
| Architecture change needed | ADR + update owning section + `open-items.md` |

---

## Related documents

- Command index: [`commands.md`](commands.md)  
- Open items: [`open-items.md`](../architecture/phase-1/open-items.md)  
- Handover: [`../operations/handover.md`](../operations/handover.md)
