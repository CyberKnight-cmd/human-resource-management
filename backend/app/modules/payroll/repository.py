from sqlalchemy.ext.asyncio import AsyncSession


async def get_current(db: AsyncSession, employee_id):
    raise NotImplementedError


async def get_history(db: AsyncSession, employee_id):
    raise NotImplementedError


async def mark_not_current(db: AsyncSession, employee_id):
    raise NotImplementedError


async def create_version(db: AsyncSession, employee_id, fields: dict, updated_by):
    raise NotImplementedError
