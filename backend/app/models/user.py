"""
User SQLAlchemy model.
"""
import enum as python_enum
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.models.base import Base

class RoleEnum(str, python_enum.Enum):
    USER = "user"
    ADMIN = "admin"

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(Text, unique=True, nullable=False)
    hashed_password = Column(Text, nullable=True)  # nullable for SSO
    full_name = Column(Text, nullable=True)
    role = Column(
        Enum(RoleEnum, name="role_enum", create_constraint=True),
        nullable=False,
        default=RoleEnum.USER,
    )
    is_active = Column(Boolean, default=True, nullable=False)
    is_email_verified = Column(Boolean, default=False, nullable=False)
    payment_customer_id = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    subscriptions = relationship("Subscription", back_populates="user")
    promo_redemptions = relationship("PromoRedemption", back_populates="user")
    activation_tokens = relationship("UserActivation", back_populates="user", cascade="all, delete-orphan")
    
    # wallet and coin relations
    user_wallet = relationship("UserWallet", back_populates="user", uselist=False)
    coin_transactions = relationship("CoinTransaction", back_populates="user")
    media_items = relationship("Media", back_populates="user")





