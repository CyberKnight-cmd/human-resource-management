import uuid
from datetime import date, datetime

from sqlalchemy import Date, DateTime, Enum, ForeignKey, Numeric, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.common.enums import LeaveStatus, LeaveType
from app.db.base import Base, TimestampMixin, UUIDPKMixin


class LeaveBalance(UUIDPKMixin, Base):
    __tablename__ = "leave_balances"
    __table_args__ = (UniqueConstraint("employee_id", "leave_type", "year", name="uq_balance_employee_type_year"),)

    employee_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("employees.id"), index=True)
    leave_type: Mapped[LeaveType] = mapped_column(Enum(LeaveType, name="leave_type"))
    year: Mapped[int]
    total_allocated: Mapped[float] = mapped_column(Numeric(5, 1))
    used: Mapped[float] = mapped_column(Numeric(5, 1), default=0)


class LeaveRequest(UUIDPKMixin, TimestampMixin, Base):
    __tablename__ = "leave_requests"

    employee_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("employees.id"), index=True)
    leave_type: Mapped[LeaveType] = mapped_column(Enum(LeaveType, name="leave_type"))
    start_date: Mapped[date] = mapped_column(Date)
    end_date: Mapped[date] = mapped_column(Date)
    days_count: Mapped[float] = mapped_column(Numeric(5, 1))
    remarks: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[LeaveStatus] = mapped_column(Enum(LeaveStatus, name="leave_status"), default=LeaveStatus.PENDING)
    reviewed_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    reviewer_comment: Mapped[str | None] = mapped_column(Text, nullable=True)
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
