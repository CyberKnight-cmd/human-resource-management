import uuid
from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.common.enums import AttendanceStatus, Role
from app.common.pagination import Page, PageParams
from app.core.dependencies import get_current_user, require_role
from app.db.session import get_db
from app.models.user import User
from app.modules.attendance.repository import AttendanceRepository
from app.modules.attendance.schemas import AttendanceOut, AttendanceSummaryOut
from app.modules.attendance.service import AttendanceService
from app.modules.users.repository import EmployeeRepository

router = APIRouter(prefix="/attendance", tags=["attendance"])


def get_attendance_service(db: AsyncSession = Depends(get_db)) -> AttendanceService:
    """Composition root for this module: wires the concrete repositories into the service.
    Router handlers only ever see AttendanceService — never the repositories or the session.
    All the actual wiring lives in exactly one place, so untangling it later is a
    one-file job instead of a scavenger hunt."""
    return AttendanceService(AttendanceRepository(db), EmployeeRepository(db))


@router.post("/check-in", response_model=AttendanceOut)
async def check_in(current_user: User = Depends(get_current_user), service: AttendanceService = Depends(get_attendance_service)):
    return await service.check_in(current_user)


@router.post("/check-out", response_model=AttendanceOut)
async def check_out(current_user: User = Depends(get_current_user), service: AttendanceService = Depends(get_attendance_service)):
    return await service.check_out(current_user)


@router.get("/me", response_model=list[AttendanceOut])
async def get_my_attendance(
    date_from: date,
    date_to: date,
    current_user: User = Depends(get_current_user),
    service: AttendanceService = Depends(get_attendance_service),
):
    return await service.get_my_attendance(current_user, date_from, date_to)


@router.get("/me/summary", response_model=AttendanceSummaryOut)
async def get_my_summary(
    date_from: date,
    date_to: date,
    current_user: User = Depends(get_current_user),
    service: AttendanceService = Depends(get_attendance_service),
):
    return await service.get_my_summary(current_user, date_from, date_to)


# IMPORTANT: this has to stay BELOW /me and /me/summary. FastAPI matches routes in
# registration order, and /{employee_id} is greedy enough to swallow "me" as if it
# were a UUID — Pydantic will then reject it with a very confusing error, and future-you
# will spend twenty minutes debugging a routing problem that looks like an auth problem.
@router.get("/{employee_id}", response_model=list[AttendanceOut], dependencies=[Depends(require_role(Role.ADMIN))])
async def get_employee_attendance(
    employee_id: uuid.UUID,
    date_from: date,
    date_to: date,
    service: AttendanceService = Depends(get_attendance_service),
):
    return await service.admin_get_employee_attendance(employee_id, date_from, date_to)


@router.get("/{employee_id}/summary", response_model=AttendanceSummaryOut, dependencies=[Depends(require_role(Role.ADMIN))])
async def get_employee_summary(
    employee_id: uuid.UUID,
    date_from: date,
    date_to: date,
    service: AttendanceService = Depends(get_attendance_service),
):
    return await service.get_summary_for_employee(employee_id, date_from, date_to)


@router.get("", response_model=Page[AttendanceOut], dependencies=[Depends(require_role(Role.ADMIN))])
async def list_attendance(
    date_from: date,
    date_to: date,
    status: AttendanceStatus | None = None,
    limit: int = 20,
    offset: int = 0,
    service: AttendanceService = Depends(get_attendance_service),
):
    page = PageParams(limit=limit, offset=offset)
    items, total = await service.admin_list_attendance(date_from, date_to, status, page)
    return Page(items=items, total=total, limit=page.limit, offset=page.offset)
