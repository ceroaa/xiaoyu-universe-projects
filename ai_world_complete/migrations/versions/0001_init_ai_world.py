"""init ai world

Revision ID: 0001_init_ai_world
Revises:
Create Date: 2026-04-02 00:00:00
"""
from alembic import op
from sqlalchemy import text

from app.db.base import Base

revision = '0001_init_ai_world'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    bind.execute(text('CREATE EXTENSION IF NOT EXISTS pgcrypto'))
    Base.metadata.create_all(bind=bind)


def downgrade() -> None:
    bind = op.get_bind()
    Base.metadata.drop_all(bind=bind)
