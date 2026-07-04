import uuid
from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.common.enums import Role
from app.core.dependencies import get_current_user, require_role
from app.db.session import get_db
from app.models.user import User
from app.modules.attendance import service
from app.modules.attendance.schemas import AttendanceOut

router = APIRouter(prefix="/attendance", tags=["attendance"])


@router.post("/check-in", response_model=AttendanceOut)
async def check_in(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return await service.check_in(db, current_user)


@router.post("/check-out", response_model=AttendanceOut)
async def check_out(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return await service.check_out(db, current_user)


@router.get("/me")
async def get_my_attendance(date_from: date, date_to: date, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return await service.get_my_attendance(db, current_user, date_from, date_to)


@router.get("/{employee_id}", dependencies=[Depends(require_role(Role.ADMIN))])
async def get_employee_attendance(employee_id: uuid.UUID, date_from: date, date_to: date, db: AsyncSession = Depends(get_db)):
    return await service.admin_get_employee_attendance(db, employee_id, date_from, date_to)


@router.get("", dependencies=[Depends(require_role(Role.ADMIN))])
async def list_attendance(date_from: date, date_to: date, limit: int = 20, offset: int = 0, db: AsyncSession = Depends(get_db)):
    return await service.admin_list_attendance(db, date_from, date_to, limit, offset)
