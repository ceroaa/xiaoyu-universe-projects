from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.action import SubmitActionRequest, SubmitActionResponse
from app.services.action_service import submit_action

router = APIRouter(prefix='/actions', tags=['actions'])


@router.post('/submit', response_model=SubmitActionResponse)
def submit_action_route(payload: SubmitActionRequest, db: Session = Depends(get_db)):
    result = submit_action(
        db=db,
        actor_id=payload.actor_id,
        controller_id=payload.controller_id,
        action_type=payload.action_type,
        action_payload=payload.action_payload,
    )
    return result.to_dict()
