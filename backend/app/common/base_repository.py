import uuid
from typing import Generic, TypeVar

from sqlalchemy.ext.asyncio import AsyncSession

ModelType = TypeVar("ModelType")


class BaseRepository(Generic[ModelType]):
    """Every module repository extends this instead of re-writing get/add/delete.

    Subclasses set `model` and add their own query methods — this class only knows
    how to talk to the DB, never what a leave request or a payslip means.
    If you find yourself copy-pasting a get_by_id() into a new repository, stop:
    you already have one, right here.
    """

    model: type[ModelType]

    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def get_by_id(self, id_: uuid.UUID) -> ModelType | None:
        return await self._db.get(self.model, id_)

    async def add(self, instance: ModelType) -> ModelType:
        self._db.add(instance)
        # flush(), not commit() — commit happens exactly once, at the end of the
        # request in get_db(). A repository committing on its own would let one
        # module's half-finished write survive another module's rollback.
        await self._db.flush()
        return instance

    async def delete(self, instance: ModelType) -> None:
        await self._db.delete(instance)
