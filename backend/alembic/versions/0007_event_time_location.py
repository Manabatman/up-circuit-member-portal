"""Add start_time, end_time, and location to calendar events."""

from alembic import op

revision = "0007_event_time_location"
down_revision = "0006_beta_events"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        """
        ALTER TABLE app.events
            ADD COLUMN IF NOT EXISTS start_time TIME,
            ADD COLUMN IF NOT EXISTS end_time TIME,
            ADD COLUMN IF NOT EXISTS location TEXT
        """
    )


def downgrade() -> None:
    op.execute(
        """
        ALTER TABLE app.events
            DROP COLUMN IF EXISTS location,
            DROP COLUMN IF EXISTS end_time,
            DROP COLUMN IF EXISTS start_time
        """
    )
