# Add a feature (checklist)

Use this when you add a new member-facing capability. Read [how-it-works.md](../how-it-works.md) first if the change touches login, permissions, or the database.

## Vertical slice order

1. Database migration (if needed) — `backend/alembic/versions/`
2. SQLAlchemy model — `backend/app/models/`
3. Pydantic schemas — `backend/app/schemas/`
4. Service logic — `backend/app/services/`
5. API route — `backend/app/routers/` with permission checks
6. Frontend API client — `frontend/src/api/`
7. Page or component — `frontend/src/pages/` or `frontend/src/components/`
8. Backend test — `backend/tests/`
9. Update [how-it-works.md](../how-it-works.md) or [where-to-edit.md](../guides/where-to-edit.md) if behavior changed

## Common rules

- Privileged actions must be enforced in the backend, not only hidden in the UI.
- Membership status and staff permissions are different — renewed-member pages must still check membership.
- Do not add Supabase keys or other secrets to the frontend.
- Do not let an admin role substitute for renewed membership on member-only content.
- New tables belong in the `app` schema.

## Related

- [Local setup](local-setup.md)
- [Common tasks](common-tasks.md)
