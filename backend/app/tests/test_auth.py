# Auth module test suite.
# Signup/verify/login/refresh/logout is the one flow every other module silently
# depends on -- if a token gets minted for the wrong user, or a revoked refresh
# token is ever honored again, every other module's auth checks are lying.

import uuid
from datetime import datetime, timedelta, timezone

import pytest
from fastapi import BackgroundTasks
from pydantic import ValidationError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ConflictError, InvalidCredentialsError, InvalidTokenError
from app.core.security import TokenType, create_refresh_token, decode_token, hash_password
from app.models.user import EmailVerificationToken, RefreshToken, User
from app.modules.auth.repository import EmailVerificationTokenRepository, RefreshTokenRepository, UserRepository
from app.modules.auth.schemas import LoginRequest, LogoutRequest, RefreshRequest, SignupRequest
from app.modules.auth.service import AuthService, _hash_token
from app.modules.users.repository import EmployeeRepository


def make_service(db_session: AsyncSession) -> AuthService:
    return AuthService(
        UserRepository(db_session),
        EmployeeRepository(db_session),
        EmailVerificationTokenRepository(db_session),
        RefreshTokenRepository(db_session),
    )


async def make_verified_user(db_session: AsyncSession, *, email="verified@example.com", password="Str0ng!Pass") -> User:
    repo = UserRepository(db_session)
    user = await repo.add(
        User(
            employee_code=f"EMP{uuid.uuid4().hex[:6]}",
            email=email,
            hashed_password=hash_password(password),
            is_email_verified=True,
        )
    )
    return user


# ---------------------------------------------------------------------------
# schema-level guards
# ---------------------------------------------------------------------------


@pytest.mark.parametrize(
    "password",
    ["short1!", "alllowercase1!", "NoDigitsHere!", "NoSpecialChar1"],
)
def test_signup_schema_rejects_weak_password(password):
    with pytest.raises(ValidationError):
        SignupRequest(employee_code="EMP0001", email="a@example.com", password=password, role="employee")


def test_signup_schema_accepts_strong_password():
    req = SignupRequest(employee_code="EMP0001", email="a@example.com", password="Str0ng!Pass", role="employee")
    assert req.password == "Str0ng!Pass"


# ---------------------------------------------------------------------------
# signup
# ---------------------------------------------------------------------------


async def test_signup_creates_user_employee_and_verification_token(db_session):
    service = make_service(db_session)
    background_tasks = BackgroundTasks()

    await service.signup(
        SignupRequest(employee_code="EMP0001", email="new@example.com", password="Str0ng!Pass", role="employee"),
        background_tasks,
    )

    user = await UserRepository(db_session).get_by_email("new@example.com")
    assert user is not None
    assert user.is_email_verified is False

    employee = await EmployeeRepository(db_session).get_by_user_id(user.id)
    assert employee is not None
    assert employee.first_name == ""

    # The verification email was queued, not sent inline.
    assert len(background_tasks.tasks) == 1


async def test_signup_rejects_duplicate_email(db_session):
    service = make_service(db_session)
    await make_verified_user(db_session, email="dupe@example.com")

    with pytest.raises(ConflictError):
        await service.signup(
            SignupRequest(employee_code="EMP9999", email="dupe@example.com", password="Str0ng!Pass", role="employee"),
            BackgroundTasks(),
        )


async def test_signup_rejects_duplicate_employee_code(db_session):
    service = make_service(db_session)
    await service.signup(
        SignupRequest(employee_code="EMP0001", email="first@example.com", password="Str0ng!Pass", role="employee"),
        BackgroundTasks(),
    )

    with pytest.raises(ConflictError):
        await service.signup(
            SignupRequest(employee_code="EMP0001", email="second@example.com", password="Str0ng!Pass", role="employee"),
            BackgroundTasks(),
        )


# ---------------------------------------------------------------------------
# verify_email
# ---------------------------------------------------------------------------


async def test_verify_email_marks_user_verified(db_session):
    service = make_service(db_session)
    background_tasks = BackgroundTasks()
    await service.signup(
        SignupRequest(employee_code="EMP0001", email="verify@example.com", password="Str0ng!Pass", role="employee"),
        background_tasks,
    )
    raw_token = background_tasks.tasks[0].args[1].split("token=")[1]

    await service.verify_email(raw_token)

    user = await UserRepository(db_session).get_by_email("verify@example.com")
    assert user.is_email_verified is True


async def test_verify_email_rejects_unknown_token(db_session):
    service = make_service(db_session)
    with pytest.raises(InvalidTokenError):
        await service.verify_email("not-a-real-token")


async def test_verify_email_rejects_expired_token(db_session):
    service = make_service(db_session)
    user = await make_verified_user(db_session, email="expired@example.com")
    user.is_email_verified = False

    raw_token = "expired-raw-token"
    await EmailVerificationTokenRepository(db_session).add(
        EmailVerificationToken(
            user_id=user.id,
            token_hash=_hash_token(raw_token),
            expires_at=datetime.now(timezone.utc) - timedelta(hours=1),
        )
    )

    with pytest.raises(InvalidTokenError):
        await service.verify_email(raw_token)


# ---------------------------------------------------------------------------
# login
# ---------------------------------------------------------------------------


async def test_login_succeeds_and_persists_refresh_token(db_session):
    service = make_service(db_session)
    await make_verified_user(db_session, email="login@example.com", password="Str0ng!Pass")

    pair = await service.login(LoginRequest(email="login@example.com", password="Str0ng!Pass"))

    assert pair.access_token
    assert pair.refresh_token
    assert pair.token_type == "bearer"


async def test_login_rejects_wrong_password(db_session):
    service = make_service(db_session)
    await make_verified_user(db_session, email="login2@example.com", password="Str0ng!Pass")

    with pytest.raises(InvalidCredentialsError):
        await service.login(LoginRequest(email="login2@example.com", password="WrongPassword1!"))


async def test_login_rejects_unknown_email(db_session):
    service = make_service(db_session)
    with pytest.raises(InvalidCredentialsError):
        await service.login(LoginRequest(email="ghost@example.com", password="Str0ng!Pass"))


async def test_login_rejects_unverified_email(db_session):
    service = make_service(db_session)
    repo = UserRepository(db_session)
    await repo.add(
        User(
            employee_code="EMP0002",
            email="unverified@example.com",
            hashed_password=hash_password("Str0ng!Pass"),
            is_email_verified=False,
        )
    )

    with pytest.raises(InvalidCredentialsError):
        await service.login(LoginRequest(email="unverified@example.com", password="Str0ng!Pass"))


# ---------------------------------------------------------------------------
# refresh (rotation + reuse detection)
# ---------------------------------------------------------------------------


async def test_refresh_rotates_token_and_revokes_old_row(db_session):
    service = make_service(db_session)
    user = await make_verified_user(db_session, email="rotate@example.com", password="Str0ng!Pass")
    pair = await service.login(LoginRequest(email="rotate@example.com", password="Str0ng!Pass"))

    new_pair = await service.refresh(RefreshRequest(refresh_token=pair.refresh_token))

    assert new_pair.refresh_token != pair.refresh_token

    old_jti = decode_token(pair.refresh_token, TokenType.REFRESH)["jti"]
    old_row = await RefreshTokenRepository(db_session).get_by_jti(old_jti)
    assert old_row.revoked_at is not None
    assert old_row.replaced_by_jti is not None


async def test_refresh_reuse_of_revoked_token_revokes_entire_chain(db_session):
    service = make_service(db_session)
    user = await make_verified_user(db_session, email="reuse@example.com", password="Str0ng!Pass")
    pair = await service.login(LoginRequest(email="reuse@example.com", password="Str0ng!Pass"))

    await service.refresh(RefreshRequest(refresh_token=pair.refresh_token))

    # Replaying the now-revoked original refresh token is theft -- must fail and
    # nuke every live session for the user.
    with pytest.raises(InvalidTokenError):
        await service.refresh(RefreshRequest(refresh_token=pair.refresh_token))

    rows = (
        (await db_session.execute(select(RefreshToken).where(RefreshToken.user_id == user.id)))
        .scalars()
        .all()
    )
    assert all(row.revoked_at is not None for row in rows)


async def test_refresh_rejects_unknown_jti(db_session):
    service = make_service(db_session)
    user = await make_verified_user(db_session, email="unknown@example.com")
    fake_refresh_token, _, _ = create_refresh_token(user_id=str(user.id))

    with pytest.raises(InvalidTokenError):
        await service.refresh(RefreshRequest(refresh_token=fake_refresh_token))


# ---------------------------------------------------------------------------
# logout
# ---------------------------------------------------------------------------


async def test_logout_revokes_refresh_token(db_session):
    service = make_service(db_session)
    await make_verified_user(db_session, email="logout@example.com", password="Str0ng!Pass")
    pair = await service.login(LoginRequest(email="logout@example.com", password="Str0ng!Pass"))

    await service.logout(LogoutRequest(refresh_token=pair.refresh_token))

    with pytest.raises(InvalidTokenError):
        await service.refresh(RefreshRequest(refresh_token=pair.refresh_token))
