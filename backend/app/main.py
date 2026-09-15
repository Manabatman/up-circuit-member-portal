"""FastAPI application factory.

Layers in this file: HTTP wiring only — middleware, routers, error shape.
Business rules and SQL live in services/ and models/.
"""

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.auth.origins import frontend_origins
from app.config import settings
from app.middleware.csrf import CsrfOriginMiddleware
from app.middleware.security_headers import SecurityHeadersMiddleware
from app.routers import (
    academic_years,
    auth,
    divisions,
    feedback,
    health,
    members,
    resources,
)

_STATUS_TO_CODE = {
    400: "BAD_REQUEST",
    401: "UNAUTHORIZED",
    403: "FORBIDDEN",
    404: "NOT_FOUND",
    409: "CONFLICT",
    422: "VALIDATION_ERROR",
    429: "RATE_LIMITED",
    500: "INTERNAL_ERROR",
}


def create_app() -> FastAPI:
    docs_enabled = settings.app_env != "production"
    application = FastAPI(
        title="UP Circuit Member Portal",
        docs_url="/api/docs" if docs_enabled else None,
        redoc_url="/api/redoc" if docs_enabled else None,
        openapi_url="/api/openapi.json" if docs_enabled else None,
    )

    # Required for the M0 browser slice: Vite (:5173) and FastAPI (:8000)
    # Vite (:5173) and FastAPI (:8000) are different origins — exact allowlist, never "*".
    application.add_middleware(
        CORSMiddleware,
        allow_origins=frontend_origins(),
        allow_credentials=True,
        allow_methods=["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
        allow_headers=["Content-Type"],
    )

    application.add_middleware(CsrfOriginMiddleware)
    application.add_middleware(SecurityHeadersMiddleware)

    application.include_router(health.router, prefix="/api/v1")
    application.include_router(auth.router, prefix="/api/v1")
    application.include_router(academic_years.router, prefix="/api/v1")
    application.include_router(resources.router, prefix="/api/v1")
    application.include_router(divisions.router, prefix="/api/v1")
    application.include_router(members.router, prefix="/api/v1")
    application.include_router(feedback.router, prefix="/api/v1")

    @application.exception_handler(StarletteHTTPException)
    def http_exception_handler(
        _request: Request, exc: StarletteHTTPException
    ) -> JSONResponse:
        return JSONResponse(
            status_code=exc.status_code,
            content=_envelope(
                exc.status_code,
                _message_from_detail(exc.detail),
                code=_code_from_detail(exc.status_code, exc.detail),
            ),
        )

    @application.exception_handler(RequestValidationError)
    def validation_exception_handler(
        _request: Request, exc: RequestValidationError
    ) -> JSONResponse:
        return JSONResponse(
            status_code=422,
            content=_envelope(
                422,
                "Request validation failed.",
                details={"errors": exc.errors()},
            ),
        )

    @application.exception_handler(Exception)
    def unhandled_exception_handler(
        _request: Request, _exc: Exception
    ) -> JSONResponse:
        return JSONResponse(
            status_code=500,
            content=_envelope(500, "An unexpected error occurred."),
        )

    return application


def _message_from_detail(detail: object) -> str:
    if isinstance(detail, dict):
        message = detail.get("message")
        if isinstance(message, str):
            return message
    if isinstance(detail, str):
        return detail
    return "Request failed."


def _code_from_detail(status_code: int, detail: object) -> str:
    if isinstance(detail, dict):
        code = detail.get("code")
        if isinstance(code, str):
            return code
    return _STATUS_TO_CODE.get(status_code, "INTERNAL_ERROR")


def _envelope(
    status_code: int, message: str, details: dict | None = None, code: str | None = None
) -> dict:
    return {
        "error": {
            "code": code or _STATUS_TO_CODE.get(status_code, "INTERNAL_ERROR"),
            "message": message,
            "details": details or {},
        }
    }


app = create_app()
