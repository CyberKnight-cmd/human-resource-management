# Attendance module test suite.
# These caught one real bug already (SQLite handing back naive datetimes where a
# tz-aware column was promised — see check_out()'s tz normalization). If you're
# tempted to delete a test because "it's obviously fine", it probably was, until
# someone changed the DB driver or the timezone default. Ask me how I know.

from datetime import date, datetime, timedelta, timezone

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.common.enums import AttendanceStatus, Role
from app.common.pagination import PageParams
from app.core.exceptions import ConflictError, NotFoundError, ValidationConflictError
from app.models.attendance import AttendanceRecord
from app.modules.attendance.repository import AttendanceRepository
from app.modules.attendance.service import AttendanceService
from app.modules.users.repository import EmployeeRepository


def make_service(db_session: AsyncSession) -> AttendanceService:
    return AttendanceService(AttendanceRepository(db_session), EmployeeRepository(db_session))


# ---------------------------------------------------------------------------
# check_in
# ---------------------------------------------------------------------------


async def test_check_in_creates_present_record(db_session, make_employee):
    user, employee = await make_employee()
    service = make_service(db_session)

    record = await service.check_in(user)

    assert record.employee_id == employee.id
    assert record.date == date.today()
    assert record.check_in_time is not None
    assert record.check_out_time is None
    assert record.status == AttendanceStatus.PRESENT


async def test_double_check_in_same_day_raises_conflict(db_session, make_employee):
    user, _ = await make_employee()
    service = make_service(db_session)

    await service.check_in(user)
    with pytest.raises(ConflictError):
        await service.check_in(user)


async def test_check_in_without_employee_profile_raises_not_found(db_session):
    """A User row with no linked Employee (shouldn't happen post-signup, but defensively
    checked) — the "how did we even get here" test. Signup should always create both
    rows together, but services shouldn't just trust that and NPE on a None."""
    from app.models.user import User

    user = User(employee_code="ORPHAN1", email="orphan@example.com", hashed_password="x", role=Role.EMPLOYEE)
    db_session.add(user)
    await db_session.flush()

    service = make_service(db_session)
    with pytest.raises(NotFoundError):
        await service.check_in(user)


async def test_two_employees_checking_in_same_day_do_not_interfere(db_session, make_employee):
    user_a, employee_a = await make_employee()
    user_b, employee_b = await make_employee()
    service = make_service(db_session)

    record_a = await service.check_in(user_a)
    record_b = await service.check_in(user_b)

    assert record_a.employee_id != record_b.employee_id
    assert record_a.id != record_b.id


# ---------------------------------------------------------------------------
# check_out
# ---------------------------------------------------------------------------


async def test_check_out_without_check_in_raises_validation_conflict(db_session, make_employee):
    user, _ = await make_employee()
    service = make_service(db_session)

    with pytest.raises(ValidationConflictError):
        await service.check_out(user)


async def test_check_out_full_day_is_present(db_session, make_employee):
    # This test is the whole reason the tz-normalization line exists in check_out().
    # First run against SQLite: "TypeError: can't subtract offset-naive and
    # offset-aware datetimes." Left it in so nobody "cleans up" that fix later.
    user, employee = await make_employee()
    repo = AttendanceRepository(db_session)

    # Simulate a check-in 5 hours ago (above the 4h half-day threshold).
    await repo.add(
        AttendanceRecord(
            employee_id=employee.id,
            date=date.today(),
            check_in_time=datetime.now(timezone.utc) - timedelta(hours=5),
            status=AttendanceStatus.PRESENT,
        )
    )

    service = make_service(db_session)
    record = await service.check_out(user)

    assert record.check_out_time is not None
    assert record.status == AttendanceStatus.PRESENT


async def test_check_out_short_day_is_half_day(db_session, make_employee):
    user, employee = await make_employee()
    repo = AttendanceRepository(db_session)

    # Checked in only 2 hours ago — below the 4h half-day threshold.
    await repo.add(
        AttendanceRecord(
            employee_id=employee.id,
            date=date.today(),
            check_in_time=datetime.now(timezone.utc) - timedelta(hours=2),
            status=AttendanceStatus.PRESENT,
        )
    )

    service = make_service(db_session)
    record = await service.check_out(user)

    assert record.status == AttendanceStatus.HALF_DAY


async def test_double_check_out_raises_conflict(db_session, make_employee):
    user, _ = await make_employee()
    service = make_service(db_session)

    await service.check_in(user)
    await service.check_out(user)

    with pytest.raises(ConflictError):
        await service.check_out(user)


# ---------------------------------------------------------------------------
# get_my_attendance / date-range views
# ---------------------------------------------------------------------------


async def test_get_my_attendance_filters_to_date_range(db_session, make_employee):
    user, employee = await make_employee()
    repo = AttendanceRepository(db_session)
    today = date.today()

    in_range = await repo.add(
        AttendanceRecord(employee_id=employee.id, date=today - timedelta(days=1), status=AttendanceStatus.PRESENT)
    )
    await repo.add(
        AttendanceRecord(employee_id=employee.id, date=today - timedelta(days=30), status=AttendanceStatus.ABSENT)
    )

    service = make_service(db_session)
    results = await service.get_my_attendance(user, today - timedelta(days=7), today)

    assert [r.id for r in results] == [in_range.id]


# ---------------------------------------------------------------------------
# get_summary — the method Payroll will call directly
# ---------------------------------------------------------------------------


async def test_summary_zero_fills_statuses_with_no_records(db_session, make_employee):
    user, employee = await make_employee()
    repo = AttendanceRepository(db_session)
    today = date.today()

    await repo.add(AttendanceRecord(employee_id=employee.id, date=today, status=AttendanceStatus.PRESENT))

    service = make_service(db_session)
    summary = await service.get_summary_for_employee(employee.id, today, today)

    assert summary == {"present": 1, "absent": 0, "half_day": 0, "leave": 0}


async def test_summary_counts_multiple_statuses_in_range(db_session, make_employee):
    user, employee = await make_employee()
    repo = AttendanceRepository(db_session)
    today = date.today()

    await repo.add(AttendanceRecord(employee_id=employee.id, date=today, status=AttendanceStatus.PRESENT))
    await repo.add(AttendanceRecord(employee_id=employee.id, date=today - timedelta(days=1), status=AttendanceStatus.HALF_DAY))
    await repo.add(AttendanceRecord(employee_id=employee.id, date=today - timedelta(days=2), status=AttendanceStatus.ABSENT))
    await repo.add(AttendanceRecord(employee_id=employee.id, date=today - timedelta(days=3), status=AttendanceStatus.LEAVE))
    # Outside the queried range — must not be counted.
    await repo.add(AttendanceRecord(employee_id=employee.id, date=today - timedelta(days=30), status=AttendanceStatus.PRESENT))

    service = make_service(db_session)
    summary = await service.get_summary_for_employee(employee.id, today - timedelta(days=3), today)

    assert summary == {"present": 1, "half_day": 1, "absent": 1, "leave": 1}


async def test_summary_is_scoped_to_one_employee(db_session, make_employee):
    user_a, employee_a = await make_employee()
    _, employee_b = await make_employee()
    repo = AttendanceRepository(db_session)
    today = date.today()

    await repo.add(AttendanceRecord(employee_id=employee_a.id, date=today, status=AttendanceStatus.PRESENT))
    await repo.add(AttendanceRecord(employee_id=employee_b.id, date=today, status=AttendanceStatus.ABSENT))

    service = make_service(db_session)
    summary = await service.get_summary_for_employee(employee_a.id, today, today)

    assert summary["present"] == 1
    assert summary["absent"] == 0


# ---------------------------------------------------------------------------
# admin_list_attendance — pagination + filtering
# ---------------------------------------------------------------------------


async def test_admin_list_attendance_paginates(db_session, make_employee):
    _, employee = await make_employee()
    repo = AttendanceRepository(db_session)
    today = date.today()

    for i in range(5):
        await repo.add(AttendanceRecord(employee_id=employee.id, date=today - timedelta(days=i), status=AttendanceStatus.PRESENT))

    service = make_service(db_session)
    page_1, total = await service.admin_list_attendance(today - timedelta(days=30), today, None, PageParams(limit=2, offset=0))
    page_2, total_2 = await service.admin_list_attendance(today - timedelta(days=30), today, None, PageParams(limit=2, offset=2))

    assert total == 5
    assert total_2 == 5
    assert len(page_1) == 2
    assert len(page_2) == 2
    # The one that actually matters: if paginate() ever regresses into "same query,
    # ignore offset", these two pages would silently return identical rows.
    assert {r.id for r in page_1}.isdisjoint({r.id for r in page_2})


async def test_admin_list_attendance_filters_by_status(db_session, make_employee):
    _, employee = await make_employee()
    repo = AttendanceRepository(db_session)
    today = date.today()

    await repo.add(AttendanceRecord(employee_id=employee.id, date=today, status=AttendanceStatus.PRESENT))
    await repo.add(AttendanceRecord(employee_id=employee.id, date=today - timedelta(days=1), status=AttendanceStatus.ABSENT))

    service = make_service(db_session)
    rows, total = await service.admin_list_attendance(
        today - timedelta(days=7), today, AttendanceStatus.ABSENT, PageParams(limit=20, offset=0)
    )

    assert total == 1
    assert rows[0].status == AttendanceStatus.ABSENT
