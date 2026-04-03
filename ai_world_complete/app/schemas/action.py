from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field


class SubmitActionRequest(BaseModel):
    actor_id: UUID
    controller_id: UUID | None = None
    action_type: str = Field(..., examples=['look', 'move', 'say', 'take'])
    action_payload: dict[str, Any] = Field(default_factory=dict)


class SubmitActionResponse(BaseModel):
    success: bool
    result_type: str
    visible_result: dict[str, Any]
    canonical_result: dict[str, Any]
    emitted_events: list[dict[str, Any]]
    error: str | None = None
