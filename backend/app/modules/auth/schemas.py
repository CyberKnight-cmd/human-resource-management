from pydantic import BaseModel, EmailStr, field_validator

from app.common.enums import Role


class SignupRequest(BaseModel):
    employee_code: str
    email: EmailStr
    password: str
    role: Role

    @field_validator("password")
    @classmethod
    def _validate_password_strength(cls, value: str) -> str:
        # Mirrors Architecture/BACKEND_ARCHITECTURE.md §5.1: min 8 chars, >=1 upper,
        # >=1 digit, >=1 special char. Checked here so a weak password never even
        # reaches the service layer.
        if len(value) < 8:
            raise ValueError("Password must be at least 8 characters long")
        if not any(c.isupper() for c in value):
            raise ValueError("Password must contain at least one uppercase letter")
        if not any(c.isdigit() for c in value):
            raise ValueError("Password must contain at least one digit")
        if not any(not c.isalnum() for c in value):
            raise ValueError("Password must contain at least one special character")
        return value


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str


class LogoutRequest(BaseModel):
    refresh_token: str
