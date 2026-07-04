import uuid

from sqlalchemy import select

from app.common.base_repository import BaseRepository
from app.models.payroll import SalaryStructure


class SalaryStructureRepository(BaseRepository[SalaryStructure]):
    model = SalaryStructure

    async def get_current(self, employee_id: uuid.UUID) -> SalaryStructure | None:
        # Exactly one row per employee should ever have is_current=True — service
        # is what enforces that invariant (flip the old one off before adding the new one),
        # this method just trusts it and asks for "the" current row, singular.
        stmt = select(SalaryStructure).where(
            SalaryStructure.employee_id == employee_id,
            SalaryStructure.is_current.is_(True),
        )
        return (await self._db.execute(stmt)).scalar_one_or_none()

    async def get_history(self, employee_id: uuid.UUID) -> list[SalaryStructure]:
        stmt = (
            select(SalaryStructure)
            .where(SalaryStructure.employee_id == employee_id)
            .order_by(SalaryStructure.effective_from.desc())
        )
        return list((await self._db.execute(stmt)).scalars().all())
