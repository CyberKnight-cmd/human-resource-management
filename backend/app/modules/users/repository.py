from sqlalchemy.ext.asyncio import AsyncSession


async def get_by_user_id(db: AsyncSession, user_id):
    raise NotImplementedError


async def get_by_id(db: AsyncSession, employee_id):
    raise NotImplementedError


async def list_paginated(db: AsyncSession, limit: int, offset: int):
    raise NotImplementedError


async def update_fields(db: AsyncSession, employee_id, fields: dict):
    raise NotImplementedError
