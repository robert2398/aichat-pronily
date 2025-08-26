"""
Subscription SQLAlchemy model.
"""
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Boolean, Numeric, BigInteger, CheckConstraint, CHAR, Text
from sqlalchemy.orm import relationship
from app.models.base import Base
from sqlalchemy.sql import func

class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    payment_customer_id = Column(String, nullable=False)
    payment_subscription_id = Column(String, nullable=False)
    price_id = Column(String, nullable=True)
    plan_name = Column(String, nullable=True)  # "pro" or "vip"
    status = Column(String, nullable=False)
    current_period_end = Column(DateTime)
    start_date = Column(DateTime, default=func.now())
    cancel_at_period_end = Column(Boolean, default=False)
    last_rewarded_period_end = Column(DateTime, nullable=True)
    total_coins_rewarded = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


    user = relationship("User", back_populates="subscriptions")


class PromoManagement(Base):
    __tablename__ = "promo_management"

    promo_id = Column(BigInteger, primary_key=True, index=True)
    promo_name = Column(String(255), nullable=False)
    coupon = Column(String(100), nullable=False, unique=True)
    percent_off = Column(Numeric(5, 2), nullable=False)
    start_date = Column(DateTime(timezone=True), nullable=True)
    expiry_date = Column(DateTime(timezone=True), nullable=True)
    status = Column(String(20), nullable=False, server_default='active')
    applied_count = Column(Integer, nullable=False, server_default='0')
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    redemptions = relationship("PromoRedemption", back_populates="promo")

    __table_args__ = (
        CheckConstraint('coupon = UPPER(coupon)', name='chk_coupon_upper'),
        CheckConstraint('percent_off >= 0 AND percent_off <= 100', name='chk_percent_range'),
        CheckConstraint('expiry_date IS NULL OR start_date IS NULL OR start_date <= expiry_date', name='chk_dates_order'),
    )


class PricingPlan(Base):
    __tablename__ = "pricing_plan"

    plan_id = Column(Integer, primary_key=True, index=True)
    plan_name = Column(String(255), nullable=False)
    pricing_id = Column(String(255), nullable=False)
    currency = Column(CHAR(3), nullable=False, server_default='USD')
    price = Column(Numeric(10, 2), nullable=False)
    discount = Column(Numeric(10, 2), nullable=True)
    billing_cycle = Column(String(50), nullable=False)  # e.g. 'monthly', 'yearly'
    coin_reward = Column(Integer, nullable=False, default=0)
    status = Column(String(50), nullable=False)  # e.g. 'active', 'inactive'
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


class PromoRedemption(Base):
    __tablename__ = "promo_redemption"

    redemption_id = Column(BigInteger, primary_key=True, index=True)
    promo_id = Column(BigInteger, ForeignKey("promo_management.promo_id", ondelete="RESTRICT"), nullable=False)
    promo_code = Column(String(100), nullable=False)
    user_id = Column(BigInteger, ForeignKey("users.id"), nullable=False)
    order_id = Column(BigInteger, unique=True, nullable=True)
    applied_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    discount_applied = Column(Numeric(10, 2), nullable=False)
    subtotal_at_apply = Column(Numeric(10, 2), nullable=True)
    currency = Column(CHAR(3), nullable=False, server_default='USD')

    promo = relationship("PromoManagement", back_populates="redemptions")
    user = relationship("User", back_populates="promo_redemptions")

    __table_args__ = (
        CheckConstraint('promo_code = UPPER(promo_code)', name='chk_code_upper'),
    )


class UserWallet(Base):
    __tablename__ = "user_wallets"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    coin_balance = Column(Integer, nullable=False, server_default='0')
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    user = relationship("User")

class CoinTransaction(Base):
    __tablename__ = "coin_transactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    subscription_id = Column(Integer, ForeignKey("subscriptions.id"), nullable=True)
    coins = Column(Integer, nullable=False)  # positive for earn, negative for spend
    source_type = Column(String(50), nullable=False)  # e.g. 'subscription', 'one_time_purchase', 'image', 'video', 'character'
    source_id = Column(Integer, nullable=True)
    description = Column(Text, nullable=True)
    period_start = Column(DateTime, nullable=True)
    period_end = Column(DateTime, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    user = relationship("User")
    subscription = relationship("Subscription")


class Media(Base):
    __tablename__ = "media"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    media_type = Column(String(50), nullable=False)
    s3_url = Column(Text, nullable=True)
    coins_consumed = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    user = relationship("User")

    __table_args__ = (
        CheckConstraint("media_type IN ('image','video','character')", name='chk_media_type'),
    )

