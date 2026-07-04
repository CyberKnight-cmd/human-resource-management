"""Business logic for signup / email verification / login / refresh (rotation) / logout.

See Architecture/BACKEND_ARCHITECTURE.md §5 for the full JWT claim shapes and rotation/reuse-detection rules.
"""

from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.auth.schemas import LoginRequest, LogoutRequest, RefreshRequest, SignupRequest, TokenPair


async def signup(db: AsyncSession, data: SignupRequest) -> None:
    # TODO: check email/employee_code uniqueness, hash_password(), create user+employee,
    # create email_verification_token, send verification email via BackgroundTasks.
    raise NotImplementedError


async def verify_email(db: AsyncSession, token: str) -> None:
    # TODO: hash token, look up email_verification_tokens, check expiry/used_at, mark user verified.
    raise NotImplementedError


async def login(db: AsyncSession, data: LoginRequest) -> TokenPair:
    # TODO: fetch user by email, verify_password(), check is_active/is_email_verified,
    # create_access_token() + create_refresh_token(), persist refresh token row.
    raise NotImplementedError


async def refresh(db: AsyncSession, data: RefreshRequest) -> TokenPair:
    # TODO: decode_token(type=refresh), look up by jti, reject if revoked/expired,
    # rotate: revoke old row, issue + store new pair.
    raise NotImplementedError


async def logout(db: AsyncSession, data: LogoutRequest) -> None:
    # TODO: decode_token(type=refresh), revoke the matching refresh_tokens row.
    raise NotImplementedError
