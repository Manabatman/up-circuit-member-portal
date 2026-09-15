"""Audit log recording with PII-safe redaction."""

from __future__ import annotations

import uuid

from sqlalchemy.orm import Session

from app.models.audit_log import AuditLog

SENSITIVE_FIELDS = frozenset({"contact_number", "student_number", "full_name"})


def _redact(value: dict | None) -> dict | None:
    if value is None:
        return None
    changed = [key for key in value if key in SENSITIVE_FIELDS]
    if not changed:
        return value
    return {"changed": changed}


def record(
    db: Session,
    *,
    actor_user_id: uuid.UUID | None,
    action: str,
    entity_type: str,
    entity_id: uuid.UUID,
    old_value: dict | None = None,
    new_value: dict | None = None,
    ip_address: str | None = None,
) -> AuditLog:
    row = AuditLog(
        actor_user_id=actor_user_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        old_value=_redact(old_value),
        new_value=_redact(new_value),
        ip_address=ip_address,
    )
    db.add(row)
    return row
