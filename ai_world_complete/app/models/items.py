from typing import Optional

from sqlalchemy import Enum, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base
from app.models.enums import ItemType, LocationType
from app.models.mixins import TimestampMixin, UUIDPrimaryKeyMixin


class ItemTemplate(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = 'item_templates'

    code: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    item_type: Mapped[ItemType] = mapped_column(Enum(ItemType, name='item_type'), nullable=False)
    description: Mapped[str] = mapped_column(String, nullable=False)
    stackable: Mapped[bool] = mapped_column(default=False, nullable=False)
    max_stack: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    usable: Mapped[bool] = mapped_column(default=False, nullable=False)
    data: Mapped[dict] = mapped_column(JSONB, default=dict, nullable=False)


class ItemInstance(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = 'item_instances'

    template_id: Mapped[str] = mapped_column(ForeignKey('item_templates.id', ondelete='RESTRICT'), nullable=False, index=True)
    quantity: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    location_type: Mapped[LocationType] = mapped_column(Enum(LocationType, name='location_type'), nullable=False)
    location_id: Mapped[str] = mapped_column(nullable=False, index=True)
    status: Mapped[str] = mapped_column(String(50), default='ACTIVE', nullable=False)
    metadata_json: Mapped[dict] = mapped_column('metadata', JSONB, default=dict, nullable=False)
    owner_actor_id: Mapped[Optional[str]] = mapped_column(ForeignKey('actors.id', ondelete='SET NULL'), nullable=True)

    template = relationship('ItemTemplate')
