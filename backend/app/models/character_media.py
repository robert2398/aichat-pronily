from sqlalchemy import Column, String, ForeignKey, DateTime, Text, Integer
from sqlalchemy.orm import relationship
from app.models.base import Base
import datetime

class CharacterMedia(Base):
    __tablename__ = "character_media"
    id = Column(Integer, primary_key=True, autoincrement=True)
    character_id = Column(Integer, ForeignKey("characters.id", ondelete="CASCADE"))
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    media_type = Column(String, nullable=False, default="image")
    s3_path = Column(Text, unique=True, nullable=False)  # e.g. u/123e.../4567.webp
    mime_type = Column(String, nullable=False, default="image/png")
    created_at = Column(DateTime(timezone=True), default=datetime.datetime.now(datetime.timezone.utc), nullable=False)

    # Relationships (optional, for ORM navigation)
    character = relationship(
        "Character",
        back_populates="character_media"
    )
    user = relationship(
        "User",
        back_populates="character_media",
        passive_deletes=True,
    )

