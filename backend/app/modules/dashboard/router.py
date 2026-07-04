from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.common.enums import Role
from app.core.dependencies import get_current_user, require_role
from app.db.session import get_db
from app.models.user import User
from app.modules.dashboard import service

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/employee")
async def get_employee_dashboard(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return await service.employee_dashboard(db, current_user)


@router.get("/admin", dependencies=[Depends(require_role(Role.ADMIN))])
async def get_admin_dashboard(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return await service.admin_dashboard(db, current_user)
