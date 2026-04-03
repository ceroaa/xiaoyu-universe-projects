from typing import Optional

from sqlalchemy import Enum, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base_class import Base
from app.models.enums import ActionResultType, ChannelType
from app.models.mixins import TimestampMixin, UUIDPrimaryKeyMixin


class ActorRelationship(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = 'actor_relationships'

    source_actor_id: Mapped[str] = mapped_column(ForeignKey('actors.id', ondelete='CASCADE'), nullable=False, index=True)
    target_actor_id: Mapped[str] = mapped_column(ForeignKey('actors.id', ondelete='CASCADE'), nullable=False, index=True)
    affinity_score: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    trust_score: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    tags: Mapped[dict] = mapped_column(JSONB, default=dict, nullable=False)


class ActorPerception(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = 'actor_perceptions'

    actor_id: Mapped[str] = mapped_column(ForeignKey('actors.id', ondelete='CASCADE'), nullable=False, index=True)
    perception_type: Mapped[str] = mapped_column(String(50), nullable=False)
    entity_type: Mapped[str] = mapped_column(String(50), nullable=False)
    entity_id: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    certainty: Mapped[int] = mapped_column(Integer, default=100, nullable=False)
    summary: Mapped[str] = mapped_column(String, nullable=False)
    source_ref: Mapped[dict] = mapped_column(JSONB, default=dict, nullable=False)


class ActorActionLog(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = 'actor_action_logs'

    actor_id: Mapped[str] = mapped_column(ForeignKey('actors.id', ondelete='CASCADE'), nullable=False, index=True)
    controller_id: Mapped[Optional[str]] = mapped_column(ForeignKey('controllers.id', ondelete='SET NULL'), nullable=True)
    action_type: Mapped[str] = mapped_column(String(50), nullable=False)
    action_payload: Mapped[dict] = mapped_column(JSONB, default=dict, nullable=False)
    result_type: Mapped[ActionResultType] = mapped_column(
        Enum(ActionResultType, name='action_result_type'), nullable=False
    )
    canonical_result: Mapped[dict] = mapped_column(JSONB, default=dict, nullable=False)
    visible_result: Mapped[dict] = mapped_column(JSONB, default=dict, nullable=False)


class ChatMessage(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = 'chat_messages'

    room_id: Mapped[Optional[str]] = mapped_column(ForeignKey('rooms.id', ondelete='SET NULL'), nullable=True, index=True)
    sender_actor_id: Mapped[str] = mapped_column(ForeignKey('actors.id', ondelete='CASCADE'), nullable=False, index=True)
    target_actor_id: Mapped[Optional[str]] = mapped_column(ForeignKey('actors.id', ondelete='SET NULL'), nullable=True)
    channel: Mapped[ChannelType] = mapped_column(Enum(ChannelType, name='channel_type'), nullable=False)
    content: Mapped[str] = mapped_column(String, nullable=False)
