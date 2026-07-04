import uuid
from datetime import date, datetime, timezone

from app.common.enums import AttendanceStatus
from app.common.pagination import PageParams
from app.core.config import settings
from app.core.exceptions import ConflictError, NotFoundError, ValidationConflictError
from app.models.attendance import AttendanceRecord
from app.models.user import User
from app.modules.attendance.repository import AttendanceRepository
from app.modules.users.repository import EmployeeRepository


class AttendanceService:
    """Owns every rule around what a check-in/check-out is allowed to do.

    Status is always derived here from actual check-in/check-out timestamps —
    the API never accepts a client-supplied status for a check-in/out call.
    (Yes, someone WILL try to POST {"status": "present"} and skip the whole
    check-in dance. Not on my watch.)
    """

    def __init__(self, attendance_repo: AttendanceRepository, employee_repo: EmployeeRepository) -> None:
        self._attendance_repo = attendance_repo
        self._employee_repo = employee_repo

    async def _resolve_employee_id(self, user: User) -> uuid.UUID:
        employee = await self._employee_repo.get_by_user_id(user.id)
        if employee is None:
            raise NotFoundError("No employee profile is linked to this account")
        return employee.id

    async def check_in(self, current_user: User) -> AttendanceRecord:
        employee_id = await self._resolve_employee_id(current_user)
        today = date.today()
        now = datetime.now(timezone.utc)

        existing = await self._attendance_repo.get_for_date(employee_id, today)
        if existing is not None and existing.check_in_time is not None:
            # Nice try. One check-in per day, this isn't a loyalty punch card.
            raise ConflictError("Already checked in today")

        if existing is not None:
            # A row for today already exists but nobody's actually checked in yet —
            # e.g. something else pre-created it. Fill it in rather than duplicate it,
            # the (employee_id, date) unique constraint would reject a second row anyway.
            existing.check_in_time = now
            existing.status = AttendanceStatus.PRESENT
            return await self._attendance_repo.add(existing)

        record = AttendanceRecord(
            employee_id=employee_id,
            date=today,
            check_in_time=now,
            status=AttendanceStatus.PRESENT,
        )
        return await self._attendance_repo.add(record)

    async def check_out(self, current_user: User) -> AttendanceRecord:
        employee_id = await self._resolve_employee_id(current_user)
        today = date.today()
        now = datetime.now(timezone.utc)

        record = await self._attendance_repo.get_for_date(employee_id, today)
        if record is None or record.check_in_time is None:
            # Can't clock out of a shift you never clocked into. Physics, mostly.
            raise ValidationConflictError("Cannot check out before checking in")
        if record.check_out_time is not None:
            raise ConflictError("Already checked out today")

        record.check_out_time = now
        # IMPORTANT, learned the hard way: some DB drivers (SQLite, looking at you)
        # hand back naive datetimes even out of a tz-aware column, so `now - check_in_time`
        # blows up with "can't subtract offset-naive and offset-aware datetimes" the moment
        # a test actually exercises this path. Re-attach UTC before doing math with it.
        check_in_time = record.check_in_time
        if check_in_time.tzinfo is None:
            check_in_time = check_in_time.replace(tzinfo=timezone.utc)
        hours_worked = (now - check_in_time).total_seconds() / 3600
        # The actual "did you put in a real day" rule lives in one config knob, not a
        # magic number buried here — see HALF_DAY_THRESHOLD_HOURS if HR changes their mind.
        record.status = (
            AttendanceStatus.PRESENT
            if hours_worked >= settings.HALF_DAY_THRESHOLD_HOURS
            else AttendanceStatus.HALF_DAY
        )
        return await self._attendance_repo.add(record)

    async def get_my_attendance(self, current_user: User, date_from: date, date_to: date) -> list[AttendanceRecord]:
        employee_id = await self._resolve_employee_id(current_user)
        return await self._attendance_repo.list_for_employee(employee_id, date_from, date_to)

    async def admin_get_employee_attendance(self, employee_id: uuid.UUID, date_from: date, date_to: date) -> list[AttendanceRecord]:
        return await self._attendance_repo.list_for_employee(employee_id, date_from, date_to)

    async def admin_list_attendance(
        self,
        date_from: date,
        date_to: date,
        status: AttendanceStatus | None,
        page: PageParams,
    ) -> tuple[list[AttendanceRecord], int]:
        return await self._attendance_repo.list_all(date_from, date_to, status=status, page=page)

    async def get_my_summary(self, current_user: User, date_from: date, date_to: date) -> dict[str, int]:
        employee_id = await self._resolve_employee_id(current_user)
        return await self.get_summary_for_employee(employee_id, date_from, date_to)

    async def get_summary_for_employee(self, employee_id: uuid.UUID, date_from: date, date_to: date) -> dict[str, int]:
        """Public entry point for other modules (Payroll) to call in-process —
        no HTTP round-trip needed, just import AttendanceService and call this.
        Hey Payroll team, future us: this is your salary-deduction math, right here."""
        counts = await self._attendance_repo.get_summary(employee_id, date_from, date_to)
        return {status.value: count for status, count in counts.items()}
