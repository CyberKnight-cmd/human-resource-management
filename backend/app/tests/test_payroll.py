# Payroll module test suite.
# Everything in here is denominated in INR — basic_pay/hra/allowances/deductions are
# meant to look like an actual Indian payslip, not placeholder numbers, so a wrong
# net_pay calculation reads as obviously wrong instead of blending into round test data.

from datetime import date, timedelta

import pytest
from pydantic import ValidationError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.common.audit import AuditLogger
from app.common.enums import Role
from app.core.exceptions import NotFoundError, ValidationConflictError
from app.models.audit_log import AuditLog
from app.modules.payroll.repository import SalaryStructureRepository
from app.modules.payroll.schemas import SalaryStructureUpdate
from app.modules.payroll.service import PayrollService
from app.modules.users.repository import EmployeeRepository

TODAY = date.today()


def make_service(db_session: AsyncSession) -> PayrollService:
    return PayrollService(SalaryStructureRepository(db_session), EmployeeRepository(db_session), AuditLogger(db_session))


# A realistic-looking Indian monthly payslip: 45k basic + 18k HRA + 5k allowances,
# 3k deducted for PF/tax-ish reasons -> 65k net. Round numbers on purpose, wrong
# math would be obvious at a glance instead of hiding in a jumble of decimals.
def sample_update(**overrides) -> SalaryStructureUpdate:
    fields = dict(basic_pay=45000.0, hra=18000.0, allowances=5000.0, deductions=3000.0, effective_from=TODAY)
    fields.update(overrides)
    return SalaryStructureUpdate(**fields)


# ---------------------------------------------------------------------------
# schema-level guards
# ---------------------------------------------------------------------------


def test_negative_basic_pay_rejected_by_schema():
    # Nobody gets paid a negative salary. Pydantic should refuse before this
    # number ever gets anywhere near a database.
    with pytest.raises(ValidationError):
        SalaryStructureUpdate(basic_pay=-1000.0, effective_from=TODAY)


# ---------------------------------------------------------------------------
# admin_update_payroll — first version, versioning, net_pay math
# ---------------------------------------------------------------------------


async def test_first_update_creates_current_version_with_correct_net_pay(db_session, make_employee):
    _, employee = await make_employee()
    admin, _ = await make_employee(role=Role.ADMIN)
    service = make_service(db_session)

    version = await service.admin_update_payroll(admin, employee.id, sample_update())

    assert version.is_current is True
    assert version.net_pay == 65000.0  # 45000 + 18000 + 5000 - 3000
    assert version.updated_by == admin.id


async def test_second_update_supersedes_the_first(db_session, make_employee):
    """The old row doesn't get overwritten, it gets retired. History is the whole point —
    an admin should be able to answer "what did this person earn in March" forever."""
    _, employee = await make_employee()
    admin, _ = await make_employee(role=Role.ADMIN)
    service = make_service(db_session)

    first = await service.admin_update_payroll(admin, employee.id, sample_update(basic_pay=40000.0))
    second = await service.admin_update_payroll(
        admin, employee.id, sample_update(basic_pay=50000.0, effective_from=TODAY + timedelta(days=30))
    )

    history = await service.admin_get_payroll(employee.id)
    assert len(history) == 2

    by_id = {row.id: row for row in history}
    assert by_id[first.id].is_current is False
    assert by_id[second.id].is_current is True
    assert second.net_pay == 70000.0  # 50000 + 18000 + 5000 - 3000


async def test_deductions_exceeding_gross_pay_is_rejected(db_session, make_employee):
    _, employee = await make_employee()
    admin, _ = await make_employee(role=Role.ADMIN)
    service = make_service(db_session)

    with pytest.raises(ValidationConflictError):
        # 1000 gross, 5000 deducted — somebody would owe the company money. No.
        await service.admin_update_payroll(
            admin, employee.id, sample_update(basic_pay=1000.0, hra=0, allowances=0, deductions=5000.0)
        )


async def test_update_writes_an_audit_log_entry(db_session, make_employee):
    _, employee = await make_employee()
    admin, _ = await make_employee(role=Role.ADMIN)
    service = make_service(db_session)

    version = await service.admin_update_payroll(admin, employee.id, sample_update())

    row = (
        await db_session.execute(select(AuditLog).where(AuditLog.target_id == version.id))
    ).scalar_one()
    assert row.action == "payroll.update"
    assert row.actor_user_id == admin.id
    assert row.extra_data["employee_id"] == str(employee.id)


# ---------------------------------------------------------------------------
# get_my_payroll / admin_get_payroll — read paths
# ---------------------------------------------------------------------------


async def test_employee_without_a_salary_structure_gets_not_found(db_session, make_employee):
    user, _ = await make_employee()  # deliberately: no admin_update_payroll() call
    service = make_service(db_session)

    with pytest.raises(NotFoundError):
        await service.get_my_payroll(user)


async def test_employee_sees_their_own_current_payroll(db_session, make_employee):
    user, employee = await make_employee()
    admin, _ = await make_employee(role=Role.ADMIN)
    service = make_service(db_session)

    await service.admin_update_payroll(admin, employee.id, sample_update(basic_pay=40000.0))
    current = await service.admin_update_payroll(admin, employee.id, sample_update(basic_pay=52000.0))

    mine = await service.get_my_payroll(user)
    assert mine.id == current.id
    assert mine.is_current is True


async def test_admin_get_payroll_for_unprovisioned_employee_is_not_found(db_session, make_employee):
    _, employee = await make_employee()
    service = make_service(db_session)

    with pytest.raises(NotFoundError):
        await service.admin_get_payroll(employee.id)


async def test_history_is_scoped_to_one_employee(db_session, make_employee):
    _, employee_a = await make_employee()
    _, employee_b = await make_employee()
    admin, _ = await make_employee(role=Role.ADMIN)
    service = make_service(db_session)

    await service.admin_update_payroll(admin, employee_a.id, sample_update())
    await service.admin_update_payroll(admin, employee_b.id, sample_update())

    history_a = await service.admin_get_payroll(employee_a.id)
    assert len(history_a) == 1
    assert history_a[0].employee_id == employee_a.id
