from fastapi import APIRouter, Cookie, Depends, Request, Response, status
from sqlalchemy.orm import Session

from app.auth.cookies import SESSION_COOKIE_NAME, clear_session_cookie, set_session_cookie
from app.auth.deps import AuthContext, get_current_user
from app.db.session import get_db
from app.email.sender import EmailSender, get_email_sender
from app.config import settings
from app.schemas.auth import (
    LoginRequest,
    LoginResponse,
    MeResponse,
    RegisterRequest,
    RegisterResponse,
    VerifyCodeRequest,
    VerifyCodeResponse,
)
from app.services.auth import (
    login_with_password,
    logout_session,
    register_user,
    verify_login_otp,
)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=RegisterResponse, status_code=201)
def register(
    body: RegisterRequest,
    request: Request,
    db: Session = Depends(get_db),
) -> RegisterResponse:
    register_user(
        db,
        email=body.email,
        password=body.password,
        full_name=body.full_name,
        ip_address=request.client.host if request.client else None,
    )
    return RegisterResponse()


@router.post("/login", response_model=LoginResponse)
def login(
    body: LoginRequest,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
    email_sender: EmailSender = Depends(get_email_sender),
) -> LoginResponse:
    verification_required, raw_session, expires_at = login_with_password(
        db,
        email=body.email,
        password=body.password,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
        email_sender=email_sender,
        otp_required=settings.login_otp_required,
    )
    if raw_session is not None and expires_at is not None:
        set_session_cookie(response, raw_session, expires_at)
    return LoginResponse(verification_required=verification_required)


@router.post("/verify-code", response_model=VerifyCodeResponse)
def verify_code(
    body: VerifyCodeRequest,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
) -> VerifyCodeResponse:
    raw_session, expires_at = verify_login_otp(
        db,
        email=body.email,
        code=body.code,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )
    set_session_cookie(response, raw_session, expires_at)
    return VerifyCodeResponse()


@router.get("/me", response_model=MeResponse)
def me(ctx: AuthContext = Depends(get_current_user)) -> MeResponse:
    return MeResponse(
        user_id=str(ctx.user_id),
        email=ctx.email,
        full_name=ctx.full_name,
        membership_status=ctx.membership_status,
        roles=ctx.roles,
        permissions=ctx.permissions,
        route_keys=ctx.route_keys,
    )


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(
    response: Response,
    db: Session = Depends(get_db),
    session_token: str | None = Cookie(default=None, alias=SESSION_COOKIE_NAME),
) -> None:
    if session_token:
        logout_session(db, session_token=session_token)
    clear_session_cookie(response)
