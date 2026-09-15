from pydantic import BaseModel, EmailStr, Field


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=12, max_length=128)


class LoginResponse(BaseModel):
    verification_required: bool


class VerifyCodeRequest(BaseModel):
    email: EmailStr
    code: str = Field(min_length=6, max_length=6, pattern=r"^\d{6}$")


class VerifyCodeResponse(BaseModel):
    ok: bool = True


class MeResponse(BaseModel):
    user_id: str
    email: str
    full_name: str
    membership_status: str
    roles: list[str]
    permissions: list[str]
    route_keys: list[str]
