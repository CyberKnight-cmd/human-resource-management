"""Field-level edit permission (self: phone/address/profile_picture_url vs admin: all fields)
is enforced here — see Employee.SELF_EDITABLE_FIELDS."""

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.common.pagination import Page, PageParams
from app.core.exceptions import NotFoundError
from app.models.employee import Employee
from app.models.user import User
from app.modules.users.repository import EmployeeRepository
from app.modules.users.schemas import EmployeeAdminUpdate, EmployeeOut, EmployeeSelfUpdate


async def _get_own_employee(db: AsyncSession, current_user: User) -> Employee:
    employee = await EmployeeRepository(db).get_by_user_id(current_user.id)
    if employee is None:
        raise NotFoundError("No employee profile is linked to this account")
    return employee


async def get_own_profile(db: AsyncSession, current_user: User) -> Employee:
    return await _get_own_employee(db, current_user)


async def update_own_profile(db: AsyncSession, current_user: User, data: EmployeeSelfUpdate) -> Employee:
    employee = await _get_own_employee(db, current_user)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(employee, field, value)
    return await EmployeeRepository(db).add(employee)


async def admin_list_employees(db: AsyncSession, limit: int, offset: int) -> Page[EmployeeOut]:
    rows, total = await EmployeeRepository(db).list_paginated(PageParams(limit=limit, offset=offset))
    return Page[EmployeeOut](
        items=[EmployeeOut.model_validate(row) for row in rows],
        total=total,
        limit=limit,
        offset=offset,
    )


async def admin_get_employee(db: AsyncSession, employee_id: uuid.UUID) -> Employee:
    employee = await EmployeeRepository(db).get_by_id(employee_id)
    if employee is None:
        raise NotFoundError("No employee found with that id")
    return employee


async def admin_update_employee(db: AsyncSession, employee_id: uuid.UUID, data: EmployeeAdminUpdate) -> Employee:
    employee = await admin_get_employee(db, employee_id)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(employee, field, value)
    return await EmployeeRepository(db).add(employee)
