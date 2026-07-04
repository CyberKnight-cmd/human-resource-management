import uuid
from datetime import date

from sqlalchemy import select

from app.common.base_repository import BaseRepository
from app.common.enums import LeaveStatus, LeaveType
from app.common.pagination import PageParams, paginate
from app.models.leave import LeaveBalance, LeaveRequest


class LeaveBalanceRepository(BaseRepository[LeaveBalance]):
    model = LeaveBalance

    async def get(self, employee_id: uuid.UUID, leave_type: LeaveType, year: int) -> LeaveBalance | None:
        # The one lookup apply_leave() and decide() both live and die by. If this
        # ever returns None for a real employee, someone forgot to provision their
        # allowance — that's an onboarding bug, not a leave-module bug, but you'll
        # get blamed for it anyway, so maybe log a warning here someday.
        stmt = select(LeaveBalance).where(
            LeaveBalance.employee_id == employee_id,
            LeaveBalance.leave_type == leave_type,
            LeaveBalance.year == year,
        )
        return (await self._db.execute(stmt)).scalar_one_or_none()

    async def list_for_employee(self, employee_id: uuid.UUID, year: int) -> list[LeaveBalance]:
        stmt = select(LeaveBalance).where(LeaveBalance.employee_id == employee_id, LeaveBalance.year == year)
        return list((await self._db.execute(stmt)).scalars().all())


class LeaveRequestRepository(BaseRepository[LeaveRequest]):
    model = LeaveRequest

    async def find_overlapping(
        self,
        employee_id: uuid.UUID,
        start_date: date,
        end_date: date,
        statuses: list[LeaveStatus],
    ) -> list[LeaveRequest]:
        # Two date ranges overlap unless one of them is entirely before the other —
        # the classic "NOT (a.end < b.start OR a.start > b.end)", De Morgan'd into two
        # comparisons because nobody enjoys reading a NOT(OR(...)) at 11pm before a demo.
        # Rejected requests are deliberately excluded by the caller passing statuses=
        # [PENDING, APPROVED] — a "no" from HR should never haunt those dates forever.
        stmt = select(LeaveRequest).where(
            LeaveRequest.employee_id == employee_id,
            LeaveRequest.status.in_(statuses),
            LeaveRequest.start_date <= end_date,
            LeaveRequest.end_date >= start_date,
        )
        return list((await self._db.execute(stmt)).scalars().all())

    async def list_for_employee(self, employee_id: uuid.UUID, page: PageParams) -> tuple[list[LeaveRequest], int]:
        stmt = (
            select(LeaveRequest)
            .where(LeaveRequest.employee_id == employee_id)
            .order_by(LeaveRequest.created_at.desc())
        )
        rows, total = await paginate(self._db, stmt, page)
        return list(rows), total

    async def list_all(
        self,
        status: LeaveStatus | None,
        employee_id: uuid.UUID | None,
        page: PageParams,
    ) -> tuple[list[LeaveRequest], int]:
        stmt = select(LeaveRequest)
        if status is not None:
            stmt = stmt.where(LeaveRequest.status == status)
        if employee_id is not None:
            stmt = stmt.where(LeaveRequest.employee_id == employee_id)
        stmt = stmt.order_by(LeaveRequest.created_at.desc())

        rows, total = await paginate(self._db, stmt, page)
        return list(rows), total
