"""Structured HTTP errors with explicit error codes in the envelope."""

from fastapi import HTTPException


def app_http_exception(status_code: int, message: str, code: str) -> HTTPException:
    return HTTPException(
        status_code=status_code,
        detail={"message": message, "code": code},
    )
