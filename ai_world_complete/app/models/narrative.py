from typing import Optional

from sqlalchemy import Boolean, Enum, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base_class import Base
from app.models.enums import QuestStatus, StepType
from app.models.mixins import TimestampMixin, UUIDPrimaryKeyMixin


class StoryArc(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = 'story_arcs'

    arc_code: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    theme: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[str] = mapped_column(String(30), default='ACTIVE', nullable=False)
    entry_conditions: Mapped[dict] = mapped_column(JSONB, default=dict, nullable=False)
    progress_state: Mapped[dict] = mapped_column(JSONB, default=dict, nullable=False)
    possible_outcomes: Mapped[dict] = mapped_column(JSONB, default=dict, nullable=False)


class StoryBeat(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = 'story_beats'

    story_arc_id: Mapped[str] = mapped_column(ForeignKey('story_arcs.id', ondelete='CASCADE'), nullable=False, index=True)
    beat_order: Mapped[int] = mapped_column(Integer, nullable=False)
    beat_type: Mapped[str] = mapped_column(String(50), nullable=False)
    trigger_conditions: Mapped[dict] = mapped_column(JSONB, default=dict, nullable=False)
    effect_json: Mapped[dict] = mapped_column(JSONB, default=dict, nullable=False)
    reveal_text_seed: Mapped[str] = mapped_column(String, nullable=False)


class WorldEvent(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = 'world_events'

    event_type: Mapped[str] = mapped_column(String(50), nullable=False)
    visibility_scope: Mapped[str] = mapped_column(String(30), default='ROOM', nullable=False)
    room_id: Mapped[Optional[str]] = mapped_column(ForeignKey('rooms.id', ondelete='SET NULL'), nullable=True, index=True)
    canonical_summary: Mapped[dict] = mapped_column(JSONB, default=dict, nullable=False)
    public_text: Mapped[str] = mapped_column(String, nullable=False)
    participants: Mapped[dict] = mapped_column(JSONB, default=dict, nullable=False)


class Quest(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = 'quests'

    code: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(String, nullable=False)
    giver_actor_id: Mapped[Optional[str]] = mapped_column(ForeignKey('actors.id', ondelete='SET NULL'), nullable=True)
    reward_gold: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    reward_item_template_id: Mapped[Optional[str]] = mapped_column(
        ForeignKey('item_templates.id', ondelete='SET NULL'), nullable=True
    )
    is_repeatable: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)


class QuestStep(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = 'quest_steps'

    quest_id: Mapped[str] = mapped_column(ForeignKey('quests.id', ondelete='CASCADE'), nullable=False, index=True)
    step_order: Mapped[int] = mapped_column(Integer, nullable=False)
    step_type: Mapped[StepType] = mapped_column(Enum(StepType, name='step_type'), nullable=False)
    target_type: Mapped[str] = mapped_column(String(50), nullable=False)
    target_id: Mapped[str] = mapped_column(String(100), nullable=False)
    required_count: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    description: Mapped[str] = mapped_column(String, nullable=False)


class ActorQuest(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = 'actor_quests'

    actor_id: Mapped[str] = mapped_column(ForeignKey('actors.id', ondelete='CASCADE'), nullable=False, index=True)
    quest_id: Mapped[str] = mapped_column(ForeignKey('quests.id', ondelete='CASCADE'), nullable=False, index=True)
    status: Mapped[QuestStatus] = mapped_column(Enum(QuestStatus, name='quest_status'), nullable=False)
    current_step_order: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    progress_json: Mapped[dict] = mapped_column(JSONB, default=dict, nullable=False)
