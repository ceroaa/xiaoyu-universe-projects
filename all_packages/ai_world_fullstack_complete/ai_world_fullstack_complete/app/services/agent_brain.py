from __future__ import annotations

import json
from typing import Any

import httpx
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.ai import AgentGoal, AgentMemory, AgentProfile
from app.models.enums import ActorType, LocationType
from app.models.items import ItemInstance
from app.models.world import Actor, Room, RoomExit


ALLOWED_ACTIONS = ['look', 'move', 'say']


def llm_enabled() -> bool:
    return bool(settings.LLM_ENABLED)


def decide_with_llm(db: Session, agent, actor, profile: AgentProfile | None) -> dict[str, Any] | None:
    context = _build_context(db, actor, profile, agent.id)
    content = _call_llm(context)
    parsed = _extract_json(content)
    if not parsed:
        return None
    action_type = str(parsed.get('action_type', '')).strip().lower()
    action_payload = parsed.get('action_payload', {}) or {}
    if action_type not in ALLOWED_ACTIONS:
        return None
    if action_type == 'move' and action_payload.get('direction') not in context['visible_exits']:
        return None
    if action_type == 'say':
        text = str(action_payload.get('content', '')).strip()
        if not text:
            return None
        action_payload = {'content': text[:220]}
    return {'action_type': action_type, 'action_payload': action_payload}


def _build_context(db: Session, actor: Actor, profile: AgentProfile | None, agent_id=None) -> dict[str, Any]:
    room = db.get(Room, actor.current_room_id)
    visible_actors = list(
        db.scalars(select(Actor).where(Actor.current_room_id == room.id, Actor.id != actor.id)).all()
    )
    visible_items = list(
        db.scalars(
            select(ItemInstance).where(ItemInstance.location_type == LocationType.ROOM, ItemInstance.location_id == str(room.id))
        ).all()
    )
    exits = list(db.scalars(select(RoomExit).where(RoomExit.from_room_id == room.id, RoomExit.is_hidden.is_(False))).all())
    goals = list(db.scalars(select(AgentGoal).where(AgentGoal.ai_agent_id == agent_id).limit(5)).all()) if agent_id else []
    memories = list(db.scalars(select(AgentMemory).where(AgentMemory.ai_agent_id == agent_id).limit(8)).all()) if agent_id else []
    return {
        'self_name': actor.display_name,
        'self_title': actor.title,
        'room_name': room.name,
        'room_description': room.description,
        'visible_humans': [a.display_name for a in visible_actors if a.actor_type == ActorType.HUMAN_CHARACTER],
        'visible_actors': [a.display_name for a in visible_actors],
        'visible_items': [i.template.name for i in visible_items],
        'visible_exits': [e.direction for e in exits],
        'profile': {
            'identity_summary': profile.identity_summary if profile else '',
            'goals_summary': profile.goals_summary if profile else '',
            'behavior_constraints': profile.behavior_constraints if profile else {},
            'speech_style': profile.speech_style if profile else {},
        },
        'goals': [{'title': g.title, 'description': g.description, 'priority': g.priority} for g in goals],
        'memories': [m.summary for m in memories],
    }


def _call_llm(context: dict[str, Any]) -> str:
    provider = settings.LLM_PROVIDER.lower().strip()
    if provider == 'ollama':
        base_url = settings.OLLAMA_BASE_URL.rstrip('/')
        model = settings.OLLAMA_MODEL
        api_key = settings.OPENAI_API_KEY or 'ollama'
    else:
        base_url = settings.OPENAI_BASE_URL.rstrip('/')
        model = settings.OPENAI_MODEL
        api_key = settings.OPENAI_API_KEY

    system_prompt = (
        '你是文字元宇宙中的 AI Agent。你只能輸出 JSON，不要輸出其他文字。'
        '可用 action_type 只有 look、move、say。'
        'move 時只能使用 visible_exits 內的方向。'
        'say 時請保持角色口吻，字數精簡。'
        'JSON 格式: {"action_type":"say","action_payload":{"content":"..."}}'
    )
    user_prompt = json.dumps(context, ensure_ascii=False)

    with httpx.Client(timeout=30.0) as client:
        response = client.post(
            f'{base_url}/chat/completions',
            headers={
                'Authorization': f'Bearer {api_key}',
                'Content-Type': 'application/json',
            },
            json={
                'model': model,
                'temperature': 0.4,
                'messages': [
                    {'role': 'system', 'content': system_prompt},
                    {'role': 'user', 'content': user_prompt},
                ],
                'response_format': {'type': 'json_object'},
            },
        )
        response.raise_for_status()
        data = response.json()
        return data['choices'][0]['message']['content']


def _extract_json(text: str) -> dict[str, Any] | None:
    try:
        return json.loads(text)
    except Exception:
        start = text.find('{')
        end = text.rfind('}')
        if start >= 0 and end > start:
            try:
                return json.loads(text[start:end+1])
            except Exception:
                return None
    return None
