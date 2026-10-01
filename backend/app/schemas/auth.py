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


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=12, max_length=128)
    full_name: str = Field(min_length=2, max_length=120)


class RegisterResponse(BaseModel):
    ok: bool = True
    message: str = "Account created. You can log in now."


class MeResponse(BaseModel):
    user_id: str
    email: str
    full_name: str
    membership_status: str
    roles: list[str]
    permissions: list[str]
    route_keys: list[str]
