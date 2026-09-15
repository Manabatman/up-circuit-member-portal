"""Argon2 password hashing via pwdlib (ADR-013 provisional params)."""

from pwdlib import PasswordHash

_hasher = PasswordHash.recommended()


def hash_password(plain: str) -> str:
    return _hasher.hash(plain)


def verify_password(plain: str, password_hash: str) -> bool:
    return _hasher.verify(plain, password_hash)


# Fixed dummy hash for timing mitigation when email is unknown.
_DUMMY_HASH = _hasher.hash("__dummy_timing_mitigation__")


def dummy_verify(plain: str) -> None:
    """Run Argon2 verify against a dummy hash (timing attack mitigation)."""
    _hasher.verify(plain, _DUMMY_HASH)
