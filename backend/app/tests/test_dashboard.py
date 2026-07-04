# Dashboard module test suite.
# This module owns zero tables -- every assertion here is really testing that the
# aggregation wiring (which repo/service gets called, with which employee_id, for
# which date range) is correct, not re-testing attendance/leave business rules that
# already have their own suites.

from datetime import date, timedelta

from sqlalchemy.ext.asyncio import AsyncSession

from app.common.enums import AttendanceStatus, LeaveStatus, LeaveType
from app.models.attendance import AttendanceRecord
from app.models.leave import LeaveBalance, LeaveRequest
from app.modules.attendance.repository import AttendanceRepository
from app.modules.attendance.service import AttendanceService
from app.modules.dashboard.service import DashboardService
from app.modules.leave.repository import LeaveBalanceRepository, LeaveRequestRepository
from app.modules.users.repository import EmployeeRepository

TODAY = date.today()


def make_service(db_session: AsyncSession) -> DashboardService:
    employee_repo = EmployeeRepository(db_session)
    attendance_repo = AttendanceRepository(db_session)
    return DashboardService(
        employee_repo,
        attendance_repo,
        AttendanceService(attendance_repo, employee_repo),
        LeaveBalanceRepository(db_session),
        LeaveRequestRepository(db_session),
    )


async def add_leave_request(db_session, employee_id, status=LeaveStatus.PENDING, start=TODAY, days_ago=0):
    request = LeaveRequest(
        employee_id=employee_id,
        leave_type=LeaveType.PAID,
        start_date=start - timedelta(days=days_ago),
        end_date=start - timedelta(days=days_ago),
        days_count=1.0,
        status=status,
    )
    db_session.add(request)
    await db_session.flush()
    return request


# ---------------------------------------------------------------------------
# employee_dashboard
# ---------------------------------------------------------------------------


async def test_employee_dashboard_with_no_data_yet_returns_zeroed_shape(db_session: AsyncSession, make_employee):
    user, employee = await make_employee()
    service = make_service(db_session)

    dashboard = await service.employee_dashboard(user)

    assert dashboard.profile.id == employee.id
    assert dashboard.today_status is None
    assert dashboard.checked_in_at is None
    assert dashboard.pending_leave_count == 0
    assert dashboard.recent_leave_requests == []
    assert dashboard.attendance_summary["present"] == 0


async def test_employee_dashboard_reflects_todays_check_in(db_session: AsyncSession, make_employee):
    user, employee = await make_employee()
    db_session.add(AttendanceRecord(employee_id=employee.id, date=TODAY, status=AttendanceStatus.PRESENT))
    await db_session.flush()
    service = make_service(db_session)

    dashboard = await service.employee_dashboard(user)

    assert dashboard.today_status == AttendanceStatus.PRESENT


async def test_employee_dashboard_counts_only_this_employees_pending_leave(
    db_session: AsyncSession, make_employee
):
    user, employee = await make_employee()
    _, other_employee = await make_employee()
    await add_leave_request(db_session, employee.id, status=LeaveStatus.PENDING)
    await add_leave_request(db_session, employee.id, status=LeaveStatus.APPROVED, days_ago=1)
    await add_leave_request(db_session, other_employee.id, status=LeaveStatus.PENDING)
    service = make_service(db_session)

    dashboard = await service.employee_dashboard(user)

    assert dashboard.pending_leave_count == 1
    assert len(dashboard.recent_leave_requests) == 2


async def test_employee_dashboard_leave_balances_scoped_to_current_year(db_session: AsyncSession, make_employee):
    user, employee = await make_employee()
    db_session.add(
        LeaveBalance(employee_id=employee.id, leave_type=LeaveType.PAID, year=TODAY.year, total_allocated=10, used=2)
    )
    await db_session.flush()
    service = make_service(db_session)

    dashboard = await service.employee_dashboard(user)

    assert len(dashboard.leave_balances) == 1
    assert dashboard.leave_balances[0].leave_type == LeaveType.PAID


# ---------------------------------------------------------------------------
# admin_dashboard
# ---------------------------------------------------------------------------


async def test_admin_dashboard_headcount_counts_every_employee(db_session: AsyncSession, make_employee):
    for _ in range(4):
        await make_employee()
    admin, _ = await make_employee()
    service = make_service(db_session)

    dashboard = await service.admin_dashboard(admin)

    assert dashboard.total_employees == 5


async def test_admin_dashboard_attendance_today_is_org_wide_not_per_employee(
    db_session: AsyncSession, make_employee
):
    admin, _ = await make_employee()
    _, employee_a = await make_employee()
    _, employee_b = await make_employee()
    db_session.add(AttendanceRecord(employee_id=employee_a.id, date=TODAY, status=AttendanceStatus.PRESENT))
    db_session.add(AttendanceRecord(employee_id=employee_b.id, date=TODAY, status=AttendanceStatus.ABSENT))
    # Yesterday's record for employee_a shouldn't leak into "today"'s snapshot.
    db_session.add(
        AttendanceRecord(employee_id=employee_a.id, date=TODAY - timedelta(days=1), status=AttendanceStatus.ABSENT)
    )
    await db_session.flush()
    service = make_service(db_session)

    dashboard = await service.admin_dashboard(admin)

    assert dashboard.attendance_today["present"] == 1
    assert dashboard.attendance_today["absent"] == 1


async def test_admin_dashboard_pending_leave_count_is_org_wide(db_session: AsyncSession, make_employee):
    admin, _ = await make_employee()
    _, employee_a = await make_employee()
    _, employee_b = await make_employee()
    await add_leave_request(db_session, employee_a.id, status=LeaveStatus.PENDING)
    await add_leave_request(db_session, employee_b.id, status=LeaveStatus.PENDING, days_ago=1)
    await add_leave_request(db_session, employee_a.id, status=LeaveStatus.REJECTED, days_ago=2)
    service = make_service(db_session)

    dashboard = await service.admin_dashboard(admin)

    assert dashboard.pending_leave_count == 2
    assert len(dashboard.recent_leave_requests) == 2
    assert all(r.status == LeaveStatus.PENDING for r in dashboard.recent_leave_requests)
