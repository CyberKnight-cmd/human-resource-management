from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import settings

engine = create_async_engine(settings.DATABASE_URL, echo=settings.ENV == "development", future=True)

AsyncSessionLocal = async_sessionmaker(bind=engine, expire_on_commit=False, autoflush=False)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """One session per request = one transaction per request: commits only if the
    route handler completes without raising, rolls back otherwise. Services never
    call commit()/rollback() themselves — that would let a partial write from one
    layer leak past an error raised by another."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            # If we got here, the handler didn't throw — safe to make it permanent.
            await session.commit()
        except Exception:
            # Something upstream blew up. Whatever half-written rows are sitting in
            # this session die here, not in the database.
            await session.rollback()
            raise
