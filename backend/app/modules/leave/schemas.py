import uuid
from datetime import date, datetime

from pydantic import BaseModel, field_validator

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
    status: LeaveStatus  # APPROVED or REJECTED — never PENDING, see validator below
    comment: str | None = None

    @field_validator("status")
    @classmethod
    def _must_be_a_real_decision(cls, value: LeaveStatus) -> LeaveStatus:
        # "Decide this request... as still pending" is not a decision, it's a shrug.
        if value == LeaveStatus.PENDING:
            raise ValueError("status must be APPROVED or REJECTED")
        return value


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
