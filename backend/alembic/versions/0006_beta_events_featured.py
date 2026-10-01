"""Beta: calendar/flagship events, featured resources, manage_events permission."""

from alembic import op

revision = "0006_beta_events"
down_revision = "0005_beta_feedback_hubs"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        """
        ALTER TABLE app.auth_attempts
        DROP CONSTRAINT IF EXISTS auth_attempts_type_check
        """
    )
    op.execute(
        """
        ALTER TABLE app.auth_attempts
        ADD CONSTRAINT auth_attempts_type_check
            CHECK (attempt_type IN ('LOGIN', 'OTP', 'ACTIVATION', 'REGISTER'))
        """
    )

    op.execute(
        """
        ALTER TABLE app.resources
        ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT false
        """
    )

    op.execute(
        """
        CREATE TABLE app.events (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            title TEXT NOT NULL,
            description TEXT,
            category TEXT NOT NULL,
            starts_on DATE NOT NULL,
            ends_on DATE,
            is_flagship BOOLEAN NOT NULL DEFAULT false,
            image_url TEXT,
            link_url TEXT,
            display_order INTEGER NOT NULL DEFAULT 0,
            is_active BOOLEAN NOT NULL DEFAULT true,
            created_by UUID REFERENCES app.users(id),
            updated_by UUID REFERENCES app.users(id),
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            CONSTRAINT events_category_check
                CHECK (category IN ('ACADEMIC', 'MEMBERSHIP', 'ORGANIZATION', 'EVENT', 'DEADLINE')),
            CONSTRAINT events_date_range_check
                CHECK (ends_on IS NULL OR ends_on >= starts_on)
        )
        """
    )
    op.execute(
        """
        CREATE INDEX events_active_dates
            ON app.events (is_active, starts_on, ends_on)
        """
    )
    op.execute(
        """
        CREATE INDEX events_flagship
            ON app.events (is_flagship, is_active, display_order)
            WHERE is_flagship = true
        """
    )

    op.execute(
        """
        INSERT INTO app.permissions (name, description, kind, required_membership)
        VALUES ('manage_events', 'Manage calendar and flagship events', 'admin_capability', NULL)
        ON CONFLICT (name) DO NOTHING
        """
    )

    for role_name in ("SUPER_ADMIN", "PUBLICITY_ADMIN"):
        op.execute(
            f"""
            INSERT INTO app.role_permissions (role_id, permission_id)
            SELECT r.id, p.id
            FROM app.roles r, app.permissions p
            WHERE r.name = '{role_name}' AND p.name = 'manage_events'
            ON CONFLICT DO NOTHING
            """
        )

    op.execute("GRANT SELECT, INSERT, UPDATE, DELETE ON app.events TO circuit_app")


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS app.events")
    op.execute("ALTER TABLE app.resources DROP COLUMN IF EXISTS is_featured")
    op.execute(
        """
        DELETE FROM app.role_permissions
        WHERE permission_id IN (SELECT id FROM app.permissions WHERE name = 'manage_events')
        """
    )
    op.execute("DELETE FROM app.permissions WHERE name = 'manage_events'")
    op.execute(
        """
        ALTER TABLE app.auth_attempts
        DROP CONSTRAINT IF EXISTS auth_attempts_type_check
        """
    )
    op.execute(
        """
        ALTER TABLE app.auth_attempts
        ADD CONSTRAINT auth_attempts_type_check
            CHECK (attempt_type IN ('LOGIN', 'OTP', 'ACTIVATION'))
        """
    )
