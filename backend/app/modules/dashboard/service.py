"""Aggregation only — reads from users/employees/attendance/leave; no writes happen here.

Every number here is derived by calling into the module that actually owns it
(AttendanceService for summaries, the Leave repos for balances/requests) rather than
re-deriving the same GROUP BY logic a second time in this module.
"""

from datetime import date

from app.common.enums import LeaveStatus
from app.common.pagination import PageParams
from app.core.exceptions import NotFoundError
from app.models.employee import Employee
from app.models.user import User
from app.modules.attendance.repository import AttendanceRepository
from app.modules.attendance.service import AttendanceService
from app.modules.dashboard.schemas import AdminDashboardOut, EmployeeDashboardOut
from app.modules.leave.repository import LeaveBalanceRepository, LeaveRequestRepository
from app.modules.users.repository import EmployeeRepository


class DashboardService:
    def __init__(
        self,
        employee_repo: EmployeeRepository,
        attendance_repo: AttendanceRepository,
        attendance_service: AttendanceService,
        leave_balance_repo: LeaveBalanceRepository,
        leave_request_repo: LeaveRequestRepository,
    ) -> None:
        self._employee_repo = employee_repo
        self._attendance_repo = attendance_repo
        self._attendance_service = attendance_service
        self._leave_balance_repo = leave_balance_repo
        self._leave_request_repo = leave_request_repo

    async def _resolve_employee(self, user: User) -> Employee:
        employee = await self._employee_repo.get_by_user_id(user.id)
        if employee is None:
            raise NotFoundError("No employee profile is linked to this account")
        return employee

    async def employee_dashboard(self, current_user: User) -> EmployeeDashboardOut:
        employee = await self._resolve_employee(current_user)
        today = date.today()
        month_start = today.replace(day=1)

        today_record = await self._attendance_repo.get_for_date(employee.id, today)
        attendance_summary = await self._attendance_service.get_summary_for_employee(employee.id, month_start, today)
        leave_balances = await self._leave_balance_repo.list_for_employee(employee.id, today.year)
        _, pending_leave_count = await self._leave_request_repo.list_for_employee(
            employee.id, PageParams(limit=1, offset=0), status=LeaveStatus.PENDING
        )
        recent_leave_requests, _ = await self._leave_request_repo.list_for_employee(
            employee.id, PageParams(limit=3, offset=0)
        )

        return EmployeeDashboardOut(
            profile=employee,
            today_status=today_record.status if today_record else None,
            checked_in_at=today_record.check_in_time if today_record else None,
            checked_out_at=today_record.check_out_time if today_record else None,
            attendance_summary=attendance_summary,
            leave_balances=leave_balances,
            pending_leave_count=pending_leave_count,
            recent_leave_requests=recent_leave_requests,
        )

    async def admin_dashboard(self, current_user: User) -> AdminDashboardOut:
        today = date.today()

        total_employees = await self._employee_repo.count_all()
        attendance_today_raw = await self._attendance_repo.get_summary_for_all(today)
        attendance_today = {status.value: count for status, count in attendance_today_raw.items()}
        recent_pending, pending_leave_count = await self._leave_request_repo.list_all(
            LeaveStatus.PENDING, None, PageParams(limit=5, offset=0)
        )

        return AdminDashboardOut(
            total_employees=total_employees,
            attendance_today=attendance_today,
            pending_leave_count=pending_leave_count,
            recent_leave_requests=recent_pending,
        )
