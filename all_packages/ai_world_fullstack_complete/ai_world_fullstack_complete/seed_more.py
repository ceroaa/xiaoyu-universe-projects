from __future__ import annotations

from sqlalchemy import select

from app.db.session import SessionLocal
from app.models.enums import ActorType, AgentClass, ControllerType, ItemType, LocationType, PlanningMode
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


def main() -> None:
    db = SessionLocal()
    try:
        square = db.scalar(select(Room).where(Room.code == "starter_village_square"))
        north_gate = db.scalar(select(Room).where(Room.code == "starter_north_gate"))
        if not square or not north_gate:
            raise RuntimeError("please run seed.py first")

        tavern = ensure_room(
            db,
            "starter_tavern",
            "晨星酒馆",
            "木梁撑起的老酒馆里弥漫着柴火、烤肉与麦酒的味道。",
        )
        market = ensure_room(
            db,
            "starter_market_stall",
            "杂货摊位",
            "几张木桌拼成的简易摊位摆着干粮、绳索和旅行补给。",
        )
        watch_path = ensure_room(
            db,
            "starter_watch_path",
            "北侧巡逻道",
            "沿着北门外侧铺开的碎石小道，是巡逻员来回巡视的路线。",
        )

        ensure_exit(db, square, "west", tavern)
        ensure_exit(db, tavern, "east", square)
        ensure_exit(db, square, "south", market)
        ensure_exit(db, market, "north", square)
        ensure_exit(db, north_gate, "north", watch_path)
        ensure_exit(db, watch_path, "south", north_gate)

        merchant_actor = ensure_actor(db, "酒馆老板米拉", ActorType.AI_CHARACTER, tavern, title="晨星酒馆老板")
        merchant_agent = ensure_ai_agent(db, "agent_tavern_merchant_mira", AgentClass.MERCHANT, PlanningMode.SINGLE_STEP, 4500)
        ensure_controller(db, merchant_actor, ControllerType.AI, ai_agent=merchant_agent)
        ensure_profile(
            db,
            merchant_agent,
            "经营晨星酒馆的老板娘，精明健谈，对旅人的状态非常敏感。",
            "照看酒馆生意，并和旅人交换消息。",
            {"must_stay_near_home": True},
        )
        ensure_goal(db, merchant_agent, "招呼进店旅人", "主动与进入酒馆的旅人打招呼并提供补给建议。", 80)
        ensure_memory(db, merchant_agent, "新手旅人常会在外出前来酒馆打听消息与准备补给。")

        patrol_actor = ensure_actor(db, "巡逻员托马斯", ActorType.AI_CHARACTER, square, title="村中巡逻员")
        patrol_agent = ensure_ai_agent(db, "agent_patrol_tomas", AgentClass.PATROL, PlanningMode.SINGLE_STEP, 3500)
        ensure_controller(db, patrol_actor, ControllerType.AI, ai_agent=patrol_agent)
        ensure_profile(
            db,
            patrol_agent,
            "负责来回巡视村内和北门一带的巡逻员，行动勤快，说话干脆。",
            "巡查广场、北门与巡逻道，提醒旅人留意安全。",
            {"must_stay_near_home": False},
        )
        ensure_goal(db, patrol_agent, "巡查村内动线", "在广场、北门与巡逻道之间保持巡逻节奏。", 88)
        ensure_memory(db, patrol_agent, "从广场到北门，再到巡逻道，是目前最重要的巡查路线。")

        ale = ensure_item_template(db, "item_honey_ale", "蜂蜜麦酒", ItemType.CONSUMABLE, "带着蜂蜜香气的淡色麦酒。", stackable=True)
        ration = ensure_item_template(db, "item_travel_ration", "旅行口粮", ItemType.TRADE_GOOD, "适合外出携带的压缩干粮。", stackable=True)
        apple = ensure_item_template(db, "item_orchard_apple", "果园苹果", ItemType.CONSUMABLE, "刚从枝头摘下的新鲜苹果。", stackable=True)

        ensure_item_instance(db, ale, LocationType.ACTOR, str(merchant_actor.id), quantity=5)
        ensure_item_instance(db, ration, LocationType.ROOM, str(market.id), quantity=4)
        ensure_item_instance(db, apple, LocationType.ROOM, str(tavern.id), quantity=3)

        db.commit()
        print("seed_more.py completed")
    finally:
        db.close()


if __name__ == "__main__":
    main()
