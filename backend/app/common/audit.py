import uuid
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.audit_log import AuditLog


async def log_action(
    db: AsyncSession,
    *,
    actor_user_id: uuid.UUID,
    action: str,
    target_type: str,
    target_id: uuid.UUID,
    metadata: dict[str, Any] | None = None,
) -> None:
    """Writes one audit row. Called by services after approvals, payroll edits, and admin profile edits.

    Does not commit — caller's transaction (the same one mutating the business row) commits both together.
    """
    db.add(
        AuditLog(
            actor_user_id=actor_user_id,
            action=action,
            target_type=target_type,
            target_id=target_id,
            extra_data=metadata or {},
        )
    )
