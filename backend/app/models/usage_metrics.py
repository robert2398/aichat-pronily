"""
UsageMetrics SQLAlchemy model.
"""
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from app.models.base import Base
import datetime

class UsageMetrics(Base):
    __tablename__ = "usage_metrics"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    character_id = Column(Integer, ForeignKey("characters.id"), nullable=False)
    tokens_input = Column(Integer, default=0)
    tokens_output = Column(Integer, default=0)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
