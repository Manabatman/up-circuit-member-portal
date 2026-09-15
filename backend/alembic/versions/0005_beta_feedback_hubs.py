"""Beta: feedback, hub standing flag, Executive Board hub, directory primary hub.

Revision ID: 0005_beta_feedback_hubs
Revises: 0004_m6_divisions
Create Date: 2026-09-13

Note: Alembic stores revision ids in version_num VARCHAR(32). Keep this id at most 32 characters.
"""

from typing import Sequence, Union

from alembic import op

revision: str = "0005_beta_feedback_hubs"
down_revision: Union[str, Sequence[str], None] = "0004_m6_divisions"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS app.feedback (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES app.users(id) ON DELETE CASCADE,
            category TEXT NOT NULL,
            message TEXT NOT NULL,
            page_path TEXT NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            CONSTRAINT feedback_category_check
                CHECK (category IN ('broken', 'idea', 'story'))
        )
        """
    )
    op.execute(
        """
        CREATE INDEX IF NOT EXISTS feedback_user_created_idx
            ON app.feedback (user_id, created_at DESC)
        """
    )

    op.execute(
        """
        ALTER TABLE app.divisions
            ADD COLUMN IF NOT EXISTS is_standing_division BOOLEAN NOT NULL DEFAULT true
        """
    )
    op.execute("UPDATE app.divisions SET is_standing_division = true")

    op.execute(
        """
        INSERT INTO app.divisions (name, description, display_order, is_standing_division)
        VALUES (
            'Executive Board',
            'The Executive Board oversees Circuit and its standing divisions.',
            -1,
            false
        )
        ON CONFLICT (name) DO NOTHING
        """
    )

    op.execute(
        """
        ALTER TABLE app.profiles
            ADD COLUMN IF NOT EXISTS primary_division_id UUID REFERENCES app.divisions(id)
        """
    )
    op.execute(
        """
        CREATE INDEX IF NOT EXISTS profiles_primary_division_idx
            ON app.profiles (primary_division_id)
        """
    )


def downgrade() -> None:
    op.execute("ALTER TABLE app.profiles DROP COLUMN IF EXISTS primary_division_id")
    op.execute("DELETE FROM app.divisions WHERE name = 'Executive Board'")
    op.execute("ALTER TABLE app.divisions DROP COLUMN IF EXISTS is_standing_division")
    op.execute("DROP TABLE IF EXISTS app.feedback")
