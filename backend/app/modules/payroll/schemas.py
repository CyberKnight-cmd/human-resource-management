import uuid
from datetime import date

from pydantic import BaseModel


class SalaryStructureOut(BaseModel):
    id: uuid.UUID
    employee_id: uuid.UUID
    basic_pay: float
    hra: float
    allowances: float
    deductions: float
    net_pay: float
    effective_from: date
    is_current: bool

    model_config = {"from_attributes": True}


class SalaryStructureUpdate(BaseModel):
    basic_pay: float
    hra: float = 0
    allowances: float = 0
    deductions: float = 0
    effective_from: date
