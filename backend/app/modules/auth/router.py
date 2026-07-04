from fastapi import APIRouter, BackgroundTasks, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.modules.auth.repository import EmailVerificationTokenRepository, RefreshTokenRepository, UserRepository
from app.modules.auth.schemas import LoginRequest, LogoutRequest, RefreshRequest, SignupRequest, TokenPair
from app.modules.auth.service import AuthService
from app.modules.users.repository import EmployeeRepository

router = APIRouter(prefix="/auth", tags=["auth"])


def get_auth_service(db: AsyncSession = Depends(get_db)) -> AuthService:
    """Composition root for this module -- same idea as Leave's and Attendance's: wire
    the concrete repositories into one service, and never let a route handler see
    anything below that service."""
    return AuthService(
        UserRepository(db),
        EmployeeRepository(db),
        EmailVerificationTokenRepository(db),
        RefreshTokenRepository(db),
    )


@router.post("/signup", status_code=status.HTTP_201_CREATED)
async def signup(
    data: SignupRequest,
    background_tasks: BackgroundTasks,
    service: AuthService = Depends(get_auth_service),
):
    await service.signup(data, background_tasks)


@router.get("/verify-email")
async def verify_email(token: str, service: AuthService = Depends(get_auth_service)):
    await service.verify_email(token)


@router.post("/login", response_model=TokenPair)
async def login(data: LoginRequest, service: AuthService = Depends(get_auth_service)):
    return await service.login(data)


@router.post("/refresh", response_model=TokenPair)
async def refresh(data: RefreshRequest, service: AuthService = Depends(get_auth_service)):
    return await service.refresh(data)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(data: LogoutRequest, service: AuthService = Depends(get_auth_service)):
    await service.logout(data)
