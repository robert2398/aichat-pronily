from sqlalchemy import Column, String, Integer, ForeignKey, Text
from app.models.base import Base

class OAuthIdentity(Base):
    __tablename__ = "oauth_identities"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    provider = Column(String, nullable=False)
    provider_user_id = Column(String, nullable=False)
    email = Column(String)
    full_name = Column(String)
    avatar_url = Column(String)