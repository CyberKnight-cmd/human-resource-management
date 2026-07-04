import uuid
from collections.abc import Callable

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.common.enums import Role
from app.core.exceptions import InvalidTokenError, PermissionDeniedError
from app.core.security import TokenType, decode_token
from app.db.session import get_db
from app.models.user import User

_bearer_scheme = HTTPBearer(auto_error=True)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    payload = decode_token(credentials.credentials, TokenType.ACCESS)

    user_id = payload.get("sub")
    try:
        user_uuid = uuid.UUID(user_id)
    except (TypeError, ValueError) as exc:
        raise InvalidTokenError("Malformed subject claim") from exc

    user = (await db.execute(select(User).where(User.id == user_uuid))).scalar_one_or_none()
    if user is None or not user.is_active:
        raise InvalidTokenError("User not found or deactivated")

    return user


def require_role(*allowed_roles: Role) -> Callable:
    """Dependency factory: `Depends(require_role(Role.ADMIN))` on any admin-only route.

    Object-level checks (e.g. an employee viewing their OWN attendance vs someone else's)
    are NOT expressible by role alone — those live inside the service, comparing
    current_user.id against the resource's owning employee_id.
    """

    async def _checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise PermissionDeniedError("You do not have permission to perform this action")
        return current_user

    return _checker
