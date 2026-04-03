from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.ai import Controller
from app.models.enums import ActorType, ControllerType
from app.models.user import User
from app.models.world import Actor
from app.services.world_state import build_room_snapshot

router = APIRouter(prefix="/dev", tags=["dev"])


@router.get("/bootstrap")
def dev_bootstrap(db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.email == "demo_player@example.com"))
    actor = db.scalar(
        select(Actor).where(Actor.actor_type == ActorType.HUMAN_CHARACTER).order_by(Actor.created_at.asc())
    )
    if not user or not actor:
        raise HTTPException(status_code=404, detail="seed data not found, please run seed.py")

    controller = db.scalar(
        select(Controller).where(Controller.actor_id == actor.id, Controller.controller_type == ControllerType.HUMAN)
    )
    return {
        "player": {
            "email": "demo_player@example.com",
            "password": "dev123456",
            "display_name": actor.display_name,
            "actor_id": str(actor.id),
            "controller_id": str(controller.id) if controller else None,
        },
        "snapshot": build_room_snapshot(db, actor.id),
    }
