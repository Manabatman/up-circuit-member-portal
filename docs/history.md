# History and archived notes

This file is **optional reading**. New WebDev members should start at [README.md](README.md) and [how-it-works.md](how-it-works.md).

---

## Why we do not use row-level security in PostgreSQL

The portal checks who may do what in **FastAPI**, not in the database. Supabase’s public Data API is turned off, and application tables live in the `app` schema with least-privilege database roles. Row-level security would duplicate authorization in a second language without adding protection for our architecture (browser → backend → database only).

If the Data API is ever re-enabled or a client other than the backend talks to Postgres directly, revisit this decision and document the change in [how-it-works.md](how-it-works.md).

---

## Older documentation

Long-form requirements and phase-1 handbooks may remain under `docs/PHASE0.md` and `docs/architecture/phase-1/` for reference. They are not part of day-to-day development. Prefer updating [how-it-works.md](how-it-works.md) when behavior or rules change.
