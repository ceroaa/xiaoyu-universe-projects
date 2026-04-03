from sqlalchemy import Enum, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base
from app.models.enums import UserRole, UserStatus
from app.models.mixins import TimestampMixin, UUIDPrimaryKeyMixin


class User(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = 'users'

    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(Enum(UserRole, name='user_role'), default=UserRole.PLAYER, nullable=False)
    status: Mapped[UserStatus] = mapped_column(
        Enum(UserStatus, name='user_status'), default=UserStatus.ACTIVE, nullable=False
    )

    controllers = relationship('Controller', back_populates='user')
