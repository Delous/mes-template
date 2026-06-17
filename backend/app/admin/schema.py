from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


UserRole = Literal["operator", "reviewer", "storekeeper"]


class WorkstationResponse(BaseModel):
    id: int
    name: str

    model_config = ConfigDict(from_attributes=True)


class CreateUserRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    full_name: str = Field(min_length=1, max_length=256)
    password: str = Field(min_length=6, max_length=128)
    role: UserRole


class UpdateUserRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    password: str | None = Field(default=None, min_length=6, max_length=128)
    role: UserRole | None = None
    workstation_ids: list[int] | None = None


class UserResponse(BaseModel):
    id: int
    username: str
    full_name: str
    role: str
    workstations: list[WorkstationResponse]


class UserListResponse(BaseModel):
    items: list[UserResponse]
    total: int
    page: int
    size: int


class CreateWorkstationRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    name: str = Field(min_length=1, max_length=256)
