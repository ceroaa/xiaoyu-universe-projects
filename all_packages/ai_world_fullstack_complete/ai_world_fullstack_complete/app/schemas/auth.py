from typing import Any

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    display_name: str = Field(min_length=1, max_length=120)
    auto_create_actor: bool = True


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class EnterWorldRequest(BaseModel):
    display_name: str | None = Field(default=None, max_length=120)


class UserPayload(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    email: str
    role: str
    status: str
    display_name: str


class ActorPayload(BaseModel):
    id: str
    display_name: str
    actor_type: str
    current_room_id: str
    gold: int
    hp: int
    mp: int
    stats: dict[str, Any]


class ControllerPayload(BaseModel):
    id: str
    actor_id: str
    controller_type: str
    user_id: str | None
    is_active: bool
    priority: int


class AuthResponse(BaseModel):
    success: bool = True
    token: str
    user: UserPayload
    actor: ActorPayload | None = None
    controller: ControllerPayload | None = None


class MeResponse(BaseModel):
    success: bool = True
    user: UserPayload
    actor: ActorPayload | None = None
    controller: ControllerPayload | None = None
    has_actor: bool
    snapshot: dict[str, Any] | None = None


class EnterWorldResponse(BaseModel):
    success: bool = True
    is_first_time: bool
    user: UserPayload
    actor: ActorPayload
    controller: ControllerPayload
    snapshot: dict[str, Any]


class LogoutResponse(BaseModel):
    success: bool = True
    message: str
