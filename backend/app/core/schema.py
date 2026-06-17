from pydantic import BaseModel, ConfigDict


# =========================
# Модели токенов
# =========================

class TokenPayload(BaseModel):
    """
    Payload внутри JWT (внутренняя модель).
    Это НЕ для внешнего API.
    """
    sub: int
    username: str
    full_name: str
    role: str
    workstation_ids: list[int]
    exp: int
    iat: int


class TokenPair(BaseModel):
    """
    Пара JWT токенов.

    access_token — короткоживущий
    refresh_token — долгоживущий
    """
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int


# =========================
# Модель пользователя
# =========================

class UserPublic(BaseModel):
    """
    Публичная модель пользователя
    для методов /login и /me
    """
    id: int
    username: str
    full_name: str
    role: str
    workstation_ids: list[int]

    model_config = ConfigDict(from_attributes=True)
