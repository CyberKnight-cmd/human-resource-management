import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.common.enums import Role
from app.core.dependencies import get_current_user, require_role
from app.db.session import get_db
from app.models.user import User
from app.modules.users import service
from app.modules.users.schemas import EmployeeAdminUpdate, EmployeeOut, EmployeeSelfUpdate

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=EmployeeOut)
async def get_me(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return await service.get_own_profile(db, current_user)


@router.patch("/me", response_model=EmployeeOut)
async def update_me(data: EmployeeSelfUpdate, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return await service.update_own_profile(db, current_user, data)


@router.get("", dependencies=[Depends(require_role(Role.ADMIN))])
async def list_employees(limit: int = 20, offset: int = 0, db: AsyncSession = Depends(get_db)):
    return await service.admin_list_employees(db, limit, offset)


@router.get("/{employee_id}", response_model=EmployeeOut, dependencies=[Depends(require_role(Role.ADMIN))])
async def get_employee(employee_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    return await service.admin_get_employee(db, employee_id)


@router.patch("/{employee_id}", response_model=EmployeeOut, dependencies=[Depends(require_role(Role.ADMIN))])
async def update_employee(employee_id: uuid.UUID, data: EmployeeAdminUpdate, db: AsyncSession = Depends(get_db)):
    return await service.admin_update_employee(db, employee_id, data)
