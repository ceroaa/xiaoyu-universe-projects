from typing import Optional

from sqlalchemy import Boolean, Enum, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base
from app.models.enums import AgentClass, ControllerType, MemoryScope, PlanningMode, RuntimeMode
from app.models.mixins import TimestampMixin, UUIDPrimaryKeyMixin


class AIAgent(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = 'ai_agents'

    agent_code: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    agent_class: Mapped[AgentClass] = mapped_column(Enum(AgentClass, name='agent_class'), nullable=False)
    runtime_mode: Mapped[RuntimeMode] = mapped_column(
        Enum(RuntimeMode, name='runtime_mode'), default=RuntimeMode.CONTINUOUS, nullable=False
    )
    planning_mode: Mapped[PlanningMode] = mapped_column(
        Enum(PlanningMode, name='planning_mode'), default=PlanningMode.SINGLE_STEP, nullable=False
    )
    tick_interval_ms: Mapped[int] = mapped_column(Integer, default=3000, nullable=False)
    status: Mapped[str] = mapped_column(String(30), default='ACTIVE', nullable=False)
    model_profile: Mapped[dict] = mapped_column(JSONB, default=dict, nullable=False)
    config: Mapped[dict] = mapped_column(JSONB, default=dict, nullable=False)

    profile = relationship('AgentProfile', back_populates='agent', uselist=False)


class Controller(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = 'controllers'

    actor_id: Mapped[str] = mapped_column(ForeignKey('actors.id', ondelete='CASCADE'), nullable=False, index=True)
    controller_type: Mapped[ControllerType] = mapped_column(
        Enum(ControllerType, name='controller_type'), nullable=False, index=True
    )
    user_id: Mapped[Optional[str]] = mapped_column(ForeignKey('users.id', ondelete='SET NULL'), nullable=True, index=True)
    ai_agent_id: Mapped[Optional[str]] = mapped_column(
        ForeignKey('ai_agents.id', ondelete='SET NULL'), nullable=True, index=True
    )
    priority: Mapped[int] = mapped_column(Integer, default=100, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    actor = relationship('Actor', back_populates='controllers')
    user = relationship('User', back_populates='controllers')
    ai_agent = relationship('AIAgent')


class AgentProfile(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = 'agent_profiles'
    __table_args__ = (UniqueConstraint('ai_agent_id', name='uq_agent_profiles_ai_agent_id'),)

    ai_agent_id: Mapped[str] = mapped_column(ForeignKey('ai_agents.id', ondelete='CASCADE'), nullable=False)
    identity_summary: Mapped[str] = mapped_column(String, nullable=False)
    personality_traits: Mapped[dict] = mapped_column(JSONB, default=dict, nullable=False)
    speech_style: Mapped[dict] = mapped_column(JSONB, default=dict, nullable=False)
    goals_summary: Mapped[str] = mapped_column(String, nullable=False, default='')
    taboos: Mapped[dict] = mapped_column(JSONB, default=dict, nullable=False)
    knowledge_scope: Mapped[dict] = mapped_column(JSONB, default=dict, nullable=False)
    behavior_constraints: Mapped[dict] = mapped_column(JSONB, default=dict, nullable=False)

    agent = relationship('AIAgent', back_populates='profile')


class AgentMemory(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = 'agent_memories'

    ai_agent_id: Mapped[str] = mapped_column(ForeignKey('ai_agents.id', ondelete='CASCADE'), nullable=False, index=True)
    memory_scope: Mapped[MemoryScope] = mapped_column(Enum(MemoryScope, name='memory_scope'), nullable=False)
    summary: Mapped[str] = mapped_column(String, nullable=False)
    importance_score: Mapped[int] = mapped_column(Integer, default=50, nullable=False)
    entity_refs: Mapped[dict] = mapped_column(JSONB, default=dict, nullable=False)
    embedding_key: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)


class AgentGoal(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = 'agent_goals'

    ai_agent_id: Mapped[str] = mapped_column(ForeignKey('ai_agents.id', ondelete='CASCADE'), nullable=False, index=True)
    goal_type: Mapped[str] = mapped_column(String(50), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(String, nullable=False)
    priority: Mapped[int] = mapped_column(Integer, default=50, nullable=False)
    status: Mapped[str] = mapped_column(String(30), default='ACTIVE', nullable=False)
    constraints_json: Mapped[dict] = mapped_column(JSONB, default=dict, nullable=False)


class AgentPlan(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = 'agent_plans'

    ai_agent_id: Mapped[str] = mapped_column(ForeignKey('ai_agents.id', ondelete='CASCADE'), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[str] = mapped_column(String(30), default='ACTIVE', nullable=False)
    current_step: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    steps_json: Mapped[dict] = mapped_column(JSONB, default=dict, nullable=False)
