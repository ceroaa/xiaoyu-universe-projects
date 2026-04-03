from __future__ import annotations

from dataclasses import asdict, dataclass, field
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.enums import ActionResultType, ChannelType, LocationType, QuestStatus
from app.models.items import ItemInstance
from app.models.narrative import ActorQuest, Quest, WorldEvent
from app.models.social import ChatMessage
from app.models.world import Actor, Room, RoomExit


class WorldEngineError(Exception):
    pass


class NotFoundError(WorldEngineError):
    pass


class PermissionError(WorldEngineError):
    pass


class ValidationError(WorldEngineError):
    pass


class RuleViolation(WorldEngineError):
    pass


@dataclass
class EngineResult:
    result_type: str
    visible_result: dict[str, Any]
    canonical_result: dict[str, Any]
    emitted_events: list[dict[str, Any]] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


class WorldEngine:
    def __init__(self, db: Session):
        self.db = db

    def dispatch(self, actor: Actor, controller, action_type: str, action_payload: dict[str, Any]) -> EngineResult:
        action = action_type.lower().strip()
        if action == "look":
            return self._handle_look(actor)
        if action == "move":
            return self._handle_move(actor, action_payload)
        if action == "say":
            return self._handle_say(actor, action_payload)
        if action == "whisper":
            return self._handle_whisper(actor, action_payload)
        if action == "take":
            return self._handle_take(actor, action_payload)
        if action == "drop":
            return self._handle_drop(actor, action_payload)
        if action == "accept_quest":
            return self._handle_accept_quest(actor, action_payload)
        raise ValidationError(f"unsupported action_type: {action_type}")

    def _handle_look(self, actor: Actor) -> EngineResult:
        room = self._get_room(actor.current_room_id)
        actors = self._list_room_actors(room.id, exclude_actor_id=actor.id)
        items = self._list_room_items(room.id)
        exits = self._list_room_exits(room.id)

        visible = {
            "room": {
                "id": str(room.id),
                "code": room.code,
                "name": room.name,
                "description": room.description,
            },
            "actors": [{"id": str(a.id), "name": a.display_name, "title": a.title} for a in actors],
            "items": [{"id": str(i.id), "name": i.template.name, "quantity": i.quantity} for i in items],
            "exits": [str(e.direction).lower() for e in exits],
            "message": f"你正在【{room.name}】。",
        }
        return EngineResult(
            result_type=ActionResultType.SUCCESS.value,
            visible_result=visible,
            canonical_result={"action": "look", "room_id": str(room.id)},
        )

    def _handle_move(self, actor: Actor, payload: dict[str, Any]) -> EngineResult:
        direction = str(payload.get("direction", "")).strip().lower()
        if not direction:
            raise ValidationError("direction is required")

        from_room = self._get_room(actor.current_room_id)
        exit_obj = self._get_exit(from_room.id, direction)
        to_room = self._get_room(exit_obj.to_room_id)

        actor.current_room_id = to_room.id
        self.db.flush()

        emitted_events = [
            self._create_world_event(
                room_id=from_room.id,
                event_type="MOVE",
                public_text=f"{actor.display_name} 往 {direction} 离开了。",
                canonical={"actor_id": str(actor.id), "from_room_id": str(from_room.id), "to_room_id": str(to_room.id)},
            ),
            self._create_world_event(
                room_id=to_room.id,
                event_type="MOVE",
                public_text=f"{actor.display_name} 走了进来。",
                canonical={"actor_id": str(actor.id), "from_room_id": str(from_room.id), "to_room_id": str(to_room.id)},
            ),
        ]

        look_result = self._handle_look(actor)
        visible = dict(look_result.visible_result)
        visible["message"] = f"你往 {direction} 前进，来到【{to_room.name}】。"

        return EngineResult(
            result_type=ActionResultType.SUCCESS.value,
            visible_result=visible,
            canonical_result={"action": "move", "direction": direction, "to_room_id": str(to_room.id)},
            emitted_events=emitted_events,
        )

    def _handle_say(self, actor: Actor, payload: dict[str, Any]) -> EngineResult:
        content = str(payload.get("content", "")).strip()
        if not content:
            raise ValidationError("content is required")

        self.db.add(
            ChatMessage(
                room_id=actor.current_room_id,
                sender_actor_id=actor.id,
                channel=ChannelType.SAY,
                content=content,
            )
        )
        event = self._create_world_event(
            room_id=actor.current_room_id,
            event_type="CHAT",
            public_text=f'{actor.display_name} 说：“{content}”',
            canonical={"actor_id": str(actor.id), "channel": ChannelType.SAY.value, "content": content},
        )

        return EngineResult(
            result_type=ActionResultType.SUCCESS.value,
            visible_result={"message": f'你说：“{content}”'},
            canonical_result={"action": "say", "content": content},
            emitted_events=[event],
        )

    def _handle_whisper(self, actor: Actor, payload: dict[str, Any]) -> EngineResult:
        target_actor_id = payload.get("target_actor_id")
        content = str(payload.get("content", "")).strip()
        if not target_actor_id or not content:
            raise ValidationError("target_actor_id and content are required")

        target = self._get_actor(target_actor_id)
        if target.current_room_id != actor.current_room_id:
            raise RuleViolation("target is not in the same room")

        self.db.add(
            ChatMessage(
                room_id=actor.current_room_id,
                sender_actor_id=actor.id,
                target_actor_id=target.id,
                channel=ChannelType.WHISPER,
                content=content,
            )
        )

        return EngineResult(
            result_type=ActionResultType.SUCCESS.value,
            visible_result={"message": f'你悄声对 {target.display_name} 说：“{content}”'},
            canonical_result={"action": "whisper", "target_actor_id": str(target.id), "content": content},
        )

    def _handle_take(self, actor: Actor, payload: dict[str, Any]) -> EngineResult:
        item_id = payload.get("item_id")
        if not item_id:
            raise ValidationError("item_id is required")

        item = self._get_item(item_id)
        if item.location_type != LocationType.ROOM or str(item.location_id) != str(actor.current_room_id):
            raise RuleViolation("item is not in this room")

        item.location_type = LocationType.ACTOR
        item.location_id = str(actor.id)
        item.owner_actor_id = actor.id
        self.db.flush()

        event = self._create_world_event(
            room_id=actor.current_room_id,
            event_type="ITEM",
            public_text=f"{actor.display_name} 捡起了 {item.template.name}。",
            canonical={"actor_id": str(actor.id), "item_id": str(item.id), "template_code": item.template.code},
        )

        return EngineResult(
            result_type=ActionResultType.SUCCESS.value,
            visible_result={"message": f"你捡起了 {item.template.name}。"},
            canonical_result={"action": "take", "item_id": str(item.id), "template_code": item.template.code},
            emitted_events=[event],
        )

    def _handle_drop(self, actor: Actor, payload: dict[str, Any]) -> EngineResult:
        item_id = payload.get("item_id")
        if not item_id:
            raise ValidationError("item_id is required")

        item = self._get_item(item_id)
        if item.location_type != LocationType.ACTOR or str(item.location_id) != str(actor.id):
            raise RuleViolation("item is not owned by actor")

        room = self._get_room(actor.current_room_id)
        item.location_type = LocationType.ROOM
        item.location_id = str(room.id)
        item.owner_actor_id = None
        self.db.flush()

        event = self._create_world_event(
            room_id=room.id,
            event_type="ITEM",
            public_text=f"{actor.display_name} 放下了 {item.template.name}。",
            canonical={"actor_id": str(actor.id), "item_id": str(item.id), "template_code": item.template.code},
        )

        return EngineResult(
            result_type=ActionResultType.SUCCESS.value,
            visible_result={"message": f"你放下了 {item.template.name}。"},
            canonical_result={"action": "drop", "item_id": str(item.id), "template_code": item.template.code},
            emitted_events=[event],
        )

    def _handle_accept_quest(self, actor: Actor, payload: dict[str, Any]) -> EngineResult:
        quest_id = payload.get("quest_id")
        if not quest_id:
            raise ValidationError("quest_id is required")

        quest = self.db.get(Quest, quest_id)
        if not quest:
            raise NotFoundError("quest not found")

        existing = self.db.scalar(select(ActorQuest).where(ActorQuest.actor_id == actor.id, ActorQuest.quest_id == quest.id))
        if existing and existing.status == QuestStatus.IN_PROGRESS:
            raise RuleViolation("quest already in progress")
        if existing and existing.status == QuestStatus.COMPLETED and not quest.is_repeatable:
            raise RuleViolation("quest already completed")

        if existing:
            existing.status = QuestStatus.IN_PROGRESS
            existing.current_step_order = 1
            existing.progress_json = {}
        else:
            self.db.add(
                ActorQuest(
                    actor_id=actor.id,
                    quest_id=quest.id,
                    status=QuestStatus.IN_PROGRESS,
                    current_step_order=1,
                    progress_json={},
                )
            )
        self.db.flush()

        return EngineResult(
            result_type=ActionResultType.SUCCESS.value,
            visible_result={"message": f"你接下了任务【{quest.title}】。"},
            canonical_result={"action": "accept_quest", "quest_id": str(quest.id), "quest_code": quest.code},
        )

    def _get_room(self, room_id) -> Room:
        room = self.db.get(Room, room_id)
        if not room:
            raise NotFoundError("room not found")
        return room

    def _get_actor(self, actor_id) -> Actor:
        actor = self.db.get(Actor, actor_id)
        if not actor:
            raise NotFoundError("actor not found")
        return actor

    def _get_item(self, item_id) -> ItemInstance:
        item = self.db.scalar(select(ItemInstance).where(ItemInstance.id == item_id))
        if not item:
            raise NotFoundError("item not found")
        return item

    def _get_exit(self, room_id, direction: str) -> RoomExit:
        exit_obj = self.db.scalar(
            select(RoomExit).where(
                RoomExit.from_room_id == room_id,
                RoomExit.direction == direction,
                RoomExit.is_hidden.is_(False),
            )
        )
        if not exit_obj:
            raise NotFoundError(f"exit not found for direction={direction}")
        return exit_obj

    def _list_room_actors(self, room_id, exclude_actor_id=None) -> list[Actor]:
        stmt = select(Actor).where(Actor.current_room_id == room_id)
        actors = list(self.db.scalars(stmt).all())
        if exclude_actor_id:
            actors = [a for a in actors if str(a.id) != str(exclude_actor_id)]
        return actors

    def _list_room_items(self, room_id) -> list[ItemInstance]:
        stmt = select(ItemInstance).where(
            ItemInstance.location_type == LocationType.ROOM,
            ItemInstance.location_id == str(room_id),
            ItemInstance.status == "ACTIVE",
        )
        return list(self.db.scalars(stmt).all())

    def _list_room_exits(self, room_id) -> list[RoomExit]:
        stmt = select(RoomExit).where(RoomExit.from_room_id == room_id, RoomExit.is_hidden.is_(False))
        return list(self.db.scalars(stmt).all())

    def _create_world_event(self, room_id, event_type: str, public_text: str, canonical: dict[str, Any]) -> dict[str, Any]:
        event = WorldEvent(
            room_id=room_id,
            event_type=event_type,
            visibility_scope="ROOM",
            canonical_summary=canonical,
            public_text=public_text,
            participants=canonical,
        )
        self.db.add(event)
        self.db.flush()
        return {
            "id": str(event.id),
            "event_type": event.event_type,
            "public_text": event.public_text,
            "created_at": event.created_at.isoformat() if event.created_at else None,
        }
