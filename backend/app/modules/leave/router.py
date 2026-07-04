import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.common.audit import AuditLogger
from app.common.enums import LeaveStatus, Role
from app.common.pagination import Page, PageParams
from app.core.dependencies import get_current_user, require_role
from app.db.session import get_db
from app.models.user import User
from app.modules.attendance.repository import AttendanceRepository
from app.modules.leave.repository import LeaveBalanceRepository, LeaveRequestRepository
from app.modules.leave.schemas import LeaveApplyRequest, LeaveBalanceOut, LeaveDecisionRequest, LeaveRequestOut
from app.modules.leave.service import LeaveService
from app.modules.users.repository import EmployeeRepository

router = APIRouter(prefix="/leave", tags=["leave"])


def get_leave_service(db: AsyncSession = Depends(get_db)) -> LeaveService:
    """Composition root for this module — same idea as Attendance's: wire the concrete
    repositories (borrowing AttendanceRepository directly, on purpose — Leave doesn't
    own attendance_records, it just has a standing invitation to write LEAVE into it)
    into one service, and never let a route handler see anything below that service."""
    return LeaveService(
        LeaveRequestRepository(db),
        LeaveBalanceRepository(db),
        AttendanceRepository(db),
        EmployeeRepository(db),
        AuditLogger(db),
    )


@router.get("/balance", response_model=list[LeaveBalanceOut])
async def get_my_balance(
    year: int,
    current_user: User = Depends(get_current_user),
    service: LeaveService = Depends(get_leave_service),
):
    return await service.get_my_balance(current_user, year)


@router.post("/requests", response_model=LeaveRequestOut)
async def apply_leave(
    data: LeaveApplyRequest,
    current_user: User = Depends(get_current_user),
    service: LeaveService = Depends(get_leave_service),
):
    return await service.apply_leave(current_user, data)


@router.get("/requests/me", response_model=Page[LeaveRequestOut])
async def list_my_requests(
    limit: int = 20,
    offset: int = 0,
    current_user: User = Depends(get_current_user),
    service: LeaveService = Depends(get_leave_service),
):
    page = PageParams(limit=limit, offset=offset)
    items, total = await service.list_my_requests(current_user, page)
    return Page(items=items, total=total, limit=page.limit, offset=page.offset)


@router.get("/requests", response_model=Page[LeaveRequestOut], dependencies=[Depends(require_role(Role.ADMIN))])
async def list_all_requests(
    status_filter: LeaveStatus | None = None,
    employee_id: uuid.UUID | None = None,
    limit: int = 20,
    offset: int = 0,
    service: LeaveService = Depends(get_leave_service),
):
    page = PageParams(limit=limit, offset=offset)
    items, total = await service.admin_list_requests(status_filter, employee_id, page)
    return Page(items=items, total=total, limit=page.limit, offset=page.offset)


# Same rule as Attendance's /{employee_id}: this greedy path param has to stay below
# every literal sibling path ("/requests/me" above it) or FastAPI will try to parse
# "me" as a UUID and hand back a confusing 422 instead of the route you meant.
# Ask me how I know. Actually don't, it's the same story as last time.
@router.get("/requests/{request_id}", response_model=LeaveRequestOut)
async def get_request(
    request_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    service: LeaveService = Depends(get_leave_service),
):
    return await service.get_request(current_user, request_id)


@router.patch(
    "/requests/{request_id}/decision",
    response_model=LeaveRequestOut,
    dependencies=[Depends(require_role(Role.ADMIN))],
)
async def decide_request(
    request_id: uuid.UUID,
    data: LeaveDecisionRequest,
    reviewer: User = Depends(get_current_user),
    service: LeaveService = Depends(get_leave_service),
):
    return await service.decide(reviewer, request_id, data)
