import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.common.enums import Role
from app.core.dependencies import get_current_user, require_role
from app.db.session import get_db
from app.models.user import User
from app.modules.payroll import service
from app.modules.payroll.schemas import SalaryStructureOut, SalaryStructureUpdate

router = APIRouter(prefix="/payroll", tags=["payroll"])


@router.get("/me", response_model=SalaryStructureOut)
async def get_my_payroll(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return await service.get_my_payroll(db, current_user)


@router.get("/{employee_id}", response_model=SalaryStructureOut, dependencies=[Depends(require_role(Role.ADMIN))])
async def get_employee_payroll(employee_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    return await service.admin_get_payroll(db, employee_id)


@router.put("/{employee_id}", response_model=SalaryStructureOut, dependencies=[Depends(require_role(Role.ADMIN))])
async def update_employee_payroll(employee_id: uuid.UUID, data: SalaryStructureUpdate, admin: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return await service.admin_update_payroll(db, admin, employee_id, data)
