import uuid

from sqlalchemy import select

from app.common.base_repository import BaseRepository
from app.models.employee import Employee


class EmployeeRepository(BaseRepository[Employee]):
    model = Employee

    async def get_by_user_id(self, user_id: uuid.UUID) -> Employee | None:
        # Auth hands us a User, everything else (attendance, leave, payroll) speaks
        # in employee_id — this one lookup is the bridge between those two worlds.
        stmt = select(Employee).where(Employee.user_id == user_id)
        return (await self._db.execute(stmt)).scalar_one_or_none()

    # TODO(Srijan): list_paginated(), update_fields() — profile view/edit business logic.
    # Borrowed your model for one method, promise I'll leave the rest alone.
