from sqlalchemy.ext.asyncio import AsyncSession


async def list_balances(db: AsyncSession, employee_id, year: int):
    raise NotImplementedError


async def create_request(db: AsyncSession, employee_id, fields: dict):
    raise NotImplementedError


async def get_request(db: AsyncSession, request_id):
    raise NotImplementedError


async def list_for_employee(db: AsyncSession, employee_id, limit: int, offset: int):
    raise NotImplementedError


async def list_all(db: AsyncSession, status_filter, employee_id, limit: int, offset: int):
    raise NotImplementedError


async def update_status(db: AsyncSession, request_id, *, status, reviewer_id, comment):
    raise NotImplementedError


async def increment_balance_used(db: AsyncSession, employee_id, leave_type, year: int, days: float):
    raise NotImplementedError
