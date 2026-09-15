"""CSRF protection via Origin allowlist on mutating requests (Section 8)."""

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse, Response

from app.auth.origins import origin_allowed

_MUTATING = {"POST", "PUT", "PATCH", "DELETE"}


class CsrfOriginMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        if request.method in _MUTATING:
            if not origin_allowed(request.headers.get("origin")):
                return JSONResponse(
                    status_code=403,
                    content={
                        "error": {
                            "code": "FORBIDDEN",
                            "message": "Origin not allowed.",
                            "details": {},
                        }
                    },
                )
        return await call_next(request)
