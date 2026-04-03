from __future__ import annotations

import base64
import hashlib
import hmac
import json
from datetime import datetime, timedelta, timezone
from typing import Any
from uuid import UUID

from fastapi import HTTPException, status
from passlib.context import CryptContext
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.ai import Controller
from app.models.enums import ActorStatus, ActorType, ControllerType, UserRole, UserStatus
from app.models.user import User
from app.models.world import Actor, Room
from app.services.world_state import build_room_snapshot

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")


def hash_password(raw_password: str) -> str:
    return pwd_context.hash(raw_password)


def verify_password(raw_password: str, password_hash: str) -> bool:
    if password_hash.startswith("sha256$"):
        expected = password_hash.split("$", 1)[1]
        actual = hashlib.sha256(raw_password.encode("utf-8")).hexdigest()
        return hmac.compare_digest(actual, expected)
    return pwd_context.verify(raw_password, password_hash)


def create_access_token(user_id: str) -> str:
    expires_at = datetime.now(timezone.utc) + timedelta(hours=settings.AUTH_TOKEN_EXPIRE_HOURS)
    payload = {"sub": user_id, "exp": int(expires_at.timestamp())}
    payload_bytes = json.dumps(payload, separators=(",", ":"), sort_keys=True).encode("utf-8")
    payload_b64 = base64.urlsafe_b64encode(payload_bytes).rstrip(b"=").decode("ascii")
    signature = hmac.new(
        settings.AUTH_SECRET_KEY.encode("utf-8"), payload_b64.encode("ascii"), hashlib.sha256
    ).digest()
    sig_b64 = base64.urlsafe_b64encode(signature).rstrip(b"=").decode("ascii")
    return f"{payload_b64}.{sig_b64}"


def decode_access_token(token: str) -> dict[str, Any]:
    try:
        payload_b64, sig_b64 = token.split(".", 1)
    except ValueError as exc:
        raise _unauthorized("invalid token format") from exc

    expected_sig = hmac.new(
        settings.AUTH_SECRET_KEY.encode("utf-8"), payload_b64.encode("ascii"), hashlib.sha256
    ).digest()
    actual_sig = _b64url_decode(sig_b64)
    if not hmac.compare_digest(expected_sig, actual_sig):
        raise _unauthorized("invalid token signature")

    payload = json.loads(_b64url_decode(payload_b64).decode("utf-8"))
    exp = payload.get("exp")
    sub = payload.get("sub")
    if not exp or not sub:
        raise _unauthorized("invalid token payload")
    if datetime.now(timezone.utc).timestamp() > exp:
        raise _unauthorized("token expired")
    return payload


def register_user(
    db: Session, *, email: str, password: str, display_name: str, auto_create_actor: bool
) -> tuple[User, Actor | None, Controller | None]:
    existing_user = db.scalar(select(User).where(User.email == email))
    if existing_user:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="email already registered")

    user = User(
        email=email,
        password_hash=hash_password(password),
        role=UserRole.PLAYER,
        status=UserStatus.ACTIVE,
    )
    db.add(user)
    db.flush()

    actor = None
    controller = None
    if auto_create_actor:
        actor = create_human_actor(db, display_name=display_name)
        controller = bind_user_to_actor(db, user=user, actor=actor)

    db.commit()
    db.refresh(user)
    if actor:
        db.refresh(actor)
    if controller:
        db.refresh(controller)
    return user, actor, controller


def login_user(db: Session, *, email: str, password: str) -> tuple[User, Actor | None, Controller | None]:
    user = db.scalar(select(User).where(User.email == email))
    if not user or not verify_password(password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="invalid email or password")
    if user.status != UserStatus.ACTIVE:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="user is disabled")

    actor, controller = get_primary_human_actor(db, user.id)
    return user, actor, controller


def get_current_user_from_token(db: Session, token: str) -> User:
    payload = decode_access_token(token)
    user = db.get(User, UUID(payload["sub"]))
    if not user:
        raise _unauthorized("user not found")
    if user.status != UserStatus.ACTIVE:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="user is disabled")
    return user


def get_primary_human_actor(db: Session, user_id: str) -> tuple[Actor | None, Controller | None]:
    controller = db.scalar(
        select(Controller)
        .where(
            Controller.user_id == user_id,
            Controller.controller_type == ControllerType.HUMAN,
            Controller.is_active.is_(True),
        )
        .order_by(Controller.priority.asc(), Controller.created_at.asc())
    )
    if not controller:
        return None, None
    actor = db.get(Actor, controller.actor_id)
    if not actor:
        return None, None
    return actor, controller


def ensure_user_world_access(
    db: Session, *, user: User, display_name: str | None = None
) -> tuple[bool, Actor, Controller]:
    actor, controller = get_primary_human_actor(db, user.id)
    if actor and controller:
        return False, actor, controller

    actor = create_human_actor(db, display_name=display_name or derive_display_name(user.email))
    controller = bind_user_to_actor(db, user=user, actor=actor)
    db.commit()
    db.refresh(actor)
    db.refresh(controller)
    return True, actor, controller


def create_human_actor(db: Session, *, display_name: str) -> Actor:
    spawn_room = get_spawn_room(db)
    actor = Actor(
        actor_type=ActorType.HUMAN_CHARACTER,
        display_name=display_name,
        title="刚进入小雨世界的旅人",
        bio="通过统一账号系统进入小雨世界的玩家。",
        current_room_id=spawn_room.id,
        status=ActorStatus.ACTIVE,
        gold=0,
        hp=100,
        mp=30,
        stats={"str": 8, "agi": 8, "int": 8, "cha": 8},
        public_state={"mood": "curious"},
        private_state={"created_via": "auth_world_enter"},
    )
    db.add(actor)
    db.flush()
    return actor


def bind_user_to_actor(db: Session, *, user: User, actor: Actor) -> Controller:
    controller = Controller(
        actor_id=actor.id,
        controller_type=ControllerType.HUMAN,
        user_id=user.id,
        ai_agent_id=None,
        priority=100,
        is_active=True,
    )
    db.add(controller)
    db.flush()
    return controller


def get_spawn_room(db: Session) -> Room:
    room = db.scalar(select(Room).where(Room.code == "starter_village_square"))
    if room:
        return room
    room = db.scalar(select(Room).order_by(Room.created_at.asc()))
    if not room:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="no rooms available")
    return room


def build_auth_me_payload(db: Session, user: User) -> dict[str, Any]:
    actor, controller = get_primary_human_actor(db, user.id)
    snapshot = build_room_snapshot(db, actor.id) if actor else None
    return {
        "success": True,
        "user": serialize_user(user, actor),
        "actor": serialize_actor(actor) if actor else None,
        "controller": serialize_controller(controller) if controller else None,
        "has_actor": actor is not None,
        "snapshot": snapshot,
    }


def serialize_user(user: User, actor: Actor | None = None) -> dict[str, Any]:
    return {
        "id": str(user.id),
        "email": user.email,
        "role": user.role.value if hasattr(user.role, "value") else str(user.role),
        "status": user.status.value if hasattr(user.status, "value") else str(user.status),
        "display_name": actor.display_name if actor else derive_display_name(user.email),
    }


def serialize_actor(actor: Actor) -> dict[str, Any]:
    return {
        "id": str(actor.id),
        "display_name": actor.display_name,
        "actor_type": actor.actor_type.value if hasattr(actor.actor_type, "value") else str(actor.actor_type),
        "current_room_id": str(actor.current_room_id),
        "gold": actor.gold,
        "hp": actor.hp,
        "mp": actor.mp,
        "stats": actor.stats,
    }


def serialize_controller(controller: Controller) -> dict[str, Any]:
    return {
        "id": str(controller.id),
        "actor_id": str(controller.actor_id),
        "controller_type": controller.controller_type.value
        if hasattr(controller.controller_type, "value")
        else str(controller.controller_type),
        "user_id": str(controller.user_id) if controller.user_id else None,
        "is_active": controller.is_active,
        "priority": controller.priority,
    }


def derive_display_name(email: str) -> str:
    return email.split("@", 1)[0]


def _b64url_decode(value: str) -> bytes:
    padding = "=" * (-len(value) % 4)
    return base64.urlsafe_b64decode(value + padding)


def _unauthorized(message: str) -> HTTPException:
    return HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=message)
