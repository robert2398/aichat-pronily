"""
Chat message model (sessions and messages merged).
"""
import enum
from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    DateTime,
    Enum as PgEnum,
    ForeignKey,
    Index,
)
from sqlalchemy.sql import func
from app.models.base import Base

class ChatMessage(Base):
    __tablename__ = "chat_messages"
    id = Column(Integer,primary_key=True,autoincrement=True)
    session_id = Column(String(64),nullable=False,index=True)
    user_id = Column(Integer,ForeignKey("users.id"),nullable=False,index=True,)
    character_id = Column(Integer,ForeignKey("characters.id"),nullable=False,index=True)
    user_query = Column(Text, nullable=False)
    ai_message = Column(Text, nullable=True)
    context_window = Column(Integer, nullable=True)  # in seconds
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


# Optional composite index for faster session-paging by creation time
# Index("ix_chat_messages_session_time", ChatMessage.session_id, ChatMessage.created_at.desc())