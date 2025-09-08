"""
Subscription SQLAlchemy model.
"""
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Boolean, Numeric, BigInteger, CheckConstraint, CHAR, Text, UniqueConstraint
from sqlalchemy.orm import relationship
from app.models.base import Base
from sqlalchemy.sql import func

class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    payment_customer_id = Column(String, nullable=False)
    subscription_id = Column(String, nullable=False, unique=True)
    order_id = Column(String, ForeignKey("orders.id"), nullable=False)
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

    user = relationship("User", back_populates="subscription")
    order = relationship("Order", back_populates="subscription")

class PromoManagement(Base):
    __tablename__ = "promo_management"

    id = Column(BigInteger, primary_key=True, index=True, autoincrement=True)  # keep as internal PK
    promo_name = Column(String(255), nullable=False)
    discount_type = Column(String(50), nullable=False)  # e.g. 'subscription', 'promo'
    coupon = Column(String(100), nullable=False, unique=True)  # human code (UPPER)
    currency = Column(String(3), nullable=False, server_default='USD')
    percent_off = Column(Numeric(5, 2), nullable=False)
    stripe_promotion_id = Column(String(100), nullable=True, unique=True)   # NEW: stores promo_... id
    stripe_coupon_id = Column(String(100), nullable=True)  # optional: store coupon_... id
    start_date = Column(DateTime(timezone=True), nullable=True)
    expiry_date = Column(DateTime(timezone=True), nullable=True)
    status = Column(String(20), nullable=False, server_default='active')
    applied_count = Column(Integer, nullable=False, server_default='0')
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    orders = relationship("Order", back_populates="promo_management")
    __table_args__ = (
        CheckConstraint('coupon = UPPER(coupon)', name='chk_coupon_upper'),
        CheckConstraint('percent_off >= 0 AND percent_off <= 100', name='chk_percent_range'),
        CheckConstraint('expiry_date IS NULL OR start_date IS NULL OR start_date <= expiry_date', name='chk_dates_order'),
    )

class PricingPlan(Base):
    __tablename__ = "pricing_plan"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    plan_name = Column(String(255), nullable=False)
    pricing_id = Column(String(255), nullable=False)
    stripe_promotion_id = Column(String(255), nullable=False)
    stripe_coupon_id = Column(String(255), nullable=False)
    coupon = Column(String(255), nullable=False)
    currency = Column(CHAR(3), nullable=False, server_default='USD')
    price = Column(Numeric(10, 2), nullable=False)
    discount = Column(Numeric(10, 2), nullable=True)
    billing_cycle = Column(String(50), nullable=False)  # e.g. 'Monthly', 'Yearly'
    coin_reward = Column(Integer, nullable=False, default=0)
    status = Column(String(50), nullable=False)  # e.g. 'Active', 'Inactive'
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


class Order(Base):
    __tablename__ = "orders"

    id = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    promo_id = Column(BigInteger, ForeignKey("promo_management.id", ondelete="RESTRICT"), nullable=True)
    promo_code = Column(String(100), nullable=True)
    user_id = Column(BigInteger, ForeignKey("users.id"), nullable=False)
    stripe_customer_id = Column(String(100), nullable=False)
    subscription_id = Column(String(100), nullable=True)  # Stripe subscription ID
    order_id = Column(String(100), unique=True, nullable=True)  # keep if you use your own order IDs
    discount_type = Column(String(100), nullable=True)  # e.g. 'subscription', 'promo'
    applied_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    discount_applied = Column(Numeric(10, 2), server_default='0', nullable=False)
    subtotal_at_apply = Column(Numeric(10, 2), nullable=False)
    currency = Column(CHAR(3), nullable=False, server_default='USD')
    status = Column(String(20), nullable=False, server_default='pending')  # 'pending', 'redeemed', 'failed'
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    promo_management = relationship("PromoManagement", back_populates="orders")
    user = relationship("User", back_populates="order")
    subscription = relationship("Subscription", back_populates="order")

class UserWallet(Base):
    __tablename__ = "user_wallets"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    coin_balance = Column(Integer, nullable=False, server_default='0')
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    user = relationship("User", back_populates="user_wallet")

class CoinTransaction(Base):
    __tablename__ = "coin_transactions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    subscription_id = Column(String(100), ForeignKey("subscriptions.subscription_id"), nullable=True)
    transaction_type = Column(String(50), nullable=False)  # e.g. 'debit', 'credit'
    coins = Column(Integer, nullable=False)
    source_type = Column(String(50), nullable=False)  # e.g. 'subscription', 'coin_purchase','chat', 'image', 'video', 'character'
    order_id = Column(String(100), nullable=False)
    period_start = Column(DateTime, nullable=True)
    period_end = Column(DateTime, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    user = relationship("User")
    subscription = relationship("Subscription")


class Media(Base):
    __tablename__ = "media"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    media_type = Column(String(50), nullable=False)
    s3_url = Column(Text, nullable=True)
    coins_consumed = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    user = relationship("User")

    __table_args__ = (
        CheckConstraint("media_type IN ('image','video','character')", name='chk_media_type'),
    )


class CoinPurchase(Base):
    __tablename__ = "coin_purchases"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    plan_name = Column(String(255), nullable=False)
    pricing_id = Column(String(255), nullable=False)
    currency = Column(CHAR(3), nullable=False, server_default='USD')
    price = Column(Numeric(10, 2), nullable=False)
    discount = Column(Numeric(10, 2), nullable=True)
    coin_reward = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)