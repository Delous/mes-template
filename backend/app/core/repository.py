from typing import Generic, TypeVar

from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession


ModelType = TypeVar("ModelType")
CreateSchemaType = TypeVar("CreateSchemaType", bound=BaseModel)
UpdateSchemaType = TypeVar("UpdateSchemaType", bound=BaseModel)


class BaseRepository(Generic[ModelType, CreateSchemaType, UpdateSchemaType]):
    def __init__(self, model: type[ModelType], session: AsyncSession):
        self.model = model
        self.session = session

    async def get_by_id(self, obj_id: int) -> ModelType | None:
        return await self.session.get(self.model, obj_id)

    async def get_all(
        self,
        skip: int = 0,
        limit: int = 10,
    ) -> list[ModelType]:
        stmt = (
            select(self.model)
            .offset(skip)
            .limit(limit)
        )

        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def create(self, schema: CreateSchemaType) -> ModelType:
        data = schema.model_dump()

        obj = self.model(**data)

        self.session.add(obj)
        await self.session.commit()
        await self.session.refresh(obj)

        return obj

    async def update(
        self,
        obj: ModelType,
        schema: UpdateSchemaType,
    ) -> ModelType:
        data = schema.model_dump(exclude_unset=True)

        for field, value in data.items():
            setattr(obj, field, value)

        await self.session.commit()
        await self.session.refresh(obj)

        return obj

    async def delete(self, obj: ModelType) -> None:
        await self.session.delete(obj)
        await self.session.commit()

    async def exists_by_id(self, obj_id: int) -> bool:
        obj = await self.get_by_id(obj_id)
        return obj is not None