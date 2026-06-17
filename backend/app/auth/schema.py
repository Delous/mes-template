from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    """
    Данные для входа пользователя:
    - login
    - password
    """
    login: str = Field(
        ...,
        min_length=3,
        max_length=128,
        description="Username или email",
        examples=["user123", "user@example.com"],
    )
    password: str = Field(
        ...,
        min_length=6,
        max_length=128,
        description="Пароль пользователя",
        examples=["supersecret"],
    )
