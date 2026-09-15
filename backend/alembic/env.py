"""Alembic runtime.

Migrations connect as circuit_migrator (MIGRATOR_DATABASE_URL).
The FastAPI process never uses this URL.

The version table lives in schema app. That schema must exist before
Alembic can write alembic_version, so we CREATE SCHEMA IF NOT EXISTS
here. The first migration also creates the schema so a dump of the
migration file remains self-explanatory.
"""

from alembic import context
from sqlalchemy import create_engine, text

from app.config import settings

config = context.config


def run_migrations_offline() -> None:
    url = settings.sqlalchemy_migrator_url()
    context.configure(
        url=url,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        version_table_schema="app",
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    connectable = create_engine(settings.sqlalchemy_migrator_url())
    with connectable.connect() as connection:
        connection.execute(text("CREATE SCHEMA IF NOT EXISTS app"))
        connection.commit()
        context.configure(
            connection=connection,
            version_table_schema="app",
        )
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
