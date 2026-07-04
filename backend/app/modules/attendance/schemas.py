import uuid
from datetime import date, datetime

from pydantic import BaseModel

from app.common.enums import AttendanceStatus


class AttendanceOut(BaseModel):
    id: uuid.UUID
    employee_id: uuid.UUID
    date: date
    check_in_time: datetime | None
    check_out_time: datetime | None
    status: AttendanceStatus

    model_config = {"from_attributes": True}
