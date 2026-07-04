import uuid
from datetime import date

from sqlalchemy import Boolean, Date, ForeignKey, Numeric, Uuid
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin, UUIDPKMixin


class SalaryStructure(UUIDPKMixin, TimestampMixin, Base):
    """Versioned: a salary change inserts a new row and flips is_current on the old one,
    instead of overwriting in place, so payroll history is auditable.
    (Also why attendance.get_summary() takes a date range instead of "current status" —
    payroll math always needs to ask "as of when", never just "right now".)
    """

    __tablename__ = "salary_structures"

    # No currency column on purpose — this HRMS runs single-currency (INR), so it's a
    # constant baked into the API schema, not something every row needs to repeat.
    # Numeric(12, 2) gives paise precision up to ~999 crore, which should outlive the hackathon.
    employee_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("employees.id"), index=True)
    basic_pay: Mapped[float] = mapped_column(Numeric(12, 2))
    hra: Mapped[float] = mapped_column(Numeric(12, 2), default=0)
    allowances: Mapped[float] = mapped_column(Numeric(12, 2), default=0)
    deductions: Mapped[float] = mapped_column(Numeric(12, 2), default=0)
    net_pay: Mapped[float] = mapped_column(Numeric(12, 2))
    effective_from: Mapped[date] = mapped_column(Date)
    is_current: Mapped[bool] = mapped_column(Boolean, default=True, index=True)
    updated_by: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("users.id"))
