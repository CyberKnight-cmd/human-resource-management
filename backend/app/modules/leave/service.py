"""Approval is the one workflow that touches three tables atomically:
leave_requests.status, leave_balances.used, and attendance_records (marks the date range as LEAVE).
Every decision also writes an audit_logs row via app.common.audit.log_action.
See Architecture/BACKEND_ARCHITECTURE.md §10 (state machine) for the full rule set.
"""

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.modules.leave.schemas import LeaveApplyRequest, LeaveDecisionRequest


async def get_balance(db: AsyncSession, current_user: User, year: int):
    raise NotImplementedError


async def apply_leave(db: AsyncSession, current_user: User, data: LeaveApplyRequest):
    # TODO: validate sufficient balance, no overlapping pending/approved request, days_count calc.
    raise NotImplementedError


async def list_my_requests(db: AsyncSession, current_user: User, limit: int, offset: int):
    raise NotImplementedError


async def admin_list_requests(db: AsyncSession, status_filter, employee_id, limit: int, offset: int):
    raise NotImplementedError


async def get_request(db: AsyncSession, current_user: User, request_id: uuid.UUID):
    raise NotImplementedError


async def decide(db: AsyncSession, reviewer: User, request_id: uuid.UUID, data: LeaveDecisionRequest):
    # TODO: on APPROVED -> bump leave_balances.used, write attendance_records for the range as LEAVE.
    # on REJECTED -> just persist reviewer_comment. Both paths call log_action(...).
    raise NotImplementedError
