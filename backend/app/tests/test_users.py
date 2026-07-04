# Users module test suite.
# get_own_profile/update_own_profile are the self-service half; admin_* is the HR half.
# The one rule worth stress-testing here: EmployeeSelfUpdate physically cannot carry
# first_name/department/etc, so "an employee edits their own department" isn't a
# permission check that can fail at runtime -- it's a shape that can't be constructed.

import uuid

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.modules.users import service
from app.modules.users.schemas import EmployeeAdminUpdate, EmployeeSelfUpdate

# ---------------------------------------------------------------------------
# get_own_profile / update_own_profile
# ---------------------------------------------------------------------------


async def test_get_own_profile_returns_the_linked_employee(db_session: AsyncSession, make_employee):
    user, employee = await make_employee()

    profile = await service.get_own_profile(db_session, user)

    assert profile.id == employee.id


async def test_get_own_profile_without_employee_profile_raises_not_found(db_session: AsyncSession):
    from app.common.enums import Role
    from app.models.user import User

    orphan = User(employee_code="ORPHAN1", email="orphan@example.com", hashed_password="x", role=Role.EMPLOYEE)
    db_session.add(orphan)
    await db_session.flush()

    with pytest.raises(NotFoundError):
        await service.get_own_profile(db_session, orphan)


async def test_update_own_profile_applies_self_editable_fields(db_session: AsyncSession, make_employee):
    user, employee = await make_employee()

    updated = await service.update_own_profile(
        db_session, user, EmployeeSelfUpdate(phone="9876543210", address="221B Baker Street")
    )

    assert updated.phone == "9876543210"
    assert updated.address == "221B Baker Street"


async def test_update_own_profile_only_touches_fields_that_were_set(db_session: AsyncSession, make_employee):
    # Partial update -- untouched fields keep their existing value, not None.
    user, employee = await make_employee()
    employee.phone = "1111111111"
    await db_session.flush()

    updated = await service.update_own_profile(db_session, user, EmployeeSelfUpdate(address="New Address"))

    assert updated.phone == "1111111111"
    assert updated.address == "New Address"


# ---------------------------------------------------------------------------
# admin_list_employees / admin_get_employee / admin_update_employee
# ---------------------------------------------------------------------------


async def test_admin_list_employees_paginates(db_session: AsyncSession, make_employee):
    for _ in range(3):
        await make_employee()

    page = await service.admin_list_employees(db_session, limit=2, offset=0)

    assert page.total == 3
    assert len(page.items) == 2
    assert page.limit == 2
    assert page.offset == 0


async def test_admin_get_employee_returns_employee(db_session: AsyncSession, make_employee):
    _, employee = await make_employee()

    found = await service.admin_get_employee(db_session, employee.id)

    assert found.id == employee.id


async def test_admin_get_employee_unknown_id_raises_not_found(db_session: AsyncSession):
    with pytest.raises(NotFoundError):
        await service.admin_get_employee(db_session, uuid.uuid4())


async def test_admin_update_employee_can_set_admin_only_fields(db_session: AsyncSession, make_employee):
    # Unlike EmployeeSelfUpdate, admins CAN change department/designation/name --
    # that's the entire point of EmployeeAdminUpdate existing as a separate schema.
    _, employee = await make_employee()

    updated = await service.admin_update_employee(
        db_session,
        employee.id,
        EmployeeAdminUpdate(department="Engineering", designation="Senior SWE"),
    )

    assert updated.department == "Engineering"
    assert updated.designation == "Senior SWE"


async def test_admin_update_employee_unknown_id_raises_not_found(db_session: AsyncSession):
    with pytest.raises(NotFoundError):
        await service.admin_update_employee(db_session, uuid.uuid4(), EmployeeAdminUpdate(department="Engineering"))
