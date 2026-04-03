from __future__ import annotations

import random
import time
from collections.abc import Sequence
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.ai import AIAgent, AgentProfile, Controller
from app.models.enums import ActorType, ControllerType
from app.models.world import Actor, RoomExit
from app.services.action_service import submit_action

LAST_TICK_AT: dict[str, float] = {}
LAST_GREET_AT: dict[str, float] = {}
PATROL_CURSOR: dict[str, int] = {}
GREET_COOLDOWN_SECONDS = 180


def get_active_ai_controller_ids(db: Session) -> list[str]:
    stmt = select(Controller.id).where(Controller.controller_type == ControllerType.AI, Controller.is_active.is_(True))
    return [str(x) for x in db.scalars(stmt).all()]


def process_controller_tick(db: Session, controller_id: str) -> dict[str, Any]:
    controller = db.get(Controller, controller_id)
    if not controller or not controller.ai_agent_id or not controller.actor_id:
        return {'executed': False, 'reason': 'controller_not_ready'}
    agent = db.get(AIAgent, controller.ai_agent_id)
    actor = db.get(Actor, controller.actor_id)
    profile = db.scalar(select(AgentProfile).where(AgentProfile.ai_agent_id == agent.id)) if agent else None
    if not agent or not actor:
        return {'executed': False, 'reason': 'agent_or_actor_missing'}
    if not _should_tick(agent):
        return {'executed': False, 'reason': 'cooldown'}

    decision = decide_next_action(db, agent, actor, profile)
    LAST_TICK_AT[str(agent.id)] = time.time()
    if not decision:
        return {'executed': False, 'reason': 'no_action'}

    result = submit_action(
        db=db,
        actor_id=actor.id,
        controller_id=controller.id,
        action_type=decision['action_type'],
        action_payload=decision.get('action_payload', {}),
    )
    return {
        'executed': True,
        'actor_name': actor.display_name,
        'agent_code': agent.agent_code,
        'action_type': decision['action_type'],
        'action_payload': decision.get('action_payload', {}),
        'success': result.success,
        'visible_result': result.visible_result,
    }


def decide_next_action(db: Session, agent: AIAgent, actor: Actor, profile: AgentProfile | None) -> dict[str, Any] | None:
    room_mates = list(
        db.scalars(
            select(Actor).where(Actor.current_room_id == actor.current_room_id, Actor.id != actor.id, Actor.actor_type == ActorType.HUMAN_CHARACTER)
        ).all()
    )
    if str(actor.id) not in LAST_TICK_AT:
        return {'action_type': 'look', 'action_payload': {}}

    if room_mates and _can_greet(actor.id):
        LAST_GREET_AT[str(actor.id)] = time.time()
        target = room_mates[0]
        return {
            'action_type': 'say',
            'action_payload': {'content': _build_greeting(agent.agent_code, actor.display_name, target.display_name)},
        }

    if agent.agent_class.value == 'GUARD':
        if random.random() < 0.35:
            return {'action_type': 'say', 'action_payload': {'content': '北門一切平靜，請保持警覺。'}}
        return None

    if agent.agent_class.value == 'MERCHANT':
        if random.random() < 0.4:
            return {'action_type': 'say', 'action_payload': {'content': '新鮮補給、熱湯與麥酒，歡迎看看。'}}
        return None

    if agent.agent_class.value == 'PATROL':
        move_payload = _choose_patrol_move(db, actor)
        if move_payload:
            return {'action_type': 'move', 'action_payload': move_payload}
        return None

    if random.random() < 0.3:
        return {'action_type': 'say', 'action_payload': {'content': '村莊今天似乎很安穩。'}}
    return None


def _should_tick(agent: AIAgent) -> bool:
    last = LAST_TICK_AT.get(str(agent.id), 0.0)
    interval_seconds = max(agent.tick_interval_ms / 1000.0, 1.0)
    return (time.time() - last) >= interval_seconds


def _can_greet(actor_id) -> bool:
    last = LAST_GREET_AT.get(str(actor_id), 0.0)
    return (time.time() - last) >= GREET_COOLDOWN_SECONDS


def _build_greeting(agent_code: str, actor_name: str, target_name: str) -> str:
    if 'elder' in agent_code:
        return f'{target_name}，歡迎來到新手村。若你願意幫忙送信，記得來找我。'
    if 'guard' in agent_code:
        return f'{target_name}，北門外路況未明，先別走太遠。'
    if 'merchant' in agent_code:
        return f'{target_name}，如果你需要補給，我這裡剛到一批新貨。'
    if 'patrol' in agent_code:
        return f'{target_name}，我正在巡邏，有狀況就立刻通知我。'
    return f'{target_name}，{actor_name} 向你點頭致意。'


def _choose_patrol_move(db: Session, actor: Actor) -> dict[str, Any] | None:
    exits: Sequence[RoomExit] = list(
        db.scalars(select(RoomExit).where(RoomExit.from_room_id == actor.current_room_id, RoomExit.is_hidden.is_(False))).all()
    )
    if not exits:
        return None
    cursor_key = str(actor.id)
    cursor = PATROL_CURSOR.get(cursor_key, 0)
    exit_obj = exits[cursor % len(exits)]
    PATROL_CURSOR[cursor_key] = cursor + 1
    return {'direction': exit_obj.direction}
