import uuid
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.audit_log import AuditLog


class AuditLogger:
    """Constructor-injected like every other collaborator in this codebase — no
    free-floating log_action() function, no service reaching into a repository's
    private session just to write one audit row. Small class, does one thing:
    somebody approved something, and this makes sure we can prove it later."""

    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    def log(
        self,
        *,
        actor_user_id: uuid.UUID,
        action: str,
        target_type: str,
        target_id: uuid.UUID,
        metadata: dict[str, Any] | None = None,
    ) -> None:
        """Queues one audit row. Doesn't commit — it rides along in the same
        transaction as whatever business change it's documenting, so the two
        can never disagree about whether something actually happened."""
        self._db.add(
            AuditLog(
                actor_user_id=actor_user_id,
                action=action,
                target_type=target_type,
                target_id=target_id,
                extra_data=metadata or {},
            )
        )
