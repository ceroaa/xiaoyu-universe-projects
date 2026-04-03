from enum import Enum


class UserRole(str, Enum):
    PLAYER = 'PLAYER'
    ADMIN = 'ADMIN'


class UserStatus(str, Enum):
    ACTIVE = 'ACTIVE'
    DISABLED = 'DISABLED'


class ActorType(str, Enum):
    HUMAN_CHARACTER = 'HUMAN_CHARACTER'
    AI_CHARACTER = 'AI_CHARACTER'
    SYSTEM_ACTOR = 'SYSTEM_ACTOR'


class ActorStatus(str, Enum):
    ACTIVE = 'ACTIVE'
    INACTIVE = 'INACTIVE'
    DEAD = 'DEAD'


class ControllerType(str, Enum):
    HUMAN = 'HUMAN'
    AI = 'AI'
    SYSTEM = 'SYSTEM'


class AgentClass(str, Enum):
    RESIDENT = 'RESIDENT'
    MERCHANT = 'MERCHANT'
    GUARD = 'GUARD'
    STORYTELLER = 'STORYTELLER'
    PATROL = 'PATROL'


class RuntimeMode(str, Enum):
    CONTINUOUS = 'CONTINUOUS'
    MANUAL = 'MANUAL'


class PlanningMode(str, Enum):
    SINGLE_STEP = 'SINGLE_STEP'
    DELIBERATIVE = 'DELIBERATIVE'


class ItemType(str, Enum):
    CONSUMABLE = 'CONSUMABLE'
    QUEST = 'QUEST'
    TOOL = 'TOOL'
    EQUIPMENT = 'EQUIPMENT'
    TRADE_GOOD = 'TRADE_GOOD'


class LocationType(str, Enum):
    ROOM = 'ROOM'
    ACTOR = 'ACTOR'


class ChannelType(str, Enum):
    SAY = 'SAY'
    WHISPER = 'WHISPER'
    SYSTEM = 'SYSTEM'
    EMOTE = 'EMOTE'


class MemoryScope(str, Enum):
    EPISODIC = 'EPISODIC'
    SOCIAL = 'SOCIAL'
    QUEST = 'QUEST'
    SEMANTIC = 'SEMANTIC'


class QuestStatus(str, Enum):
    AVAILABLE = 'AVAILABLE'
    IN_PROGRESS = 'IN_PROGRESS'
    COMPLETED = 'COMPLETED'


class StepType(str, Enum):
    GO_TO_ROOM = 'GO_TO_ROOM'
    DELIVER_ITEM = 'DELIVER_ITEM'
    TALK_TO_ACTOR = 'TALK_TO_ACTOR'


class ActionResultType(str, Enum):
    SUCCESS = 'SUCCESS'
    FAILURE = 'FAILURE'
