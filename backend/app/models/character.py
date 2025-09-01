"""
Character SQLAlchemy model.
"""
from sqlalchemy import Column, Integer, String, ForeignKey, Enum, DateTime,  Float, Text
from sqlalchemy.orm import relationship
from app.models.base import Base
import enum
import datetime
from sqlalchemy.sql import func

# class GenderEnum(str, enum.Enum):
#     man = "man"
#     woman = "woman"
#     others = "others"

class Character(Base):
    __tablename__ = "characters"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    username = Column(String, nullable=False)
    bio = Column(Text)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    gender = Column(String(50), nullable=False, default="Girl")
    style = Column(String)
    ethnicity = Column(String(50))
    age = Column(Integer)
    eye_colour = Column(String(50))
    hair_style = Column(String(50))
    hair_colour = Column(String(50))
    body_type = Column(String(50))
    breast_size = Column(String(50))
    butt_size = Column(String(50))
    dick_size = Column(String(50))
    personality = Column(Text)
    voice_type = Column(String(50))
    relationship_type = Column(String(50))
    clothing = Column(String)
    special_features = Column(Text)
    prompt = Column(String, nullable=False)
    image_url_s3 = Column(Text)
    created_at = Column(DateTime(timezone=True), default=datetime.datetime.now(datetime.timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # ORM relationships
    character_media = relationship(
        "CharacterMedia",
        back_populates="character",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
