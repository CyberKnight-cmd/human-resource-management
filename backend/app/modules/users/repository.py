import uuid

from sqlalchemy import func, select

from app.common.base_repository import BaseRepository
from app.common.pagination import PageParams, paginate
from app.models.employee import Employee


class EmployeeRepository(BaseRepository[Employee]):
    model = Employee

    async def get_by_user_id(self, user_id: uuid.UUID) -> Employee | None:
        # Auth hands us a User, everything else (attendance, leave, payroll) speaks
        # in employee_id — this one lookup is the bridge between those two worlds.
        stmt = select(Employee).where(Employee.user_id == user_id)
        return (await self._db.execute(stmt)).scalar_one_or_none()

    async def list_paginated(self, page: PageParams) -> tuple[list[Employee], int]:
        stmt = select(Employee).order_by(Employee.last_name, Employee.first_name)
        rows, total = await paginate(self._db, stmt, page)
        return list(rows), total

    async def count_all(self) -> int:
        # Headcount for the admin dashboard — a plain COUNT(*), no rows pulled.
        return (await self._db.execute(select(func.count()).select_from(Employee))).scalar_one()
