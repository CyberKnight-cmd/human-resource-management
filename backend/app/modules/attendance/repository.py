from datetime import date

from sqlalchemy.ext.asyncio import AsyncSession


async def get_for_date(db: AsyncSession, employee_id, on_date: date):
    raise NotImplementedError


async def upsert_record(db: AsyncSession, employee_id, on_date: date, fields: dict):
    raise NotImplementedError


async def list_for_employee(db: AsyncSession, employee_id, date_from: date, date_to: date):
    raise NotImplementedError


async def list_all(db: AsyncSession, date_from: date, date_to: date, limit: int, offset: int):
    raise NotImplementedError
