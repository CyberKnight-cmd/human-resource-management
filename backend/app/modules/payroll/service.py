"""Payroll is read-only for employees. Admin writes never UPDATE in place — see SalaryStructure
docstring: a new row is inserted (versioned) and the previous one is flipped is_current=False,
plus an audit_logs entry."""

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.modules.payroll.schemas import SalaryStructureUpdate


async def get_my_payroll(db: AsyncSession, current_user: User):
    raise NotImplementedError


async def admin_get_payroll(db: AsyncSession, employee_id: uuid.UUID):
    raise NotImplementedError


async def admin_update_payroll(db: AsyncSession, admin: User, employee_id: uuid.UUID, data: SalaryStructureUpdate):
    raise NotImplementedError
