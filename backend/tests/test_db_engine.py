"""SQLAlchemy engine configuration tests."""

from app.db.session import engine, sqlalchemy_engine_kwargs


def test_sqlalchemy_engine_kwargs() -> None:
    assert sqlalchemy_engine_kwargs() == {
        "pool_pre_ping": True,
        "pool_recycle": 300,
        "pool_size": 5,
        "max_overflow": 5,
    }


def test_runtime_engine_uses_pool_health_settings() -> None:
    pool = engine.pool
    assert pool._pre_ping is True  # noqa: SLF001 — stable QueuePool contract for tests
    assert pool._recycle == 300  # noqa: SLF001
    assert pool.size() == 5
