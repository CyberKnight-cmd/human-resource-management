import uuid
from datetime import datetime, timedelta, timezone
from enum import StrEnum
from typing import Any

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings
from app.core.exceptions import InvalidTokenError

_pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(raw_password: str) -> str:
    return _pwd_context.hash(raw_password)


def verify_password(raw_password: str, hashed_password: str) -> bool:
    return _pwd_context.verify(raw_password, hashed_password)


class TokenType(StrEnum):
    ACCESS = "access"
    REFRESH = "refresh"


def _create_token(*, subject: str, token_type: TokenType, expires_delta: timedelta, secret: str, extra_claims: dict[str, Any] | None = None) -> tuple[str, str, datetime]:
    now = datetime.now(timezone.utc)
    expires_at = now + expires_delta
    jti = str(uuid.uuid4())
    claims: dict[str, Any] = {
        "sub": subject,
        "type": token_type.value,
        "iat": int(now.timestamp()),
        "exp": int(expires_at.timestamp()),
        "jti": jti,
    }
    if extra_claims:
        claims.update(extra_claims)
    token = jwt.encode(claims, secret, algorithm=settings.JWT_ALGORITHM)
    return token, jti, expires_at


def create_access_token(*, user_id: str, role: str) -> tuple[str, str, datetime]:
    """Returns (token, jti, expires_at). Stateless — never checked against the DB."""
    return _create_token(
        subject=user_id,
        token_type=TokenType.ACCESS,
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
        secret=settings.JWT_ACCESS_SECRET,
        extra_claims={"role": role},
    )


def create_refresh_token(*, user_id: str) -> tuple[str, str, datetime]:
    """Returns (token, jti, expires_at). Backed by a `refresh_tokens` DB row so it can be revoked."""
    return _create_token(
        subject=user_id,
        token_type=TokenType.REFRESH,
        expires_delta=timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
        secret=settings.JWT_REFRESH_SECRET,
    )


def decode_token(token: str, expected_type: TokenType) -> dict[str, Any]:
    secret = settings.JWT_ACCESS_SECRET if expected_type == TokenType.ACCESS else settings.JWT_REFRESH_SECRET
    try:
        payload = jwt.decode(token, secret, algorithms=[settings.JWT_ALGORITHM])
    except JWTError as exc:
        raise InvalidTokenError("Token is invalid or expired") from exc

    if payload.get("type") != expected_type.value:
        raise InvalidTokenError(f"Expected a {expected_type.value} token")

    return payload
