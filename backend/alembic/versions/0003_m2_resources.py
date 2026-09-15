"""M2 resource categories, resources, and audit logs.

Revision ID: 0003_m2_resources
Revises: 0002_m1_auth
Create Date: 2026-09-05
"""

from typing import Sequence, Union

from alembic import op

revision: str = "0003_m2_resources"
down_revision: Union[str, Sequence[str], None] = "0002_m1_auth"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        """
        CREATE TABLE app.resource_categories (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            scope TEXT NOT NULL,
            name TEXT NOT NULL,
            description TEXT,
            display_order INTEGER NOT NULL DEFAULT 0,
            is_active BOOLEAN NOT NULL DEFAULT true,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            CONSTRAINT resource_categories_scope_check
                CHECK (scope IN ('ACADEMIC', 'ORGANIZATIONAL')),
            CONSTRAINT resource_categories_scope_name_key UNIQUE (scope, name)
        )
        """
    )

    op.execute(
        """
        CREATE TABLE app.resources (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            category_id UUID NOT NULL REFERENCES app.resource_categories(id),
            title TEXT NOT NULL,
            description TEXT,
            url TEXT NOT NULL,
            resource_type TEXT NOT NULL,
            display_order INTEGER NOT NULL DEFAULT 0,
            is_active BOOLEAN NOT NULL DEFAULT true,
            created_by UUID REFERENCES app.users(id),
            updated_by UUID REFERENCES app.users(id),
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            CONSTRAINT resources_type_check
                CHECK (resource_type IN (
                    'GOOGLE_FORM',
                    'GOOGLE_SHEET',
                    'GOOGLE_DRIVE',
                    'GOOGLE_DOC',
                    'EXTERNAL_LINK'
                )),
            CONSTRAINT resources_url_check
                CHECK (url ~* '^https?://')
        )
        """
    )
    op.execute(
        """
        CREATE INDEX resources_category_active_order_idx
            ON app.resources (category_id, is_active, display_order)
        """
    )

    op.execute(
        """
        CREATE TABLE app.audit_logs (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            actor_user_id UUID REFERENCES app.users(id) ON DELETE SET NULL,
            action TEXT NOT NULL,
            entity_type TEXT NOT NULL,
            entity_id UUID NOT NULL,
            old_value JSONB,
            new_value JSONB,
            ip_address INET,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
        """
    )
    op.execute(
        """
        CREATE INDEX audit_logs_entity_created_idx
            ON app.audit_logs (entity_type, entity_id, created_at DESC)
        """
    )
    op.execute(
        """
        CREATE INDEX audit_logs_created_idx
            ON app.audit_logs (created_at)
        """
    )

    op.execute(
        """
        INSERT INTO app.resource_categories (scope, name, description, display_order)
        VALUES
            ('ACADEMIC', 'General', 'Default academic category', 0),
            ('ORGANIZATIONAL', 'General', 'Default organizational category', 0)
        """
    )


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS app.audit_logs")
    op.execute("DROP TABLE IF EXISTS app.resources")
    op.execute("DROP TABLE IF EXISTS app.resource_categories")
