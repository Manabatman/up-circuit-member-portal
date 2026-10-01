-- Run once in Supabase SQL Editor (as postgres) after creating the project.
-- Replace CHANGE_ME_* with strong passwords; store in Render env vars only.

CREATE ROLE circuit_migrator LOGIN PASSWORD 'CHANGE_ME_MIGRATOR';
CREATE ROLE circuit_app LOGIN PASSWORD 'CHANGE_ME_APP';

GRANT circuit_migrator TO postgres;
GRANT circuit_app TO postgres;

ALTER ROLE circuit_migrator CREATEDB;
GRANT CREATE ON DATABASE postgres TO circuit_migrator;

-- Alembic creates schema app and grants via migrations.
-- Connection strings (session pooler, port 5432):
-- MIGRATOR_DATABASE_URL=postgresql://circuit_migrator:...@...pooler.supabase.com:5432/postgres
-- DATABASE_URL=postgresql://circuit_app:...@...pooler.supabase.com:5432/postgres
