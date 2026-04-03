from __future__ import annotations

from dataclasses import asdict, dataclass
from typing import Any

from sqlalchemy.orm import Session

from app.models.ai import Controller
from app.models.enums import ActionResultType, ControllerType
from app.models.social import ActorActionLog
from app.models.world import Actor
from app.services.world_engine import PermissionError, ValidationError, WorldEngine, WorldEngineError


@dataclass
class SubmitActionResult:
    success: bool
    result_type: str
    visible_result: dict[str, Any]
    canonical_result: dict[str, Any]
    emitted_events: list[dict[str, Any]]
    error: str | None = None

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


def submit_action(
    db: Session,
    actor_id,
    action_type: str,
    action_payload: dict[str, Any] | None = None,
    controller_id=None,
    auto_commit: bool = True,
) -> SubmitActionResult:
    action_payload = action_payload or {}
    actor = _get_actor(db, actor_id)
    controller = _get_controller(db, controller_id) if controller_id else None
    if controller:
        _validate_controller_for_actor(actor, controller)

    try:
        engine = WorldEngine(db)
        result = engine.dispatch(actor, controller, action_type, action_payload)
        log = ActorActionLog(
            actor_id=actor.id,
            controller_id=controller.id if controller else None,
            action_type=action_type,
            action_payload=action_payload,
            result_type=ActionResultType.SUCCESS,
            canonical_result=result.canonical_result,
            visible_result=result.visible_result,
        )
        db.add(log)
        if auto_commit:
            db.commit()
        else:
            db.flush()
        return SubmitActionResult(
            success=True,
            result_type='SUCCESS',
            visible_result=result.visible_result,
            canonical_result=result.canonical_result,
            emitted_events=result.emitted_events,
        )
    except (WorldEngineError, ValidationError, PermissionError) as exc:
        db.rollback()
        db.add(
            ActorActionLog(
                actor_id=actor.id,
                controller_id=controller.id if controller else None,
                action_type=action_type,
                action_payload=action_payload,
                result_type=ActionResultType.FAILURE,
                canonical_result={'error': str(exc)},
                visible_result={'message': str(exc)},
            )
        )
        db.commit()
        return SubmitActionResult(
            success=False,
            result_type='FAILURE',
            visible_result={'message': str(exc)},
            canonical_result={'error': str(exc)},
            emitted_events=[],
            error=str(exc),
        )


def _get_actor(db: Session, actor_id) -> Actor:
    actor = db.get(Actor, actor_id)
    if not actor:
        raise ValidationError('actor not found')
    return actor


def _get_controller(db: Session, controller_id) -> Controller:
    controller = db.get(Controller, controller_id)
    if not controller:
        raise ValidationError('controller not found')
    return controller


def _validate_controller_for_actor(actor: Actor, controller: Controller) -> None:
    if controller.actor_id != actor.id:
        raise PermissionError('controller does not belong to actor')
    if not controller.is_active:
        raise PermissionError('controller is inactive')
    if controller.controller_type not in {ControllerType.HUMAN, ControllerType.AI, ControllerType.SYSTEM}:
        raise PermissionError('unsupported controller type')
