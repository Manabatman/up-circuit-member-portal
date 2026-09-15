"""Create app schema and academic_years.

Revision ID: 0001_academic_years
Revises:
Create Date: 2026-09-05
"""

from typing import Sequence, Union

from alembic import op

revision: str = "0001_academic_years"
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("CREATE SCHEMA IF NOT EXISTS app")

    op.execute(
        """
        CREATE TABLE app.academic_years (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            start_year SMALLINT NOT NULL,
            label TEXT NOT NULL,
            is_current BOOLEAN NOT NULL DEFAULT false,
            renewal_opens_at TIMESTAMPTZ,
            renewal_closes_at TIMESTAMPTZ,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            CONSTRAINT academic_years_start_year_key UNIQUE (start_year)
        )
        """
    )
    op.execute(
        """
        CREATE UNIQUE INDEX academic_years_one_current
            ON app.academic_years (is_current)
            WHERE is_current = true
        """
    )
    op.execute(
        """
        INSERT INTO app.academic_years (start_year, label, is_current)
        VALUES (2026, '2026-2027', true)
        """
    )

    op.execute("GRANT USAGE ON SCHEMA app TO circuit_app")
    op.execute(
        "GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA app TO circuit_app"
    )
    op.execute(
        """
        ALTER DEFAULT PRIVILEGES IN SCHEMA app
            GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO circuit_app
        """
    )
    op.execute("REVOKE ALL ON SCHEMA app FROM PUBLIC")
    # Supabase roles do not exist on local vanilla PostgreSQL.
    op.execute(
        """
        DO $$
        BEGIN
            IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
                EXECUTE 'REVOKE ALL ON SCHEMA app FROM anon';
            END IF;
            IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
                EXECUTE 'REVOKE ALL ON SCHEMA app FROM authenticated';
            END IF;
        END
        $$
        """
    )


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS app.academic_years")
    op.execute("DROP SCHEMA IF EXISTS app")
