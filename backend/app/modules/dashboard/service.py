"""Aggregation only — reads from users/employees/attendance/leave; no writes happen here."""

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User


async def employee_dashboard(db: AsyncSession, current_user: User):
    # TODO: profile summary + this week's attendance + pending leave + recent alerts.
    raise NotImplementedError


async def admin_dashboard(db: AsyncSession, current_user: User):
    # TODO: headcount + today's attendance snapshot + pending leave approval count.
    raise NotImplementedError
