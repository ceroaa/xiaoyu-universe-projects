from __future__ import annotations

from datetime import datetime
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.enums import LocationType
from app.models.items import ItemInstance
from app.models.narrative import WorldEvent
from app.models.world import Actor, Room, RoomExit


def build_room_snapshot(db: Session, actor_id) -> dict[str, Any]:
    actor = db.get(Actor, actor_id)
    if not actor:
        raise ValueError('actor not found')
    room = db.get(Room, actor.current_room_id)
    actors = list(db.scalars(select(Actor).where(Actor.current_room_id == room.id, Actor.id != actor.id)).all())
    items = list(
        db.scalars(
            select(ItemInstance).where(ItemInstance.location_type == LocationType.ROOM, ItemInstance.location_id == str(room.id))
        ).all()
    )
    inventory = list(
        db.scalars(
            select(ItemInstance).where(ItemInstance.location_type == LocationType.ACTOR, ItemInstance.location_id == str(actor.id))
        ).all()
    )
    exits = list(db.scalars(select(RoomExit).where(RoomExit.from_room_id == room.id, RoomExit.is_hidden.is_(False))).all())
    return {
        'actor': {
            'id': str(actor.id),
            'display_name': actor.display_name,
            'title': actor.title,
            'gold': actor.gold,
            'hp': actor.hp,
            'mp': actor.mp,
        },
        'room': {
            'info': {
                'id': str(room.id),
                'code': room.code,
                'name': room.name,
                'description': room.description,
            },
            'actors': [{'id': str(x.id), 'name': x.display_name, 'title': x.title} for x in actors],
            'items': [{'id': str(x.id), 'name': x.template.name, 'quantity': x.quantity} for x in items],
            'inventory': [{'id': str(x.id), 'name': x.template.name, 'quantity': x.quantity} for x in inventory],
            'exits': [x.direction for x in exits],
        },
    }


def fetch_room_events_since(db: Session, room_id, since: datetime | None) -> list[dict[str, Any]]:
    stmt = select(WorldEvent).where(WorldEvent.room_id == room_id)
    if since is not None:
        stmt = stmt.where(WorldEvent.created_at > since)
    stmt = stmt.order_by(WorldEvent.created_at.asc())
    events = list(db.scalars(stmt).all())
    return [
        {
            'id': str(e.id),
            'event_type': e.event_type,
            'public_text': e.public_text,
            'created_at': e.created_at.isoformat() if e.created_at else None,
        }
        for e in events
    ]
