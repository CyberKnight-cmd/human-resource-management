from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.common.enums import Role
from app.core.dependencies import get_current_user, require_role
from app.db.session import get_db
from app.models.user import User
from app.modules.attendance.repository import AttendanceRepository
from app.modules.attendance.service import AttendanceService
from app.modules.dashboard.schemas import AdminDashboardOut, EmployeeDashboardOut
from app.modules.dashboard.service import DashboardService
from app.modules.leave.repository import LeaveBalanceRepository, LeaveRequestRepository
from app.modules.users.repository import EmployeeRepository

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


def get_dashboard_service(db: AsyncSession = Depends(get_db)) -> DashboardService:
    employee_repo = EmployeeRepository(db)
    attendance_repo = AttendanceRepository(db)
    return DashboardService(
        employee_repo,
        attendance_repo,
        AttendanceService(attendance_repo, employee_repo),
        LeaveBalanceRepository(db),
        LeaveRequestRepository(db),
    )


@router.get("/employee", response_model=EmployeeDashboardOut)
async def get_employee_dashboard(
    current_user: User = Depends(get_current_user),
    service: DashboardService = Depends(get_dashboard_service),
):
    return await service.employee_dashboard(current_user)


@router.get("/admin", response_model=AdminDashboardOut, dependencies=[Depends(require_role(Role.ADMIN))])
async def get_admin_dashboard(
    current_user: User = Depends(get_current_user),
    service: DashboardService = Depends(get_dashboard_service),
):
    return await service.admin_dashboard(current_user)
