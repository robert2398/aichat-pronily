from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class CheckoutSessionRequest(BaseModel):
    email: str
    plan_name: str
    frequency: str  # "monthly" | "annualy"

class CheckoutSessionResponse(BaseModel):
    session_id: str

class SubscriptionStatusResponse(BaseModel):
    plan_name: str | None = None
    status: str | None = None
    current_period_end: datetime | None = None
"""
Pydantic schemas for Subscription.
"""
class SubscriptionBase(BaseModel):
    stripe_customer_id: str
    stripe_subscription_id: str
    status: str
    current_period_end: Optional[str]

class SubscriptionRead(SubscriptionBase):
    id: int
    user_id: int


class PricingPlanRead(BaseModel):
    plan_id: int
    plan_name: str
    pricing_id: str
    currency: str
    price: float
    billing_cycle: str
    coin_reward: int
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True,
    }


class PricingPlanCreate(BaseModel):
    plan_name: str
    pricing_id: str
    currency: str
    price: float
    billing_cycle: str
    coin_reward: int
    status: str


class PricingPlanUpdate(BaseModel):
    plan_name: Optional[str] = None
    pricing_id: Optional[str] = None
    currency: Optional[str] = None
    price: Optional[float] = None
    billing_cycle: Optional[str] = None
    coin_reward: Optional[int] = None
    status: Optional[str] = None


class PromoManagementRead(BaseModel):
    promo_id: int
    promo_name: str
    coupon: str
    percent_off: float
    start_date: Optional[datetime]
    expiry_date: Optional[datetime]
    status: str
    applied_count: int
    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True,
    }


class PromoManagementCreate(BaseModel):
    promo_name: str
    coupon: str
    percent_off: float
    start_date: Optional[datetime] = None
    expiry_date: Optional[datetime] = None
    status: str


class PromoManagementUpdate(BaseModel):
    promo_name: Optional[str] = None
    percent_off: Optional[float] = None
    start_date: Optional[datetime] = None
    expiry_date: Optional[datetime] = None
    status: Optional[str] = None
