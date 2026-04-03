from typing import Optional

from sqlalchemy import Boolean, Enum, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base
from app.models.enums import ActorStatus, ActorType
from app.models.mixins import TimestampMixin, UUIDPrimaryKeyMixin


class Room(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = 'rooms'

    code: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(String, nullable=False)
    zone: Mapped[str] = mapped_column(String(100), nullable=False, default='starter_zone')
    is_safe: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    tags: Mapped[dict] = mapped_column(JSONB, default=dict, nullable=False)
    ambient_state: Mapped[dict] = mapped_column(JSONB, default=dict, nullable=False)


class Actor(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = 'actors'

    actor_type: Mapped[ActorType] = mapped_column(Enum(ActorType, name='actor_type'), nullable=False)
    display_name: Mapped[str] = mapped_column(String(120), nullable=False, index=True)
    title: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    bio: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    current_room_id: Mapped[str] = mapped_column(ForeignKey('rooms.id', ondelete='RESTRICT'), nullable=False, index=True)
    status: Mapped[ActorStatus] = mapped_column(
        Enum(ActorStatus, name='actor_status'), default=ActorStatus.ACTIVE, nullable=False
    )
    gold: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    hp: Mapped[int] = mapped_column(Integer, default=100, nullable=False)
    mp: Mapped[int] = mapped_column(Integer, default=30, nullable=False)
    stats: Mapped[dict] = mapped_column(JSONB, default=dict, nullable=False)
    public_state: Mapped[dict] = mapped_column(JSONB, default=dict, nullable=False)
    private_state: Mapped[dict] = mapped_column(JSONB, default=dict, nullable=False)

    room = relationship('Room')
    controllers = relationship('Controller', back_populates='actor')


class RoomExit(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = 'room_exits'
    __table_args__ = (UniqueConstraint('from_room_id', 'direction', name='uq_room_exits_from_direction'),)

    from_room_id: Mapped[str] = mapped_column(ForeignKey('rooms.id', ondelete='CASCADE'), nullable=False, index=True)
    direction: Mapped[str] = mapped_column(String(20), nullable=False)
    to_room_id: Mapped[str] = mapped_column(ForeignKey('rooms.id', ondelete='CASCADE'), nullable=False, index=True)
    is_hidden: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    requirement_json: Mapped[dict] = mapped_column(JSONB, default=dict, nullable=False)

    from_room = relationship('Room', foreign_keys=[from_room_id])
    to_room = relationship('Room', foreign_keys=[to_room_id])
