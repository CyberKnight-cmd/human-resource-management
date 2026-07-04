import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.common.audit import AuditLogger
from app.common.enums import Role
from app.core.dependencies import get_current_user, require_role
from app.db.session import get_db
from app.models.user import User
from app.modules.payroll.repository import SalaryStructureRepository
from app.modules.payroll.schemas import SalaryStructureOut, SalaryStructureUpdate
from app.modules.payroll.service import PayrollService
from app.modules.users.repository import EmployeeRepository

router = APIRouter(prefix="/payroll", tags=["payroll"])


def get_payroll_service(db: AsyncSession = Depends(get_db)) -> PayrollService:
    """Composition root, same shape as every other module's — wire the concretes here,
    once, so route handlers only ever depend on PayrollService."""
    return PayrollService(SalaryStructureRepository(db), EmployeeRepository(db), AuditLogger(db))


@router.get("/me", response_model=SalaryStructureOut)
async def get_my_payroll(
    current_user: User = Depends(get_current_user),
    service: PayrollService = Depends(get_payroll_service),
):
    return await service.get_my_payroll(current_user)


@router.get("/{employee_id}", response_model=list[SalaryStructureOut], dependencies=[Depends(require_role(Role.ADMIN))])
async def get_employee_payroll(employee_id: uuid.UUID, service: PayrollService = Depends(get_payroll_service)):
    return await service.admin_get_payroll(employee_id)


@router.put("/{employee_id}", response_model=SalaryStructureOut, dependencies=[Depends(require_role(Role.ADMIN))])
async def update_employee_payroll(
    employee_id: uuid.UUID,
    data: SalaryStructureUpdate,
    admin: User = Depends(get_current_user),
    service: PayrollService = Depends(get_payroll_service),
):
    return await service.admin_update_payroll(admin, employee_id, data)
