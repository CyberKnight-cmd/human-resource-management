"""Import every model here so Base.metadata is fully populated for Alembic autogenerate."""

from app.models.attendance import AttendanceRecord  # noqa: F401
from app.models.audit_log import AuditLog  # noqa: F401
from app.models.employee import Employee, EmployeeDocument  # noqa: F401
from app.models.leave import LeaveBalance, LeaveRequest  # noqa: F401
from app.models.payroll import SalaryStructure  # noqa: F401
from app.models.user import EmailVerificationToken, RefreshToken, User  # noqa: F401
