import uuid

from sqlalchemy import ForeignKey, JSON, String, Uuid
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin, UUIDPKMixin

# Plain JSON everywhere (e.g. SQLite in tests); real JSONB on Postgres in prod for indexing/query support.
# Best of both: the test suite doesn't need Postgres installed, and prod doesn't pay for it.
JSONVariant = JSON().with_variant(JSONB(), "postgresql")


class AuditLog(UUIDPKMixin, TimestampMixin, Base):
    __tablename__ = "audit_logs"

    actor_user_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("users.id"), index=True)
    action: Mapped[str] = mapped_column(String(100))  # e.g. "leave.approve", "payroll.update"
    target_type: Mapped[str] = mapped_column(String(50))
    target_id: Mapped[uuid.UUID] = mapped_column(Uuid)
    extra_data: Mapped[dict] = mapped_column(JSONVariant, default=dict)
