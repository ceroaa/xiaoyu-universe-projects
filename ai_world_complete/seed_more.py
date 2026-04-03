from __future__ import annotations

from sqlalchemy import select

from app.db.session import SessionLocal
from app.models.ai import AIAgent
from app.models.enums import ActorType, AgentClass, ItemType, LocationType, PlanningMode
from app.models.items import ItemTemplate
from app.models.world import Room
from seed import (
    ensure_actor,
    ensure_ai_agent,
    ensure_controller,
    ensure_exit,
    ensure_goal,
    ensure_item_instance,
    ensure_item_template,
    ensure_memory,
    ensure_profile,
    ensure_room,
)
from app.models.enums import ControllerType


def main() -> None:
    db = SessionLocal()
    try:
        square = db.scalar(select(Room).where(Room.code == 'starter_village_square'))
        north_gate = db.scalar(select(Room).where(Room.code == 'starter_north_gate'))
        if not square or not north_gate:
            raise RuntimeError('please run seed.py first')

        tavern = ensure_room(db, 'starter_tavern', '晨星酒館', '暖黃燈火與木桌椅讓人暫時忘記外頭的風聲。')
        market = ensure_room(db, 'starter_market_stall', '雜貨攤位', '簡單木棚下陳列著補給與旅行用品。')
        watch_path = ensure_room(db, 'starter_watch_path', '北側巡邏道', '沿著圍籬外側延伸的小路，適合巡邏。')

        ensure_exit(db, square, 'west', tavern)
        ensure_exit(db, tavern, 'east', square)
        ensure_exit(db, square, 'south', market)
        ensure_exit(db, market, 'north', square)
        ensure_exit(db, north_gate, 'north', watch_path)
        ensure_exit(db, watch_path, 'south', north_gate)

        merchant_actor = ensure_actor(db, '酒館商人米拉', ActorType.AI_CHARACTER, tavern, title='酒館與補給商人')
        merchant_agent = ensure_ai_agent(db, 'agent_tavern_merchant_mira', AgentClass.MERCHANT, PlanningMode.SINGLE_STEP, 4500)
        ensure_controller(db, merchant_actor, ControllerType.AI, ai_agent=merchant_agent)
        ensure_profile(db, merchant_agent, '親切又會做生意的商人。', '待在酒館招呼旅人並販售補給。', {'must_stay_near_home': True})
        ensure_goal(db, merchant_agent, '招呼客人', '向進入酒館的玩家推薦補給。', 80)
        ensure_memory(db, merchant_agent, '最近很多旅人來打聽北門外的消息。')

        patrol_actor = ensure_actor(db, '巡邏員托馬斯', ActorType.AI_CHARACTER, square, title='村莊巡邏員')
        patrol_agent = ensure_ai_agent(db, 'agent_patrol_tomas', AgentClass.PATROL, PlanningMode.SINGLE_STEP, 3500)
        ensure_controller(db, patrol_actor, ControllerType.AI, ai_agent=patrol_agent)
        ensure_profile(db, patrol_agent, '負責來回巡邏的重要角色。', '在廣場、北門與巡邏道之間來回巡視。', {'must_stay_near_home': False})
        ensure_goal(db, patrol_agent, '固定巡邏', '保持路線暢通並留意玩家動靜。', 88)
        ensure_memory(db, patrol_agent, '巡邏時最常經過廣場與北門。')

        ale = ensure_item_template(db, 'item_honey_ale', '蜂蜜麥酒', ItemType.CONSUMABLE, '帶有蜂蜜香氣的溫熱麥酒。', stackable=True)
        ration = ensure_item_template(db, 'item_travel_ration', '旅行口糧', ItemType.TRADE_GOOD, '外出時很實用的乾糧組。', stackable=True)
        apple = ensure_item_template(db, 'item_orchard_apple', '果園蘋果', ItemType.CONSUMABLE, '新鮮爽脆的紅蘋果。', stackable=True)

        ensure_item_instance(db, ale, LocationType.ACTOR, str(merchant_actor.id), quantity=5)
        ensure_item_instance(db, ration, LocationType.ROOM, str(market.id), quantity=4)
        ensure_item_instance(db, apple, LocationType.ROOM, str(tavern.id), quantity=3)

        db.commit()
        print('seed_more.py completed')
    finally:
        db.close()


if __name__ == '__main__':
    main()
