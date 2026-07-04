from collections.abc import AsyncGenerator, Awaitable, Callable

import pytest_asyncio
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

import app.models  # noqa: F401 — registers every table on Base.metadata before create_all
from app.common.enums import Role
from app.db.base import Base
from app.models.employee import Employee
from app.models.user import User


@pytest_asyncio.fixture
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    """A fresh in-memory SQLite database per test — full isolation, no shared state,
    no external services required. Models use portable SQLAlchemy types (Uuid, JSON
    with a postgres-only JSONB variant) specifically so this works without Postgres.
    No docker, no `createdb`, no "works on my machine" — `pip install` and go."""
    engine = create_async_engine(
        "sqlite+aiosqlite://",
        # StaticPool = every connection this engine hands out shares the same
        # in-memory database. Skip it and each connection gets its OWN empty
        # database, and half your queries 404 on tables that "don't exist".
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    session_factory = async_sessionmaker(bind=engine, expire_on_commit=False)
    async with session_factory() as session:
        yield session

    await engine.dispose()


@pytest_asyncio.fixture
async def make_employee(db_session: AsyncSession) -> Callable[..., Awaitable[tuple[User, Employee]]]:
    """Factory fixture: `user, employee = await make_employee()` — call it again for a second employee.
    Every test that needs "some employee to check in" gets one in a single line, instead
    of five lines of User(...)/Employee(...) boilerplate copy-pasted into every test."""
    counter = {"n": 0}

    async def _make(role: Role = Role.EMPLOYEE) -> tuple[User, Employee]:
        counter["n"] += 1
        n = counter["n"]

        user = User(
            employee_code=f"EMP{n:04d}",
            email=f"user{n}@example.com",
            hashed_password="not-a-real-hash",
            role=role,
            is_email_verified=True,
        )
        db_session.add(user)
        await db_session.flush()

        employee = Employee(user_id=user.id, first_name="Test", last_name=f"User{n}")
        db_session.add(employee)
        await db_session.flush()

        return user, employee

    return _make
