import uuid
from datetime import date
from typing import Literal

from pydantic import BaseModel, Field


class SalaryStructureOut(BaseModel):
    id: uuid.UUID
    employee_id: uuid.UUID
    currency: Literal["INR"] = "INR"  # single-currency system — a label, not a choice
    basic_pay: float
    hra: float
    allowances: float
    deductions: float
    net_pay: float
    effective_from: date
    is_current: bool

    model_config = {"from_attributes": True}


class SalaryStructureUpdate(BaseModel):
    # No net_pay field here on purpose — it's derived server-side (basic + hra +
    # allowances - deductions), never trusted from the client. An admin fat-fingering
    # a net_pay that doesn't match its own components should be impossible, not just discouraged.
    basic_pay: float = Field(ge=0)
    hra: float = Field(default=0, ge=0)
    allowances: float = Field(default=0, ge=0)
    deductions: float = Field(default=0, ge=0)
    effective_from: date
