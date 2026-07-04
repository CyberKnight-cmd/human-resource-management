"""Payroll is read-only for employees — the only write path in this whole module is
admin_update_payroll(), and even that never UPDATEs a salary_structures row in place.
See SalaryStructure's docstring: a raise gets its own new row (is_current=True), the
previous one flips to is_current=False, and net_pay is always computed here, never
accepted from the client. All amounts are INR (see schemas.SalaryStructureOut.currency).
"""

import uuid

from app.common.audit import AuditLogger
from app.core.exceptions import NotFoundError, ValidationConflictError
from app.models.payroll import SalaryStructure
from app.models.user import User
from app.modules.payroll.repository import SalaryStructureRepository
from app.modules.payroll.schemas import SalaryStructureUpdate
from app.modules.users.repository import EmployeeRepository


class PayrollService:
    def __init__(
        self,
        salary_repo: SalaryStructureRepository,
        employee_repo: EmployeeRepository,
        audit: AuditLogger,
    ) -> None:
        self._salary_repo = salary_repo
        self._employee_repo = employee_repo
        self._audit = audit

    async def _resolve_employee_id(self, user: User) -> uuid.UUID:
        employee = await self._employee_repo.get_by_user_id(user.id)
        if employee is None:
            raise NotFoundError("No employee profile is linked to this account")
        return employee.id

    async def get_my_payroll(self, current_user: User) -> SalaryStructure:
        employee_id = await self._resolve_employee_id(current_user)
        current = await self._salary_repo.get_current(employee_id)
        if current is None:
            # Nothing sinister — onboarding just hasn't provisioned a salary
            # structure for this employee yet. Still a 404, not a 500.
            raise NotFoundError("No salary structure has been set up for this employee yet")
        return current

    async def admin_get_payroll(self, employee_id: uuid.UUID) -> list[SalaryStructure]:
        # Full history, newest first — the current row is just the one with
        # is_current=True, the client can tell which without a second endpoint.
        history = await self._salary_repo.get_history(employee_id)
        if not history:
            raise NotFoundError("No salary structure has been set up for this employee yet")
        return history

    async def admin_update_payroll(
        self, admin: User, employee_id: uuid.UUID, data: SalaryStructureUpdate
    ) -> SalaryStructure:
        net_pay = data.basic_pay + data.hra + data.allowances - data.deductions
        if net_pay < 0:
            # An admin's fat-fingered deduction shouldn't be able to make someone's
            # payslip go negative. That's a support ticket nobody wants to write up.
            raise ValidationConflictError("Deductions cannot exceed gross pay")

        previous = await self._salary_repo.get_current(employee_id)
        if previous is not None:
            previous.is_current = False
            await self._salary_repo.add(previous)

        new_version = SalaryStructure(
            employee_id=employee_id,
            basic_pay=data.basic_pay,
            hra=data.hra,
            allowances=data.allowances,
            deductions=data.deductions,
            net_pay=net_pay,
            effective_from=data.effective_from,
            is_current=True,
            updated_by=admin.id,
        )
        new_version = await self._salary_repo.add(new_version)

        self._audit.log(
            actor_user_id=admin.id,
            action="payroll.update",
            target_type="salary_structure",
            target_id=new_version.id,
            metadata={
                "employee_id": str(employee_id),
                "net_pay": float(net_pay),
                "effective_from": data.effective_from.isoformat(),
            },
        )
        return new_version
