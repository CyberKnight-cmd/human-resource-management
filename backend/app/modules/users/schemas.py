import uuid
from datetime import date

from pydantic import BaseModel


class EmployeeOut(BaseModel):
    id: uuid.UUID
    first_name: str
    last_name: str
    phone: str | None
    address: str | None
    profile_picture_url: str | None
    department: str | None
    designation: str | None
    date_of_joining: date | None

    model_config = {"from_attributes": True}


class EmployeeSelfUpdate(BaseModel):
    phone: str | None = None
    address: str | None = None
    profile_picture_url: str | None = None


class EmployeeAdminUpdate(EmployeeSelfUpdate):
    first_name: str | None = None
    last_name: str | None = None
    department: str | None = None
    designation: str | None = None
    date_of_joining: date | None = None
