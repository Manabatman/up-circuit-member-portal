"""Catch unhandled exceptions inside the app stack so responses keep CORS headers."""

from __future__ import annotations

import logging
import traceback

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse, Response

_log = logging.getLogger("uvicorn.error")

_ENVELOPE = {
    "error": {
        "code": "INTERNAL_ERROR",
        "message": "An unexpected error occurred.",
        "details": {},
    }
}


class UnhandledExceptionMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        try:
            return await call_next(request)
        except Exception:
            _log.error("Unhandled exception on %s %s", request.method, request.url.path)
            _log.error(traceback.format_exc())
            return JSONResponse(status_code=500, content=_ENVELOPE)
