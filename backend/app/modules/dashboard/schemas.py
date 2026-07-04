from datetime import datetime

from pydantic import BaseModel

from app.common.enums import AttendanceStatus
from app.modules.leave.schemas import LeaveBalanceOut, LeaveRequestOut
from app.modules.users.schemas import EmployeeOut


class EmployeeDashboardOut(BaseModel):
    profile: EmployeeOut
    today_status: AttendanceStatus | None
    checked_in_at: datetime | None
    checked_out_at: datetime | None
    attendance_summary: dict[str, int]
    leave_balances: list[LeaveBalanceOut]
    pending_leave_count: int
    recent_leave_requests: list[LeaveRequestOut]


class AdminDashboardOut(BaseModel):
    total_employees: int
    attendance_today: dict[str, int]
    pending_leave_count: int
    recent_leave_requests: list[LeaveRequestOut]
