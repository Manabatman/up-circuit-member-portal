"""Resolve browser origins allowed for CORS and CSRF."""

from app.config import settings


def frontend_origins() -> list[str]:
    """Primary FRONTEND_ORIGIN plus localhost/127.0.0.1 alias in local dev."""
    primary = str(settings.frontend_origin).rstrip("/")
    origins = {primary}
    if settings.app_env == "local":
        if "://localhost:" in primary:
            origins.add(primary.replace("://localhost:", "://127.0.0.1:"))
        elif "://127.0.0.1:" in primary:
            origins.add(primary.replace("://127.0.0.1:", "://localhost:"))
    return sorted(origins)


def origin_allowed(origin: str | None) -> bool:
    if not origin:
        return False
    normalized = origin.rstrip("/")
    return normalized in frontend_origins()
