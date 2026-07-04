"""Field-level edit permission (self: phone/address/profile_picture_url vs admin: all fields)
is enforced here — see Employee.SELF_EDITABLE_FIELDS."""

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.modules.users.schemas import EmployeeAdminUpdate, EmployeeSelfUpdate


async def get_own_profile(db: AsyncSession, current_user: User):
    raise NotImplementedError


async def update_own_profile(db: AsyncSession, current_user: User, data: EmployeeSelfUpdate):
    raise NotImplementedError


async def admin_list_employees(db: AsyncSession, limit: int, offset: int):
    raise NotImplementedError


async def admin_get_employee(db: AsyncSession, employee_id):
    raise NotImplementedError


async def admin_update_employee(db: AsyncSession, employee_id, data: EmployeeAdminUpdate):
    raise NotImplementedError
