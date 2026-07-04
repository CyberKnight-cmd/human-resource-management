import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.common.enums import LeaveStatus, Role
from app.core.dependencies import get_current_user, require_role
from app.db.session import get_db
from app.models.user import User
from app.modules.leave import service
from app.modules.leave.schemas import LeaveApplyRequest, LeaveDecisionRequest, LeaveRequestOut

router = APIRouter(prefix="/leave", tags=["leave"])


@router.get("/balance")
async def get_balance(year: int, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return await service.get_balance(db, current_user, year)


@router.post("/requests", response_model=LeaveRequestOut)
async def apply_leave(data: LeaveApplyRequest, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return await service.apply_leave(db, current_user, data)


@router.get("/requests/me")
async def list_my_requests(limit: int = 20, offset: int = 0, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return await service.list_my_requests(db, current_user, limit, offset)


@router.get("/requests", dependencies=[Depends(require_role(Role.ADMIN))])
async def list_all_requests(status_filter: LeaveStatus | None = None, employee_id: uuid.UUID | None = None, limit: int = 20, offset: int = 0, db: AsyncSession = Depends(get_db)):
    return await service.admin_list_requests(db, status_filter, employee_id, limit, offset)


@router.get("/requests/{request_id}", response_model=LeaveRequestOut)
async def get_request(request_id: uuid.UUID, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return await service.get_request(db, current_user, request_id)


@router.patch("/requests/{request_id}/decision", response_model=LeaveRequestOut, dependencies=[Depends(require_role(Role.ADMIN))])
async def decide_request(request_id: uuid.UUID, data: LeaveDecisionRequest, reviewer: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return await service.decide(db, reviewer, request_id, data)
