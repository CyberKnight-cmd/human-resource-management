import uuid
from datetime import date, datetime

from pydantic import BaseModel

from app.common.enums import LeaveStatus, LeaveType


class LeaveBalanceOut(BaseModel):
    leave_type: LeaveType
    total_allocated: float
    used: float

    model_config = {"from_attributes": True}


class LeaveApplyRequest(BaseModel):
    leave_type: LeaveType
    start_date: date
    end_date: date
    remarks: str | None = None


class LeaveDecisionRequest(BaseModel):
    status: LeaveStatus  # APPROVED or REJECTED
    comment: str | None = None


class LeaveRequestOut(BaseModel):
    id: uuid.UUID
    employee_id: uuid.UUID
    leave_type: LeaveType
    start_date: date
    end_date: date
    days_count: float
    remarks: str | None
    status: LeaveStatus
    reviewer_comment: str | None
    reviewed_at: datetime | None

    model_config = {"from_attributes": True}
