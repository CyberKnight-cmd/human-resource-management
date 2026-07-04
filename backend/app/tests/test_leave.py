# Leave module test suite.
# The approval path is the one place in this app that mutates three tables at once
# (leave_requests, leave_balances, attendance_records) — most of the interesting
# edge cases below are really about making sure that trio never gets out of sync.
# If a future refactor makes one of these three fail without the others, that's not
# a passing test, that's the alarm going off.

from datetime import date, timedelta

import pytest
from pydantic import ValidationError
from sqlalchemy.ext.asyncio import AsyncSession

from app.common.audit import AuditLogger
from app.common.enums import LeaveStatus, LeaveType, Role
from app.common.pagination import PageParams
from app.core.exceptions import ConflictError, NotFoundError, PermissionDeniedError, ValidationConflictError
from app.models.leave import LeaveBalance
from app.modules.attendance.repository import AttendanceRepository
from app.modules.leave.repository import LeaveBalanceRepository, LeaveRequestRepository
from app.modules.leave.schemas import LeaveApplyRequest, LeaveDecisionRequest
from app.modules.leave.service import LeaveService
from app.modules.users.repository import EmployeeRepository

THIS_YEAR = date.today().year


def make_service(db_session: AsyncSession) -> LeaveService:
    return LeaveService(
        LeaveRequestRepository(db_session),
        LeaveBalanceRepository(db_session),
        AttendanceRepository(db_session),
        EmployeeRepository(db_session),
        AuditLogger(db_session),
    )


async def give_balance(db_session, employee_id, leave_type=LeaveType.PAID, total=10.0, used=0.0, year=THIS_YEAR):
    repo = LeaveBalanceRepository(db_session)
    return await repo.add(
        LeaveBalance(employee_id=employee_id, leave_type=leave_type, year=year, total_allocated=total, used=used)
    )


# ---------------------------------------------------------------------------
# schema-level guard
# ---------------------------------------------------------------------------


def test_decision_schema_rejects_pending():
    # "Decide this as still pending" isn't a decision — Pydantic should refuse
    # to even construct the object, before it gets anywhere near the service.
    with pytest.raises(ValidationError):
        LeaveDecisionRequest(status=LeaveStatus.PENDING)


# ---------------------------------------------------------------------------
# apply_leave
# ---------------------------------------------------------------------------


async def test_apply_leave_creates_pending_request(db_session, make_employee):
    user, employee = await make_employee()
    await give_balance(db_session, employee.id, total=10.0)
    service = make_service(db_session)

    today = date.today()
    request = await service.apply_leave(
        user, LeaveApplyRequest(leave_type=LeaveType.PAID, start_date=today, end_date=today + timedelta(days=2))
    )

    assert request.status == LeaveStatus.PENDING
    assert request.days_count == 3  # inclusive of both endpoints


async def test_apply_leave_rejects_inverted_date_range(db_session, make_employee):
    user, employee = await make_employee()
    await give_balance(db_session, employee.id)
    service = make_service(db_session)

    today = date.today()
    with pytest.raises(ValidationConflictError):
        await service.apply_leave(
            user, LeaveApplyRequest(leave_type=LeaveType.PAID, start_date=today, end_date=today - timedelta(days=1))
        )


async def test_apply_leave_without_any_balance_row_is_rejected(db_session, make_employee):
    user, _ = await make_employee()  # deliberately: no give_balance() call
    service = make_service(db_session)

    today = date.today()
    with pytest.raises(ValidationConflictError):
        await service.apply_leave(
            user, LeaveApplyRequest(leave_type=LeaveType.SICK, start_date=today, end_date=today)
        )


async def test_apply_leave_exceeding_balance_is_rejected(db_session, make_employee):
    user, employee = await make_employee()
    await give_balance(db_session, employee.id, total=2.0, used=0.0)
    service = make_service(db_session)

    today = date.today()
    with pytest.raises(ValidationConflictError):
        # Asking for 3 days against a 2-day balance.
        await service.apply_leave(
            user, LeaveApplyRequest(leave_type=LeaveType.PAID, start_date=today, end_date=today + timedelta(days=2))
        )


async def test_apply_leave_overlapping_pending_request_is_rejected(db_session, make_employee):
    user, employee = await make_employee()
    await give_balance(db_session, employee.id, total=20.0)
    service = make_service(db_session)

    today = date.today()
    await service.apply_leave(
        user, LeaveApplyRequest(leave_type=LeaveType.PAID, start_date=today, end_date=today + timedelta(days=3))
    )

    with pytest.raises(ConflictError):
        # Overlaps day 2-3 of the first request.
        await service.apply_leave(
            user,
            LeaveApplyRequest(
                leave_type=LeaveType.PAID, start_date=today + timedelta(days=2), end_date=today + timedelta(days=5)
            ),
        )


async def test_apply_leave_not_blocked_by_a_rejected_request(db_session, make_employee):
    """A rejected request occupying the same dates should NOT count as a conflict —
    otherwise a rejection would permanently lock out those dates. That would be worse
    than just not having the leave system at all."""
    user, employee = await make_employee()
    await give_balance(db_session, employee.id, total=20.0)
    service = make_service(db_session)
    today = date.today()

    first = await service.apply_leave(
        user, LeaveApplyRequest(leave_type=LeaveType.PAID, start_date=today, end_date=today + timedelta(days=1))
    )
    await service.decide(user, first.id, LeaveDecisionRequest(status=LeaveStatus.REJECTED, comment="no"))

    # Re-applying for the exact same dates should now be allowed.
    second = await service.apply_leave(
        user, LeaveApplyRequest(leave_type=LeaveType.PAID, start_date=today, end_date=today + timedelta(days=1))
    )
    assert second.status == LeaveStatus.PENDING


# ---------------------------------------------------------------------------
# decide — approve
# ---------------------------------------------------------------------------


async def test_approve_deducts_balance_and_marks_attendance_as_leave(db_session, make_employee):
    user, employee = await make_employee()
    admin, _ = await make_employee(role=Role.ADMIN)
    balance = await give_balance(db_session, employee.id, total=10.0, used=0.0)
    service = make_service(db_session)

    today = date.today()
    request = await service.apply_leave(
        user, LeaveApplyRequest(leave_type=LeaveType.PAID, start_date=today, end_date=today + timedelta(days=1))
    )
    decided = await service.decide(admin, request.id, LeaveDecisionRequest(status=LeaveStatus.APPROVED, comment="ok"))

    assert decided.status == LeaveStatus.APPROVED
    assert decided.reviewed_by == admin.id
    assert decided.reviewer_comment == "ok"
    assert float(balance.used) == 2.0  # 2-day request deducted

    attendance_repo = AttendanceRepository(db_session)
    day_1 = await attendance_repo.get_for_date(employee.id, today)
    day_2 = await attendance_repo.get_for_date(employee.id, today + timedelta(days=1))
    assert day_1.status.value == "leave"
    assert day_2.status.value == "leave"


async def test_reject_does_not_touch_balance_or_attendance(db_session, make_employee):
    user, employee = await make_employee()
    admin, _ = await make_employee(role=Role.ADMIN)
    balance = await give_balance(db_session, employee.id, total=10.0, used=0.0)
    service = make_service(db_session)

    today = date.today()
    request = await service.apply_leave(
        user, LeaveApplyRequest(leave_type=LeaveType.PAID, start_date=today, end_date=today)
    )
    await service.decide(admin, request.id, LeaveDecisionRequest(status=LeaveStatus.REJECTED, comment="denied"))

    assert float(balance.used) == 0.0
    attendance_repo = AttendanceRepository(db_session)
    assert await attendance_repo.get_for_date(employee.id, today) is None


async def test_deciding_an_already_decided_request_raises_conflict(db_session, make_employee):
    user, employee = await make_employee()
    admin, _ = await make_employee(role=Role.ADMIN)
    await give_balance(db_session, employee.id, total=10.0)
    service = make_service(db_session)

    today = date.today()
    request = await service.apply_leave(
        user, LeaveApplyRequest(leave_type=LeaveType.PAID, start_date=today, end_date=today)
    )
    await service.decide(admin, request.id, LeaveDecisionRequest(status=LeaveStatus.APPROVED))

    with pytest.raises(ConflictError):
        await service.decide(admin, request.id, LeaveDecisionRequest(status=LeaveStatus.REJECTED))


async def test_approving_beyond_balance_at_decision_time_is_rejected(db_session, make_employee):
    """apply_leave() saw enough balance at the time; something ate into it before
    approval (another approved request against the same pool). The re-check inside
    decide() is what's actually being tested here — not the one in apply_leave()."""
    user, employee = await make_employee()
    admin, _ = await make_employee(role=Role.ADMIN)
    balance = await give_balance(db_session, employee.id, total=3.0, used=0.0)
    service = make_service(db_session)

    today = date.today()
    request = await service.apply_leave(
        user, LeaveApplyRequest(leave_type=LeaveType.PAID, start_date=today, end_date=today + timedelta(days=2))
    )

    # Simulate another approval draining the same balance in between.
    balance.used = 2.0
    await LeaveBalanceRepository(db_session).add(balance)

    with pytest.raises(ValidationConflictError):
        await service.decide(admin, request.id, LeaveDecisionRequest(status=LeaveStatus.APPROVED))


async def test_decide_unknown_request_raises_not_found(db_session, make_employee):
    admin, _ = await make_employee(role=Role.ADMIN)
    service = make_service(db_session)

    with pytest.raises(NotFoundError):
        await service.decide(admin, uuid_placeholder(), LeaveDecisionRequest(status=LeaveStatus.APPROVED))


def uuid_placeholder():
    import uuid

    return uuid.uuid4()


# ---------------------------------------------------------------------------
# get_request — ownership
# ---------------------------------------------------------------------------


async def test_owner_can_view_own_request(db_session, make_employee):
    user, employee = await make_employee()
    await give_balance(db_session, employee.id)
    service = make_service(db_session)

    today = date.today()
    request = await service.apply_leave(
        user, LeaveApplyRequest(leave_type=LeaveType.PAID, start_date=today, end_date=today)
    )

    fetched = await service.get_request(user, request.id)
    assert fetched.id == request.id


async def test_other_employee_cannot_view_someone_elses_request(db_session, make_employee):
    owner, employee = await make_employee()
    other_user, _ = await make_employee()
    await give_balance(db_session, employee.id)
    service = make_service(db_session)

    today = date.today()
    request = await service.apply_leave(
        owner, LeaveApplyRequest(leave_type=LeaveType.PAID, start_date=today, end_date=today)
    )

    with pytest.raises(PermissionDeniedError):
        await service.get_request(other_user, request.id)


async def test_admin_can_view_any_employees_request(db_session, make_employee):
    owner, employee = await make_employee()
    admin, _ = await make_employee(role=Role.ADMIN)
    await give_balance(db_session, employee.id)
    service = make_service(db_session)

    today = date.today()
    request = await service.apply_leave(
        owner, LeaveApplyRequest(leave_type=LeaveType.PAID, start_date=today, end_date=today)
    )

    fetched = await service.get_request(admin, request.id)
    assert fetched.id == request.id


# ---------------------------------------------------------------------------
# listing — scoping and filters
# ---------------------------------------------------------------------------


async def test_list_my_requests_is_scoped_to_the_caller(db_session, make_employee):
    user_a, employee_a = await make_employee()
    user_b, employee_b = await make_employee()
    await give_balance(db_session, employee_a.id)
    await give_balance(db_session, employee_b.id)
    service = make_service(db_session)
    today = date.today()

    await service.apply_leave(user_a, LeaveApplyRequest(leave_type=LeaveType.PAID, start_date=today, end_date=today))
    await service.apply_leave(user_b, LeaveApplyRequest(leave_type=LeaveType.PAID, start_date=today, end_date=today))

    rows, total = await service.list_my_requests(user_a, PageParams(limit=20, offset=0))
    assert total == 1
    assert rows[0].employee_id == employee_a.id


async def test_admin_list_requests_filters_by_status(db_session, make_employee):
    user, employee = await make_employee()
    admin, _ = await make_employee(role=Role.ADMIN)
    await give_balance(db_session, employee.id, total=20.0)
    service = make_service(db_session)
    today = date.today()

    approved = await service.apply_leave(
        user, LeaveApplyRequest(leave_type=LeaveType.PAID, start_date=today, end_date=today)
    )
    await service.apply_leave(
        user, LeaveApplyRequest(leave_type=LeaveType.PAID, start_date=today + timedelta(days=5), end_date=today + timedelta(days=5))
    )
    await service.decide(admin, approved.id, LeaveDecisionRequest(status=LeaveStatus.APPROVED))

    rows, total = await service.admin_list_requests(LeaveStatus.APPROVED, None, PageParams(limit=20, offset=0))
    assert total == 1
    assert rows[0].id == approved.id
