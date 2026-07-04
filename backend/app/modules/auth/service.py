"""Business logic for signup / email verification / login / refresh (rotation) / logout.

See Architecture/BACKEND_ARCHITECTURE.md §5 for the full JWT claim shapes and rotation/reuse-detection rules.
"""

import hashlib
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import BackgroundTasks

from app.core.config import settings
from app.core.exceptions import ConflictError, InvalidCredentialsError, InvalidTokenError
from app.core.mail import send_verification_email
from app.core.security import (
    TokenType,
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.models.employee import Employee
from app.models.user import RefreshToken, User
from app.models.user import EmailVerificationToken as EmailVerificationTokenModel
from app.modules.auth.repository import EmailVerificationTokenRepository, RefreshTokenRepository, UserRepository
from app.modules.auth.schemas import LoginRequest, LogoutRequest, RefreshRequest, SignupRequest, TokenPair
from app.modules.users.repository import EmployeeRepository


def _hash_token(raw_token: str) -> str:
    # SHA-256 of the raw token -- same "never persist the raw value" rule as
    # refresh tokens. A DB leak shouldn't hand out working verification links.
    return hashlib.sha256(raw_token.encode()).hexdigest()


class AuthService:
    def __init__(
        self,
        user_repo: UserRepository,
        employee_repo: EmployeeRepository,
        verification_repo: EmailVerificationTokenRepository,
        refresh_repo: RefreshTokenRepository,
    ) -> None:
        self._user_repo = user_repo
        self._employee_repo = employee_repo
        self._verification_repo = verification_repo
        self._refresh_repo = refresh_repo

    async def signup(self, data: SignupRequest, background_tasks: BackgroundTasks) -> None:
        if await self._user_repo.get_by_email(data.email) is not None:
            raise ConflictError("Email is already registered")
        if await self._user_repo.get_by_employee_code(data.employee_code) is not None:
            raise ConflictError("Employee code is already registered")

        user = User(
            employee_code=data.employee_code,
            email=data.email,
            hashed_password=hash_password(data.password),
            role=data.role,
            is_email_verified=False,
        )
        user = await self._user_repo.add(user)

        # Blank profile -- first/last name etc. get filled in later via PATCH /users/me.
        await self._employee_repo.add(Employee(user_id=user.id, first_name="", last_name=""))

        raw_token = secrets.token_urlsafe(32)
        expires_at = datetime.now(timezone.utc) + timedelta(hours=settings.EMAIL_VERIFICATION_TOKEN_EXPIRE_HOURS)
        await self._verification_repo.add(
            EmailVerificationTokenModel(user_id=user.id, token_hash=_hash_token(raw_token), expires_at=expires_at)
        )

        verification_link = f"{settings.FRONTEND_BASE_URL}/verify-email?token={raw_token}"
        background_tasks.add_task(send_verification_email, user.email, verification_link)

    async def verify_email(self, token: str) -> None:
        record = await self._verification_repo.get_valid_by_hash(_hash_token(token))
        if record is None:
            raise InvalidTokenError("Verification link is invalid or expired")

        user = await self._user_repo.get_by_id(record.user_id)
        if user is None:
            raise InvalidTokenError("Verification link is invalid or expired")

        user.is_email_verified = True
        record.used_at = datetime.now(timezone.utc)
        await self._user_repo.add(user)

    async def login(self, data: LoginRequest) -> TokenPair:
        user = await self._user_repo.get_by_email(data.email)
        # Same error for "no such email" and "wrong password" -- an attacker probing
        # for valid emails shouldn't be able to tell the two cases apart.
        if user is None or not verify_password(data.password, user.hashed_password):
            raise InvalidCredentialsError("Invalid email or password")
        if not user.is_active:
            raise InvalidCredentialsError("This account has been deactivated")
        if not user.is_email_verified:
            raise InvalidCredentialsError("Please verify your email before logging in")

        return await self._issue_token_pair(user)

    async def _issue_token_pair(self, user: User) -> TokenPair:
        access_token, _, _ = create_access_token(user_id=str(user.id), role=user.role.value)
        refresh_token, jti, expires_at = create_refresh_token(user_id=str(user.id))

        await self._refresh_repo.add(
            RefreshToken(
                user_id=user.id,
                jti=jti,
                token_hash=_hash_token(refresh_token),
                issued_at=datetime.now(timezone.utc),
                expires_at=expires_at,
            )
        )
        return TokenPair(access_token=access_token, refresh_token=refresh_token)

    async def refresh(self, data: RefreshRequest) -> TokenPair:
        payload = decode_token(data.refresh_token, TokenType.REFRESH)
        jti = payload["jti"]

        row = await self._refresh_repo.get_by_jti(jti)
        if row is None:
            raise InvalidTokenError("Refresh token is invalid")

        now = datetime.now(timezone.utc)
        if row.revoked_at is not None:
            # Already-rotated token being replayed -- that's theft. Kill every live
            # session for this user, not just the one that got replayed.
            await self._refresh_repo.revoke_all_for_user(row.user_id)
            raise InvalidTokenError("Refresh token has already been used; all sessions revoked")

        # Some DB drivers (SQLite) hand back naive datetimes even out of a tz-aware
        # column -- re-attach UTC before comparing, same fix as Attendance's check_out().
        expires_at = row.expires_at
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        if expires_at <= now:
            raise InvalidTokenError("Refresh token has expired")

        user = await self._user_repo.get_by_id(row.user_id)
        if user is None or not user.is_active:
            raise InvalidTokenError("User not found or deactivated")

        new_pair = await self._issue_token_pair(user)
        new_payload = decode_token(new_pair.refresh_token, TokenType.REFRESH)

        row.revoked_at = now
        row.replaced_by_jti = new_payload["jti"]

        return new_pair

    async def logout(self, data: LogoutRequest) -> None:
        payload = decode_token(data.refresh_token, TokenType.REFRESH)
        row = await self._refresh_repo.get_by_jti(payload["jti"])
        if row is not None and row.revoked_at is None:
            row.revoked_at = datetime.now(timezone.utc)
