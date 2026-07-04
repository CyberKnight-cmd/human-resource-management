from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import app.models  # noqa: F401 — registers every table on Base.metadata before create_all
from app.core.config import settings
from app.core.exceptions import register_exception_handlers
from app.db.base import Base
from app.db.session import engine
from app.modules.attendance.router import router as attendance_router
from app.modules.auth.router import router as auth_router
from app.modules.dashboard.router import router as dashboard_router
from app.modules.leave.router import router as leave_router
from app.modules.payroll.router import router as payroll_router
from app.modules.users.router import router as users_router


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    # Emergency mode: no Alembic migrations checked in yet, so create tables
    # straight from the models on startup. Fine for the local SQLite file this
    # points at by default; swap for real migrations before touching Postgres.
    if settings.DATABASE_URL.startswith("sqlite"):
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
    yield


def create_app() -> FastAPI:
    app = FastAPI(title="HRMS API", version="0.1.0", lifespan=lifespan)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    register_exception_handlers(app)

    for router in (auth_router, users_router, attendance_router, leave_router, payroll_router, dashboard_router):
        app.include_router(router, prefix=settings.API_V1_PREFIX)

    @app.get("/health", tags=["health"])
    async def health():
        return {"status": "ok"}

    return app


app = create_app()
