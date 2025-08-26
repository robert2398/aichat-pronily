from sqlalchemy import Column, String, ForeignKey, DateTime, Text, Integer
from sqlalchemy.orm import relationship
from app.models.base import Base
import datetime

class CharacterImage(Base):
    __tablename__ = "character_images"
    id = Column(Integer, primary_key=True, autoincrement=True)
    character_id = Column(Integer, ForeignKey("characters.id", ondelete="CASCADE"))
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    s3_path = Column(Text, unique=True, nullable=False)  # e.g. u/123e.../4567.webp
    mime_type = Column(String, nullable=False, default="image/png")
    created_at = Column(DateTime(timezone=True), default=datetime.datetime.now(datetime.timezone.utc), nullable=False)

    # Relationships (optional, for ORM navigation)
    character = relationship(
        "Character",
        back_populates="character_images"
    )
    user = relationship("User", backref="character_images")


class CharacterVideo(Base):
    __tablename__ = "character_video"
    id = Column(Integer, primary_key=True, autoincrement=True)
    character_id = Column(Integer, ForeignKey("characters.id", ondelete="CASCADE"))
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    s3_path = Column(Text, unique=True, nullable=False)  # e.g. u/123e.../4567.webp
    mime_type = Column(String, nullable=False, default="video/mp4")
    created_at = Column(DateTime(timezone=True), default=datetime.datetime.now(datetime.timezone.utc), nullable=False)

    # Relationships (optional, for ORM navigation)
    character = relationship(
        "Character",
        back_populates="character_videos"
    )
    user = relationship("User", backref="character_videos")