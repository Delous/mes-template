from __future__ import annotations

import re

from fastapi import HTTPException, status
from sqlalchemy import delete, func, insert, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.admin.schema import CreateUserRequest, CreateWorkstationRequest, UpdateUserRequest
from app.auth.service import password_hash
from app.core.schema import UserPublic
from app.db.models.task import Task
from app.db.models.user import User
from app.db.models.user_workstation import UserWorkstation
from app.db.models.workstation import Workstation


CYRILLIC_TO_LATIN = {
    "а": "a",
    "б": "b",
    "в": "v",
    "г": "g",
    "д": "d",
    "е": "e",
    "ё": "e",
    "ж": "zh",
    "з": "z",
    "и": "i",
    "й": "y",
    "к": "k",
    "л": "l",
    "м": "m",
    "н": "n",
    "о": "o",
    "п": "p",
    "р": "r",
    "с": "s",
    "т": "t",
    "у": "u",
    "ф": "f",
    "х": "kh",
    "ц": "ts",
    "ч": "ch",
    "ш": "sh",
    "щ": "shch",
    "ъ": "",
    "ы": "y",
    "ь": "",
    "э": "e",
    "ю": "yu",
    "я": "ya",
}


def require_admin(user: UserPublic) -> None:
    if user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )


def transliterate_name_part(value: str) -> str:
    transliterated = []
    for char in value.strip():
        lower_char = char.lower()
        if lower_char in CYRILLIC_TO_LATIN:
            latin = CYRILLIC_TO_LATIN[lower_char]
            transliterated.append(latin.capitalize() if char.isupper() else latin)
        elif char.isascii() and char.isalpha():
            transliterated.append(char)

    return "".join(transliterated).capitalize()


def username_candidates(full_name: str):
    parts = re.split(r"\s+", full_name.strip())
    surname = transliterate_name_part(parts[0]) if parts else ""
    first_name = transliterate_name_part(parts[1]) if len(parts) > 1 else ""
    patronymic = transliterate_name_part(parts[2]) if len(parts) > 2 else ""

    if not surname:
        raise HTTPException(status_code=400, detail="Full name is invalid")

    if not first_name:
        yield surname
        return

    patronymic_initial = patronymic[:1]
    for first_len in range(1, len(first_name) + 1):
        yield f"{surname}{first_name[:first_len]}{patronymic_initial}"

    for patronymic_len in range(2, len(patronymic) + 1):
        yield f"{surname}{first_name}{patronymic[:patronymic_len]}"

    base = f"{surname}{first_name}{patronymic}"
    index = 2
    while True:
        yield f"{base}{index}"
        index += 1


async def generate_username(session: AsyncSession, full_name: str) -> str:
    result = await session.execute(select(User.username))
    existing_usernames = set(result.scalars().all())

    for candidate in username_candidates(full_name):
        if candidate not in existing_usernames:
            return candidate

    raise HTTPException(status_code=400, detail="Username could not be generated")


def serialize_user(user: User) -> dict:
    workstations = [
        {"id": link.workstation.id, "name": link.workstation.name}
        for link in user.workstation_links
        if link.workstation is not None
    ]
    workstations.sort(key=lambda workstation: workstation["id"])
    return {
        "id": user.id,
        "username": user.username,
        "full_name": user.full_name,
        "role": user.role,
        "workstations": workstations,
    }


async def get_user_with_workstations(session: AsyncSession, user_id: int) -> User | None:
    result = await session.execute(
        select(User)
        .options(
            selectinload(User.workstation_links).selectinload(
                UserWorkstation.workstation
            )
        )
        .where(User.id == user_id)
        .execution_options(populate_existing=True)
    )
    return result.scalar_one_or_none()


async def create_user(
    session: AsyncSession,
    current_user: UserPublic,
    payload: CreateUserRequest,
) -> dict:
    require_admin(current_user)

    username = await generate_username(session, payload.full_name)
    result = await session.execute(
        insert(User)
        .values(
            username=username,
            full_name=payload.full_name,
            hashed_password=password_hash.hash(payload.password),
            role=payload.role,
        )
        .returning(User.id)
    )
    user_id = result.scalar_one()

    user = await get_user_with_workstations(session, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    return serialize_user(user)


async def update_user(
    session: AsyncSession,
    current_user: UserPublic,
    user_id: int,
    payload: UpdateUserRequest,
) -> dict:
    require_admin(current_user)

    if (
        payload.role is None
        and payload.password is None
        and payload.workstation_ids is None
    ):
        raise HTTPException(status_code=400, detail="No fields to update")

    user = await get_user_with_workstations(session, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    if payload.role is not None:
        user.role = payload.role

    if payload.password is not None:
        user.hashed_password = password_hash.hash(payload.password)

    if payload.workstation_ids is not None:
        unique_workstation_ids = sorted(set(payload.workstation_ids))
        result = await session.execute(
            select(Workstation.id).where(Workstation.id.in_(unique_workstation_ids))
        )
        existing_workstation_ids = set(result.scalars().all())
        missing_ids = set(unique_workstation_ids) - existing_workstation_ids
        if missing_ids:
            raise HTTPException(
                status_code=404,
                detail=f"Workstations not found: {sorted(missing_ids)}",
            )

        user.workstation_links = [
            UserWorkstation(workstation_id=workstation_id)
            for workstation_id in unique_workstation_ids
        ]

    await session.flush()
    await session.refresh(user)

    user = await get_user_with_workstations(session, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    return serialize_user(user)


async def user_list(
    session: AsyncSession,
    current_user: UserPublic,
    page: int,
    size: int,
) -> dict:
    require_admin(current_user)

    total_result = await session.execute(select(func.count()).select_from(User))
    total = total_result.scalar_one()

    result = await session.execute(
        select(User)
        .options(
            selectinload(User.workstation_links).selectinload(
                UserWorkstation.workstation
            )
        )
        .order_by(User.created_at.desc(), User.id.desc())
        .offset((page - 1) * size)
        .limit(size)
    )
    users = result.scalars().all()

    return {
        "items": [serialize_user(user) for user in users],
        "total": total,
        "page": page,
        "size": size,
    }


async def workstation_list(
    session: AsyncSession,
    current_user: UserPublic,
) -> list[Workstation]:
    require_admin(current_user)

    result = await session.execute(select(Workstation).order_by(Workstation.id.asc()))
    return list(result.scalars().all())


async def create_workstation(
    session: AsyncSession,
    current_user: UserPublic,
    payload: CreateWorkstationRequest,
) -> Workstation:
    require_admin(current_user)

    result = await session.execute(
        select(Workstation).where(Workstation.name == payload.name)
    )
    existing_workstation = result.scalar_one_or_none()
    if existing_workstation is not None:
        raise HTTPException(status_code=409, detail="Workstation already exists")

    result = await session.execute(
        insert(Workstation)
        .values(name=payload.name, type="workstation")
        .returning(Workstation)
    )
    return result.scalar_one()


async def delete_workstation(
    session: AsyncSession,
    current_user: UserPublic,
    workstation_id: int,
) -> None:
    require_admin(current_user)

    result = await session.execute(
        select(Workstation).where(Workstation.id == workstation_id)
    )
    workstation = result.scalar_one_or_none()
    if workstation is None:
        raise HTTPException(status_code=404, detail="Workstation not found")

    tasks_count_result = await session.execute(
        select(func.count()).select_from(Task).where(Task.workstation_id == workstation_id)
    )
    if tasks_count_result.scalar_one() > 0:
        raise HTTPException(
            status_code=409,
            detail="Cannot delete workstation with tasks",
        )

    await session.execute(delete(Workstation).where(Workstation.id == workstation_id))
