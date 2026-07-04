"""Status is computed here (present/half_day from hours worked), never chosen freely by the client."""

from datetime import date

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User


async def check_in(db: AsyncSession, current_user: User):
    raise NotImplementedError


async def check_out(db: AsyncSession, current_user: User):
    raise NotImplementedError


async def get_my_attendance(db: AsyncSession, current_user: User, date_from: date, date_to: date):
    raise NotImplementedError


async def admin_get_employee_attendance(db: AsyncSession, employee_id, date_from: date, date_to: date):
    raise NotImplementedError


async def admin_list_attendance(db: AsyncSession, date_from: date, date_to: date, limit: int, offset: int):
    raise NotImplementedError
