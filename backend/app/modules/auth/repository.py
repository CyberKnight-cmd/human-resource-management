"""DB access for auth: users, refresh_tokens, email_verification_tokens. No business logic here — see service.py."""

from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.auth.schemas import SignupRequest


async def get_user_by_email(db: AsyncSession, email: str):
    raise NotImplementedError


async def get_user_by_employee_code(db: AsyncSession, employee_code: str):
    raise NotImplementedError


async def create_user_and_employee(db: AsyncSession, data: SignupRequest):
    raise NotImplementedError


async def create_email_verification_token(db: AsyncSession, user_id):
    raise NotImplementedError


async def get_valid_verification_token(db: AsyncSession, token: str):
    raise NotImplementedError


async def mark_user_verified(db: AsyncSession, user_id):
    raise NotImplementedError


async def store_refresh_token(db: AsyncSession, *, user_id, jti: str, token_hash: str, issued_at, expires_at):
    raise NotImplementedError


async def get_refresh_token_by_jti(db: AsyncSession, jti: str):
    raise NotImplementedError


async def revoke_refresh_token(db: AsyncSession, jti: str, *, replaced_by_jti: str | None = None):
    raise NotImplementedError


async def revoke_all_refresh_tokens_for_user(db: AsyncSession, user_id):
    raise NotImplementedError
