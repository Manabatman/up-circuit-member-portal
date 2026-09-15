"""M6 divisions, division-owned resources, and Requests category seed.

Revision ID: 0004_m6_divisions
Revises: 0003_m2_resources
Create Date: 2026-09-06
"""

from typing import Sequence, Union

from alembic import op

revision: str = "0004_m6_divisions"
down_revision: Union[str, Sequence[str], None] = "0003_m2_resources"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

STANDING_DIVISIONS = (
    ("Academic Affairs Division", 0),
    ("External Affairs Division", 1),
    ("Finance Division", 2),
    ("Internal Affairs Division", 3),
    ("Membership Division", 4),
    ("Publicity Division", 5),
)


def upgrade() -> None:
    op.execute(
        """
        CREATE TABLE app.divisions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name TEXT NOT NULL UNIQUE,
            description TEXT,
            display_order INTEGER NOT NULL DEFAULT 0,
            is_active BOOLEAN NOT NULL DEFAULT true,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
        """
    )

    for name, display_order in STANDING_DIVISIONS:
        escaped = name.replace("'", "''")
        op.execute(
            f"""
            INSERT INTO app.divisions (name, display_order)
            VALUES ('{escaped}', {display_order})
            """
        )

    op.execute(
        """
        ALTER TABLE app.resources
            ADD COLUMN division_id UUID REFERENCES app.divisions(id)
        """
    )
    op.execute(
        """
        CREATE INDEX resources_division_active_order_idx
            ON app.resources (division_id, is_active, display_order)
        """
    )

    op.execute(
        """
        INSERT INTO app.resource_categories (scope, name, description, display_order)
        VALUES (
            'ORGANIZATIONAL',
            'Requests',
            'Member request forms (external Google Forms)',
            10
        )
        ON CONFLICT (scope, name) DO NOTHING
        """
    )


def downgrade() -> None:
    op.execute("ALTER TABLE app.resources DROP COLUMN IF EXISTS division_id")
    op.execute("DROP TABLE IF EXISTS app.divisions")
    op.execute(
        """
        DELETE FROM app.resource_categories
        WHERE scope = 'ORGANIZATIONAL' AND name = 'Requests'
        """
    )
