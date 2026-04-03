from __future__ import annotations

from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.auth import (
    AuthResponse,
    EnterWorldRequest,
    EnterWorldResponse,
    LoginRequest,
    LogoutResponse,
    MeResponse,
    RegisterRequest,
)
from app.services.auth_service import (
    build_auth_me_payload,
    create_access_token,
    ensure_user_world_access,
    get_current_user_from_token,
    login_user,
    register_user,
    serialize_actor,
    serialize_controller,
    serialize_user,
)
from app.services.world_state import build_room_snapshot

router = APIRouter(prefix="/auth", tags=["auth"])
world_router = APIRouter(prefix="/world", tags=["world"])


def extract_bearer_token(authorization: str | None) -> str:
    if not authorization:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="missing authorization header")
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="invalid authorization header")
    return token


@router.post("/register", response_model=AuthResponse)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    user, actor, controller = register_user(
        db,
        email=payload.email,
        password=payload.password,
        display_name=payload.display_name,
        auto_create_actor=payload.auto_create_actor,
    )
    token = create_access_token(str(user.id))
    return {
        "success": True,
        "token": token,
        "user": serialize_user(user, actor),
        "actor": serialize_actor(actor) if actor else None,
        "controller": serialize_controller(controller) if controller else None,
    }


@router.post("/login", response_model=AuthResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user, actor, controller = login_user(db, email=payload.email, password=payload.password)
    token = create_access_token(str(user.id))
    return {
        "success": True,
        "token": token,
        "user": serialize_user(user, actor),
        "actor": serialize_actor(actor) if actor else None,
        "controller": serialize_controller(controller) if controller else None,
    }


@router.get("/me", response_model=MeResponse)
def auth_me(authorization: str | None = Header(default=None), db: Session = Depends(get_db)):
    token = extract_bearer_token(authorization)
    user = get_current_user_from_token(db, token)
    return build_auth_me_payload(db, user)


@router.post("/logout", response_model=LogoutResponse)
def logout(authorization: str | None = Header(default=None), db: Session = Depends(get_db)):
    token = extract_bearer_token(authorization)
    _ = get_current_user_from_token(db, token)
    return {"success": True, "message": "logged out"}


@world_router.post("/enter", response_model=EnterWorldResponse)
def enter_world(
    payload: EnterWorldRequest,
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
):
    token = extract_bearer_token(authorization)
    user = get_current_user_from_token(db, token)
    is_first_time, actor, controller = ensure_user_world_access(db, user=user, display_name=payload.display_name)
    snapshot = build_room_snapshot(db, actor.id)
    return {
        "success": True,
        "is_first_time": is_first_time,
        "user": serialize_user(user, actor),
        "actor": serialize_actor(actor),
        "controller": serialize_controller(controller),
        "snapshot": snapshot,
    }
