"""DB access for auth: users, refresh_tokens, email_verification_tokens. No business logic here — see service.py."""

import uuid
from datetime import datetime, timezone

from sqlalchemy import select

from app.common.base_repository import BaseRepository
from app.models.user import EmailVerificationToken, RefreshToken, User


class UserRepository(BaseRepository[User]):
    model = User

    async def get_by_email(self, email: str) -> User | None:
        stmt = select(User).where(User.email == email)
        return (await self._db.execute(stmt)).scalar_one_or_none()

    async def get_by_employee_code(self, employee_code: str) -> User | None:
        stmt = select(User).where(User.employee_code == employee_code)
        return (await self._db.execute(stmt)).scalar_one_or_none()


class EmailVerificationTokenRepository(BaseRepository[EmailVerificationToken]):
    model = EmailVerificationToken

    async def get_valid_by_hash(self, token_hash: str) -> EmailVerificationToken | None:
        # "Valid" is exists + unused + unexpired all at once -- callers shouldn't
        # have to juggle three separate checks to answer one yes/no question.
        stmt = select(EmailVerificationToken).where(
            EmailVerificationToken.token_hash == token_hash,
            EmailVerificationToken.used_at.is_(None),
            EmailVerificationToken.expires_at >= datetime.now(timezone.utc),
        )
        return (await self._db.execute(stmt)).scalar_one_or_none()


class RefreshTokenRepository(BaseRepository[RefreshToken]):
    model = RefreshToken

    async def get_by_jti(self, jti: str) -> RefreshToken | None:
        stmt = select(RefreshToken).where(RefreshToken.jti == jti)
        return (await self._db.execute(stmt)).scalar_one_or_none()

    async def revoke_all_for_user(self, user_id: uuid.UUID) -> None:
        # Reuse-detection nuclear option: a replayed refresh token means the chain
        # is compromised, so every still-live session for this user dies, not just
        # the one that got replayed.
        stmt = select(RefreshToken).where(
            RefreshToken.user_id == user_id,
            RefreshToken.revoked_at.is_(None),
        )
        rows = (await self._db.execute(stmt)).scalars().all()
        now = datetime.now(timezone.utc)
        for row in rows:
            row.revoked_at = now
