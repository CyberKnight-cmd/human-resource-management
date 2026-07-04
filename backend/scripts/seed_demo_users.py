"""Testing-only shortcut: creates one verified admin and one verified employee
account directly in the DB (skipping signup's email-verification step -- there's
no SMTP configured yet, so the real flow has no way to deliver a link), then
seeds each with enough attendance/leave/payroll history that their dashboards
aren't just zeros.

Safe to re-run: every step checks for existing rows first, so nothing gets
duplicated on a second pass.

Run with: uv run python scripts/seed_demo_users.py
"""

import asyncio
from datetime import date, datetime, time, timedelta, timezone

from sqlalchemy import select

import app.models  # noqa: F401 — registers every table on Base.metadata
from app.common.enums import AttendanceStatus, LeaveStatus, LeaveType, Role
from app.core.security import hash_password
from app.db.base import Base
from app.db.session import AsyncSessionLocal, engine
from app.models.attendance import AttendanceRecord
from app.models.employee import Employee
from app.models.leave import LeaveBalance, LeaveRequest
from app.models.payroll import SalaryStructure
from app.models.user import User

DEMO_USERS = [
    {
        "employee_code": "ADMIN001",
        "email": "admin@example.com",
        "password": "Admin123!",
        "role": Role.ADMIN,
        "first_name": "Ada",
        "last_name": "Admin",
        "basic_pay": 90000,
    },
    {
        "employee_code": "EMP001",
        "email": "employee@example.com",
        "password": "Employee123!",
        "role": Role.EMPLOYEE,
        "first_name": "Eve",
        "last_name": "Employee",
        "basic_pay": 50000,
    },
]


async def get_or_create_user(db, spec: dict) -> User:
    user = (await db.execute(select(User).where(User.email == spec["email"]))).scalar_one_or_none()
    if user is not None:
        print(f"User already exists: {spec['email']}")
        return user

    user = User(
        employee_code=spec["employee_code"],
        email=spec["email"],
        hashed_password=hash_password(spec["password"]),
        role=spec["role"],
        is_email_verified=True,
        is_active=True,
    )
    db.add(user)
    await db.flush()
    print(f"Created {spec['role'].value}: {spec['email']} / {spec['password']}")
    return user


async def get_or_create_employee(db, user: User, spec: dict) -> Employee:
    employee = (await db.execute(select(Employee).where(Employee.user_id == user.id))).scalar_one_or_none()
    if employee is not None:
        return employee

    employee = Employee(user_id=user.id, first_name=spec["first_name"], last_name=spec["last_name"])
    db.add(employee)
    await db.flush()
    return employee


async def seed_attendance(db, employee: Employee) -> None:
    """Last 5 weekdays: mostly full days, one half-day, so the summary chart isn't flat."""
    today = date.today()
    day = today - timedelta(days=1)  # start from yesterday -- today may still be in progress
    seeded = 0
    while seeded < 5:
        if day.weekday() < 5:  # Mon-Fri only
            exists = (
                await db.execute(
                    select(AttendanceRecord).where(
                        AttendanceRecord.employee_id == employee.id, AttendanceRecord.date == day
                    )
                )
            ).scalar_one_or_none()
            if exists is None:
                is_half_day = seeded == 2  # one half-day in the middle of the week for variety
                check_in = datetime.combine(day, time(9, 15), tzinfo=timezone.utc)
                check_out = (
                    datetime.combine(day, time(13, 0), tzinfo=timezone.utc)
                    if is_half_day
                    else datetime.combine(day, time(18, 30), tzinfo=timezone.utc)
                )
                db.add(
                    AttendanceRecord(
                        employee_id=employee.id,
                        date=day,
                        check_in_time=check_in,
                        check_out_time=check_out,
                        status=AttendanceStatus.HALF_DAY if is_half_day else AttendanceStatus.PRESENT,
                    )
                )
            seeded += 1
        day -= timedelta(days=1)


async def seed_leave(db, employee: Employee, reviewer: User) -> None:
    year = date.today().year
    balances = {
        LeaveType.PAID: (12.0, 2.0),
        LeaveType.SICK: (6.0, 1.0),
        LeaveType.UNPAID: (0.0, 0.0),
    }
    for leave_type, (total, used) in balances.items():
        exists = (
            await db.execute(
                select(LeaveBalance).where(
                    LeaveBalance.employee_id == employee.id,
                    LeaveBalance.leave_type == leave_type,
                    LeaveBalance.year == year,
                )
            )
        ).scalar_one_or_none()
        if exists is None:
            db.add(
                LeaveBalance(employee_id=employee.id, leave_type=leave_type, year=year, total_allocated=total, used=used)
            )

    has_requests = (
        await db.execute(select(LeaveRequest).where(LeaveRequest.employee_id == employee.id).limit(1))
    ).scalar_one_or_none()
    if has_requests is not None:
        return

    today = date.today()
    db.add(
        LeaveRequest(
            employee_id=employee.id,
            leave_type=LeaveType.PAID,
            start_date=today + timedelta(days=7),
            end_date=today + timedelta(days=7),
            days_count=1.0,
            remarks="Family event",
            status=LeaveStatus.PENDING,
        )
    )
    db.add(
        LeaveRequest(
            employee_id=employee.id,
            leave_type=LeaveType.SICK,
            start_date=today - timedelta(days=10),
            end_date=today - timedelta(days=9),
            days_count=1.0,
            remarks="Fever",
            status=LeaveStatus.APPROVED,
            reviewed_by=reviewer.id,
            reviewer_comment="Get well soon",
            reviewed_at=datetime.now(timezone.utc) - timedelta(days=9),
        )
    )


async def seed_payroll(db, employee: Employee, updated_by: User, basic_pay: float) -> None:
    exists = (
        await db.execute(
            select(SalaryStructure).where(SalaryStructure.employee_id == employee.id, SalaryStructure.is_current.is_(True))
        )
    ).scalar_one_or_none()
    if exists is not None:
        return

    hra = round(basic_pay * 0.4, 2)
    allowances = round(basic_pay * 0.1, 2)
    deductions = round(basic_pay * 0.05, 2)
    net_pay = round(basic_pay + hra + allowances - deductions, 2)

    db.add(
        SalaryStructure(
            employee_id=employee.id,
            basic_pay=basic_pay,
            hra=hra,
            allowances=allowances,
            deductions=deductions,
            net_pay=net_pay,
            effective_from=date.today().replace(day=1),
            is_current=True,
            updated_by=updated_by.id,
        )
    )


async def main() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
        users = {spec["email"]: await get_or_create_user(db, spec) for spec in DEMO_USERS}
        admin_user = users[DEMO_USERS[0]["email"]]

        for spec in DEMO_USERS:
            employee = await get_or_create_employee(db, users[spec["email"]], spec)
            await seed_attendance(db, employee)
            await seed_leave(db, employee, reviewer=admin_user)
            await seed_payroll(db, employee, updated_by=admin_user, basic_pay=spec["basic_pay"])

        await db.commit()
        print("Mock data seeded (attendance, leave balances/requests, payroll).")


if __name__ == "__main__":
    asyncio.run(main())
