from enum import StrEnum


class Role(StrEnum):
    ADMIN = "admin"
    EMPLOYEE = "employee"


class LeaveType(StrEnum):
    PAID = "paid"
    SICK = "sick"
    UNPAID = "unpaid"


class LeaveStatus(StrEnum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class AttendanceStatus(StrEnum):
    PRESENT = "present"
    ABSENT = "absent"
    HALF_DAY = "half_day"
    LEAVE = "leave"
