import asyncio
import os
import sys

from pwdlib import PasswordHash
from sqlalchemy import select

from app.db.models.user import User
from app.db.session import SessionMaker


password_hash = PasswordHash.recommended()


async def main():
    username = os.getenv("ADMIN_USERNAME", "admin")
    password = os.getenv("ADMIN_PASSWORD")
    full_name = os.getenv("ADMIN_FULL_NAME", "Administrator")

    if not password:
        print("ADMIN_PASSWORD is required", file=sys.stderr)
        raise SystemExit(1)

    async with SessionMaker() as session:
        result = await session.execute(
            select(User).where(User.username == username)
        )
        existing = result.scalar_one_or_none()

        if existing:
            print(f"Admin already exists: {username}")
            return

        admin = User(
            username=username,
            full_name=full_name,
            hashed_password=password_hash.hash(password),
            role="admin",
        )

        session.add(admin)
        await session.commit()

        print(f"Created admin: {username}")


asyncio.run(main())
