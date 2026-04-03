from __future__ import annotations

from passlib.context import CryptContext
from sqlalchemy import select

from app.db.session import SessionLocal
from app.models.ai import AIAgent, AgentGoal, AgentMemory, AgentProfile, Controller
from app.models.enums import (
    ActorType,
    AgentClass,
    ControllerType,
    ItemType,
    LocationType,
    MemoryScope,
    PlanningMode,
    RuntimeMode,
    StepType,
    UserRole,
    UserStatus,
)
from app.models.items import ItemInstance, ItemTemplate
from app.models.narrative import Quest, QuestStep
from app.models.user import User
from app.models.world import Actor, Room, RoomExit

pwd = CryptContext(schemes=['bcrypt'], deprecated='auto')


def hash_password(raw: str) -> str:
    return pwd.hash(raw)


def ensure_room(db, code: str, name: str, description: str) -> Room:
    room = db.scalar(select(Room).where(Room.code == code))
    if not room:
        room = Room(code=code, name=name, description=description, zone='starter_village')
        db.add(room)
        db.flush()
    return room


def ensure_exit(db, from_room: Room, direction: str, to_room: Room) -> RoomExit:
    row = db.scalar(select(RoomExit).where(RoomExit.from_room_id == from_room.id, RoomExit.direction == direction))
    if not row:
        row = RoomExit(from_room_id=from_room.id, direction=direction, to_room_id=to_room.id, is_hidden=False)
        db.add(row)
        db.flush()
    return row


def ensure_user(db, email: str, password: str) -> User:
    user = db.scalar(select(User).where(User.email == email))
    if not user:
        user = User(email=email, password_hash=hash_password(password), role=UserRole.PLAYER, status=UserStatus.ACTIVE)
        db.add(user)
        db.flush()
    return user


def ensure_actor(db, display_name: str, actor_type: ActorType, room: Room, title: str = '', bio: str = '', gold: int = 0) -> Actor:
    actor = db.scalar(select(Actor).where(Actor.display_name == display_name))
    if not actor:
        actor = Actor(
            display_name=display_name,
            actor_type=actor_type,
            title=title,
            bio=bio,
            current_room_id=room.id,
            gold=gold,
            stats={'str': 8, 'agi': 8, 'int': 8, 'cha': 9},
            public_state={},
            private_state={},
        )
        db.add(actor)
        db.flush()
    return actor


def ensure_ai_agent(db, agent_code: str, agent_class: AgentClass, planning: PlanningMode, tick_ms: int) -> AIAgent:
    agent = db.scalar(select(AIAgent).where(AIAgent.agent_code == agent_code))
    if not agent:
        agent = AIAgent(
            agent_code=agent_code,
            agent_class=agent_class,
            runtime_mode=RuntimeMode.CONTINUOUS,
            planning_mode=planning,
            tick_interval_ms=tick_ms,
            status='ACTIVE',
            model_profile={'provider': 'stub', 'model': 'rule-based'},
            config={},
        )
        db.add(agent)
        db.flush()
    return agent


def ensure_controller(db, actor: Actor, controller_type: ControllerType, user: User | None = None, ai_agent: AIAgent | None = None):
    row = db.scalar(select(Controller).where(Controller.actor_id == actor.id, Controller.controller_type == controller_type))
    if not row:
        row = Controller(
            actor_id=actor.id,
            controller_type=controller_type,
            user_id=user.id if user else None,
            ai_agent_id=ai_agent.id if ai_agent else None,
            is_active=True,
        )
        db.add(row)
        db.flush()
    return row


def ensure_profile(db, ai_agent: AIAgent, summary: str, goals_summary: str, constraints: dict):
    row = db.scalar(select(AgentProfile).where(AgentProfile.ai_agent_id == ai_agent.id))
    if not row:
        row = AgentProfile(
            ai_agent_id=ai_agent.id,
            identity_summary=summary,
            personality_traits={'tone': 'warm'},
            speech_style={'style': 'short_sentences'},
            goals_summary=goals_summary,
            taboos={'avoid': ['breaking world rules']},
            knowledge_scope={'zone': 'starter_village'},
            behavior_constraints=constraints,
        )
        db.add(row)
        db.flush()
    return row


def ensure_goal(db, ai_agent: AIAgent, title: str, description: str, priority: int = 50):
    row = db.scalar(select(AgentGoal).where(AgentGoal.ai_agent_id == ai_agent.id, AgentGoal.title == title))
    if not row:
        row = AgentGoal(
            ai_agent_id=ai_agent.id,
            goal_type='ROUTINE',
            title=title,
            description=description,
            priority=priority,
            constraints_json={},
        )
        db.add(row)
        db.flush()
    return row


def ensure_memory(db, ai_agent: AIAgent, summary: str, scope: MemoryScope = MemoryScope.SOCIAL, importance: int = 70):
    row = db.scalar(select(AgentMemory).where(AgentMemory.ai_agent_id == ai_agent.id, AgentMemory.summary == summary))
    if not row:
        row = AgentMemory(
            ai_agent_id=ai_agent.id,
            memory_scope=scope,
            summary=summary,
            importance_score=importance,
            entity_refs={},
            embedding_key=None,
        )
        db.add(row)
        db.flush()
    return row


def ensure_item_template(db, code: str, name: str, item_type: ItemType, description: str, stackable: bool = False):
    row = db.scalar(select(ItemTemplate).where(ItemTemplate.code == code))
    if not row:
        row = ItemTemplate(
            code=code,
            name=name,
            item_type=item_type,
            description=description,
            stackable=stackable,
            max_stack=99 if stackable else 1,
            usable=item_type in {ItemType.CONSUMABLE, ItemType.TOOL},
            data={},
        )
        db.add(row)
        db.flush()
    return row


def ensure_item_instance(db, template: ItemTemplate, location_type: LocationType, location_id: str, quantity: int = 1):
    row = db.scalar(
        select(ItemInstance).where(
            ItemInstance.template_id == template.id,
            ItemInstance.location_type == location_type,
            ItemInstance.location_id == str(location_id),
        )
    )
    if not row:
        row = ItemInstance(
            template_id=template.id,
            location_type=location_type,
            location_id=str(location_id),
            quantity=quantity,
            metadata_json={},
        )
        db.add(row)
        db.flush()
    return row


def ensure_quest(db, code: str, title: str, description: str, giver_actor: Actor, reward_gold: int = 20):
    row = db.scalar(select(Quest).where(Quest.code == code))
    if not row:
        row = Quest(code=code, title=title, description=description, giver_actor_id=giver_actor.id, reward_gold=reward_gold)
        db.add(row)
        db.flush()
    return row


def ensure_quest_step(db, quest: Quest, step_order: int, step_type: StepType, target_type: str, target_id: str, description: str):
    row = db.scalar(select(QuestStep).where(QuestStep.quest_id == quest.id, QuestStep.step_order == step_order))
    if not row:
        row = QuestStep(
            quest_id=quest.id,
            step_order=step_order,
            step_type=step_type,
            target_type=target_type,
            target_id=target_id,
            required_count=1,
            description=description,
        )
        db.add(row)
        db.flush()
    return row


def main() -> None:
    db = SessionLocal()
    try:
        square = ensure_room(db, 'starter_village_square', '村莊廣場', '石板鋪成的廣場中央有一口古井，幾位村民來回穿梭。')
        elder_house = ensure_room(db, 'starter_elder_house', '村長小屋', '木製小屋中擺滿舊地圖與信件。')
        north_gate = ensure_room(db, 'starter_north_gate', '北門哨站', '北門外通往荒野，木柵門旁站著警戒的守衛。')

        ensure_exit(db, square, 'east', elder_house)
        ensure_exit(db, elder_house, 'west', square)
        ensure_exit(db, square, 'north', north_gate)
        ensure_exit(db, north_gate, 'south', square)

        player_user = ensure_user(db, 'demo_player@example.com', 'dev123456')
        player_actor = ensure_actor(db, '測試玩家', ActorType.HUMAN_CHARACTER, square, title='初來乍到的旅人', gold=15)
        ensure_controller(db, player_actor, ControllerType.HUMAN, user=player_user)

        elder_actor = ensure_actor(db, '村長艾德里克', ActorType.AI_CHARACTER, elder_house, title='新手村村長')
        elder_agent = ensure_ai_agent(db, 'agent_elder_edric', AgentClass.STORYTELLER, PlanningMode.DELIBERATIVE, 5000)
        ensure_controller(db, elder_actor, ControllerType.AI, ai_agent=elder_agent)
        ensure_profile(db, elder_agent, '沉穩的長者，負責引導新來旅人。', '維持村莊秩序並把信送到北門。', {'must_stay_near_home': False})
        ensure_goal(db, elder_agent, '維持秩序', '觀察新手村動靜並引導玩家。', 90)
        ensure_memory(db, elder_agent, '最近北門的風聲有些不對勁。')

        guard_actor = ensure_actor(db, '北門守衛萊拉', ActorType.AI_CHARACTER, north_gate, title='北門守衛')
        guard_agent = ensure_ai_agent(db, 'agent_guard_lyra', AgentClass.GUARD, PlanningMode.SINGLE_STEP, 4000)
        ensure_controller(db, guard_actor, ControllerType.AI, ai_agent=guard_agent)
        ensure_profile(db, guard_agent, '警覺的守衛，總是留守在北門。', '守住北門並提醒旅人注意安全。', {'must_stay_near_home': True})
        ensure_goal(db, guard_agent, '守住北門', '觀察來往旅人與外部威脅。', 95)
        ensure_memory(db, guard_agent, '村長偶爾會派人送信給我。')

        bread = ensure_item_template(db, 'item_bread', '村莊麵包', ItemType.CONSUMABLE, '剛出爐的簡單麵包。', stackable=True)
        lantern = ensure_item_template(db, 'item_lantern', '黃銅提燈', ItemType.TOOL, '可照亮昏暗道路的提燈。')
        letter = ensure_item_template(db, 'item_sealed_letter', '封緘信件', ItemType.QUEST, '寫給北門守衛的信件。')

        ensure_item_instance(db, bread, LocationType.ROOM, str(square.id), quantity=3)
        ensure_item_instance(db, lantern, LocationType.ACTOR, str(player_actor.id), quantity=1)
        ensure_item_instance(db, letter, LocationType.ACTOR, str(elder_actor.id), quantity=1)

        quest = ensure_quest(
            db,
            'starter_deliver_letter',
            '送信到北門',
            '替村長把信送到北門守衛手上。',
            elder_actor,
            reward_gold=20,
        )
        ensure_quest_step(db, quest, 1, StepType.GO_TO_ROOM, 'room', str(north_gate.id), '前往北門哨站。')
        ensure_quest_step(db, quest, 2, StepType.TALK_TO_ACTOR, 'actor', str(guard_actor.id), '找到北門守衛萊拉。')

        db.commit()
        print('seed.py completed')
        print('player email: demo_player@example.com')
        print('player password: dev123456')
        print('player actor: 測試玩家')
    finally:
        db.close()


if __name__ == '__main__':
    main()
