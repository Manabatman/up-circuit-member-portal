-- Local PostgreSQL bootstrap for Milestone 0.
-- Run once as the Postgres superuser against the default `postgres` database:
--
--   psql -U postgres -f scripts/bootstrap_postgres.sql
--
-- Replace CHANGE_ME_* with local-only passwords. Never use production secrets.
-- Then copy those passwords into backend/.env (gitignored).
--
-- Why two roles:
--   circuit_migrator  — Alembic only. Can CREATE/ALTER/DROP (owns schema app).
--   circuit_app       — FastAPI runtime. SELECT/INSERT/UPDATE/DELETE only.
-- The app never connects as the superuser. See Section 3 and Section 11.

CREATE DATABASE upcircuit_local;
CREATE DATABASE upcircuit_test;

CREATE ROLE circuit_migrator LOGIN PASSWORD 'CHANGE_ME_MIGRATOR';
CREATE ROLE circuit_app LOGIN PASSWORD 'CHANGE_ME_APP';

GRANT CONNECT ON DATABASE upcircuit_local TO circuit_migrator;
GRANT CONNECT ON DATABASE upcircuit_local TO circuit_app;
GRANT CREATE ON DATABASE upcircuit_local TO circuit_migrator;

GRANT CONNECT ON DATABASE upcircuit_test TO circuit_migrator;
GRANT CONNECT ON DATABASE upcircuit_test TO circuit_app;
GRANT CREATE ON DATABASE upcircuit_test TO circuit_migrator;
