"""Approval is the one workflow in this whole app that touches three tables in a
single transaction: leave_requests.status, leave_balances.used, and attendance_records
(the approved range becomes LEAVE). All three succeed together or none do — that's
not something this service arranges itself, it's a free side effect of get_db()
wrapping every request in one commit/rollback.
"""

import uuid
from datetime import datetime, timezone

from app.common.audit import AuditLogger
from app.common.enums import LeaveStatus, Role
from app.common.pagination import PageParams
from app.core.exceptions import ConflictError, NotFoundError, PermissionDeniedError, ValidationConflictError
from app.models.leave import LeaveRequest
from app.models.user import User
from app.modules.attendance.repository import AttendanceRepository
from app.modules.leave.repository import LeaveBalanceRepository, LeaveRequestRepository
from app.modules.leave.schemas import LeaveApplyRequest, LeaveDecisionRequest
from app.modules.users.repository import EmployeeRepository


class LeaveService:
    """The approval workflow lives here, and it is the single most "everything touches
    everything" piece of business logic in this codebase. If you're debugging a leave
    bug, start with decide() — that's where the balance, the attendance calendar, and
    the audit trail all quietly become each other's problem."""

    def __init__(
        self,
        request_repo: LeaveRequestRepository,
        balance_repo: LeaveBalanceRepository,
        attendance_repo: AttendanceRepository,
        employee_repo: EmployeeRepository,
        audit: AuditLogger,
    ) -> None:
        self._request_repo = request_repo
        self._balance_repo = balance_repo
        self._attendance_repo = attendance_repo
        self._employee_repo = employee_repo
        self._audit = audit

    async def _resolve_employee_id(self, user: User) -> uuid.UUID:
        employee = await self._employee_repo.get_by_user_id(user.id)
        if employee is None:
            raise NotFoundError("No employee profile is linked to this account")
        return employee.id

    async def get_my_balance(self, current_user: User, year: int):
        employee_id = await self._resolve_employee_id(current_user)
        return await self._balance_repo.list_for_employee(employee_id, year)

    async def apply_leave(self, current_user: User, data: LeaveApplyRequest) -> LeaveRequest:
        employee_id = await self._resolve_employee_id(current_user)

        if data.end_date < data.start_date:
            # A calendar-range picker on the frontend shouldn't let this happen, but
            # nothing stops a raw API call from trying it, and Postman doesn't care
            # about your UX, so it's checked here too.
            raise ValidationConflictError("end_date cannot be before start_date")
        days_count = (data.end_date - data.start_date).days + 1

        overlapping = await self._request_repo.find_overlapping(
            employee_id, data.start_date, data.end_date, [LeaveStatus.PENDING, LeaveStatus.APPROVED]
        )
        if overlapping:
            # No double-booking your own vacation. Rejected requests don't count here —
            # a "no" from HR shouldn't permanently curse those calendar dates.
            raise ConflictError("An overlapping leave request already exists")

        # Balance is bucketed by the START date's year. A request spanning New Year's
        # Eve draws entirely against the year it started in — a simplification, not
        # an oversight, and cheap to revisit if it ever actually comes up (it won't).
        balance = await self._balance_repo.get(employee_id, data.leave_type, data.start_date.year)
        # Numeric(5,1) columns round-trip as decimal.Decimal on real Postgres (SQLite in
        # tests is more forgiving and won't catch you sleeping here) — Decimal-minus-float
        # raises TypeError, so cast explicitly rather than find out in production at 2am.
        if balance is None or (float(balance.total_allocated) - float(balance.used)) < days_count:
            raise ValidationConflictError("Insufficient leave balance for this request")

        request = LeaveRequest(
            employee_id=employee_id,
            leave_type=data.leave_type,
            start_date=data.start_date,
            end_date=data.end_date,
            days_count=days_count,
            remarks=data.remarks,
            status=LeaveStatus.PENDING,
        )
        return await self._request_repo.add(request)

    async def list_my_requests(self, current_user: User, page: PageParams) -> tuple[list[LeaveRequest], int]:
        employee_id = await self._resolve_employee_id(current_user)
        return await self._request_repo.list_for_employee(employee_id, page)

    async def admin_list_requests(
        self, status: LeaveStatus | None, employee_id: uuid.UUID | None, page: PageParams
    ) -> tuple[list[LeaveRequest], int]:
        return await self._request_repo.list_all(status, employee_id, page)

    async def get_request(self, current_user: User, request_id: uuid.UUID) -> LeaveRequest:
        request = await self._request_repo.get_by_id(request_id)
        if request is None:
            raise NotFoundError("Leave request not found")

        if current_user.role != Role.ADMIN:
            employee_id = await self._resolve_employee_id(current_user)
            if request.employee_id != employee_id:
                # A perfectly valid access token pointed at someone else's leave request.
                # require_role() can't catch this — it doesn't know whose row this is,
                # only who's asking — so the actual "is this yours" check lives here.
                raise PermissionDeniedError("You cannot view another employee's leave request")
        return request

    async def decide(self, reviewer: User, request_id: uuid.UUID, data: LeaveDecisionRequest) -> LeaveRequest:
        request = await self._request_repo.get_by_id(request_id)
        if request is None:
            raise NotFoundError("Leave request not found")
        if request.status != LeaveStatus.PENDING:
            # An admin clicking "approve" twice because the UI felt slow is not a
            # reason to deduct someone's vacation days twice. PENDING is a one-way door.
            raise ConflictError("Only a pending request can be decided")

        if data.status == LeaveStatus.APPROVED:
            # Re-check the balance NOW, don't just trust whatever apply_leave() saw —
            # time has passed, some OTHER request against the same pool may have been
            # approved in between, and this is the actual moment the deduction happens.
            # Trusting a stale check here is exactly how balances go negative.
            balance = await self._balance_repo.get(request.employee_id, request.leave_type, request.start_date.year)
            days_count = float(request.days_count)
            if balance is None or (float(balance.total_allocated) - float(balance.used)) < days_count:
                raise ValidationConflictError("Insufficient leave balance to approve this request")
            balance.used = float(balance.used) + days_count
            await self._balance_repo.add(balance)

            # Approved leave rewrites attendance for the whole range — ask Attendance to
            # do it (mark_range_as_leave), don't reimplement its day-by-day upsert here.
            # One module, one owner, one place that knows how attendance rows get written.
            await self._attendance_repo.mark_range_as_leave(request.employee_id, request.start_date, request.end_date)

        request.status = data.status
        request.reviewer_comment = data.comment
        request.reviewed_by = reviewer.id
        request.reviewed_at = datetime.now(timezone.utc)
        request = await self._request_repo.add(request)

        self._audit.log(
            actor_user_id=reviewer.id,
            action=f"leave.{data.status.value}",
            target_type="leave_request",
            target_id=request.id,
            metadata={"employee_id": str(request.employee_id), "days_count": float(request.days_count)},
        )
        return request
