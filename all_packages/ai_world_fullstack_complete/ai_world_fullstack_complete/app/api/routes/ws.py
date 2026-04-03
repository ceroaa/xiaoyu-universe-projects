from __future__ import annotations

import asyncio
from datetime import datetime

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.db.session import SessionLocal
from app.models.world import Actor
from app.services.action_service import submit_action
from app.services.world_state import build_room_snapshot, fetch_room_events_since

router = APIRouter(tags=['ws'])


@router.websocket('/ws/world/{actor_id}')
async def world_ws(websocket: WebSocket, actor_id: str):
    await websocket.accept()
    last_seen: datetime | None = None
    try:
        with SessionLocal() as db:
            actor = db.get(Actor, actor_id)
            if not actor:
                await websocket.send_json({'type': 'error', 'message': 'actor not found'})
                await websocket.close(code=4004)
                return
            snapshot = build_room_snapshot(db, actor.id)
            await websocket.send_json({'type': 'snapshot', 'data': snapshot})
            current_room_id = actor.current_room_id

        while True:
            try:
                data = await asyncio.wait_for(websocket.receive_json(), timeout=1.0)
                if data.get('type') == 'ping':
                    await websocket.send_json({'type': 'pong'})
                if data.get('type') == 'action':
                    with SessionLocal() as db:
                        result = submit_action(
                            db=db,
                            actor_id=actor_id,
                            controller_id=data.get('controller_id'),
                            action_type=data.get('action_type', ''),
                            action_payload=data.get('action_payload', {}),
                        )
                        snapshot = build_room_snapshot(db, actor_id)
                    await websocket.send_json({'type': 'action_result', 'data': result.to_dict()})
                    await websocket.send_json({'type': 'snapshot', 'data': snapshot})
            except asyncio.TimeoutError:
                pass

            with SessionLocal() as db:
                actor = db.get(Actor, actor_id)
                if not actor:
                    await websocket.send_json({'type': 'error', 'message': 'actor removed'})
                    await websocket.close(code=4005)
                    return
                if actor.current_room_id != current_room_id:
                    current_room_id = actor.current_room_id
                    snapshot = build_room_snapshot(db, actor.id)
                    await websocket.send_json({'type': 'snapshot', 'data': snapshot})
                events = fetch_room_events_since(db, actor.current_room_id, last_seen)
            if events:
                last_seen = datetime.fromisoformat(events[-1]['created_at']) if events[-1]['created_at'] else last_seen
                await websocket.send_json({'type': 'events', 'data': events})
    except WebSocketDisconnect:
        return
