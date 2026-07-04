import uuid
from datetime import date, timedelta

from sqlalchemy import func, select

from app.common.base_repository import BaseRepository
from app.common.enums import AttendanceStatus
from app.common.pagination import PageParams, paginate
from app.models.attendance import AttendanceRecord


class AttendanceRepository(BaseRepository[AttendanceRecord]):
    model = AttendanceRecord

    async def get_for_date(self, employee_id: uuid.UUID, on_date: date) -> AttendanceRecord | None:
        # The workhorse query. Check-in, check-out, and the "did I already clock in"
        # guard all funnel through this one lookup — keep it boring and fast.
        stmt = select(AttendanceRecord).where(
            AttendanceRecord.employee_id == employee_id,
            AttendanceRecord.date == on_date,
        )
        return (await self._db.execute(stmt)).scalar_one_or_none()

    async def list_for_employee(self, employee_id: uuid.UUID, date_from: date, date_to: date) -> list[AttendanceRecord]:
        stmt = (
            select(AttendanceRecord)
            .where(
                AttendanceRecord.employee_id == employee_id,
                AttendanceRecord.date >= date_from,
                AttendanceRecord.date <= date_to,
            )
            .order_by(AttendanceRecord.date)
        )
        return list((await self._db.execute(stmt)).scalars().all())

    async def list_all(
        self,
        date_from: date,
        date_to: date,
        *,
        status: AttendanceStatus | None = None,
        page: PageParams,
    ) -> tuple[list[AttendanceRecord], int]:
        stmt = select(AttendanceRecord).where(
            AttendanceRecord.date >= date_from,
            AttendanceRecord.date <= date_to,
        )
        if status is not None:
            stmt = stmt.where(AttendanceRecord.status == status)
        stmt = stmt.order_by(AttendanceRecord.date.desc())

        # Reusing the shared paginate() helper instead of hand-rolling a second
        # COUNT(*) query here — one pagination bug to fix, not one per module.
        rows, total = await paginate(self._db, stmt, page)
        return list(rows), total

    async def get_summary(self, employee_id: uuid.UUID, date_from: date, date_to: date) -> dict[AttendanceStatus, int]:
        """One GROUP BY, not N rows pulled into Python — this is the shape Payroll will
        call directly (e.g. `present + half_day` toward days worked, `absent` toward
        unpaid deductions) instead of re-deriving counts from raw attendance rows.
        Please don't "optimize" this into a Python for-loop over .all(), I will find out."""
        stmt = (
            select(AttendanceRecord.status, func.count())
            .where(
                AttendanceRecord.employee_id == employee_id,
                AttendanceRecord.date >= date_from,
                AttendanceRecord.date <= date_to,
            )
            .group_by(AttendanceRecord.status)
        )
        rows = (await self._db.execute(stmt)).all()

        # Zero-fill every status up front — a status with zero rows in the range
        # (e.g. no LEAVE days taken) should read as 0, not silently vanish from the dict
        # and blow up whoever destructures summary["leave"] downstream.
        counts = {status: 0 for status in AttendanceStatus}
        counts.update(dict(rows))
        return counts

    async def get_summary_for_all(self, on_date: date) -> dict[AttendanceStatus, int]:
        """Same GROUP BY shape as get_summary(), just without the employee_id filter —
        this is the org-wide "how's today looking" snapshot the admin dashboard wants,
        not a per-employee number. Zero-filled the same way, for the same reason."""
        stmt = (
            select(AttendanceRecord.status, func.count())
            .where(AttendanceRecord.date == on_date)
            .group_by(AttendanceRecord.status)
        )
        rows = (await self._db.execute(stmt)).all()

        counts = {status: 0 for status in AttendanceStatus}
        counts.update(dict(rows))
        return counts

    async def mark_range_as_leave(self, employee_id: uuid.UUID, start_date: date, end_date: date) -> None:
        """Called by Leave the moment a request gets approved — every day in the range
        becomes an attendance row with status=LEAVE, overwriting whatever was there
        before (approved leave wins over a stray PRESENT). This is the one place
        outside Attendance's own service that's allowed to touch attendance_records
        directly, which is exactly why it lives here and not duplicated in Leave."""
        current = start_date
        while current <= end_date:
            record = await self.get_for_date(employee_id, current)
            if record is None:
                record = AttendanceRecord(employee_id=employee_id, date=current, status=AttendanceStatus.LEAVE)
            else:
                record.status = AttendanceStatus.LEAVE
            await self.add(record)
            current += timedelta(days=1)
