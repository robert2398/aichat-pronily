from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.app_config import AppConfig
from app.core.config import settings
from fastapi import HTTPException


_config_cache = None

async def load_config_cache(db: AsyncSession):
    global _config_cache
    result = await db.execute(select(AppConfig))
    configs = result.scalars().all()
    _config_cache = {c.parameter_name: c.parameter_value for c in configs}

async def get_config_value_from_cache(name: str) -> str | None:
    if _config_cache is None:
        raise RuntimeError("Config cache not loaded. Call load_config_cache first.")
    return _config_cache.get(name)

async def get_price_id(payload) -> str:
    """
    Determine Stripe price ID based on the subscription plan and frequency.

    :param payload: Object with 'frequency' and 'plan_name' attributes
    :return: Stripe price ID as string
    """
    
    price_id = None

    if payload.frequency == "monthly":
        # Use monthly price ID from config
        if payload.plan_name == "pro":
            price_id = await get_config_value_from_cache("STRIPE_MONTHLY_PRO_PRICE_ID")
        elif payload.plan_name == "vip":
            # Assuming you have a monthly price ID for VIP as well
            price_id = await get_config_value_from_cache("STRIPE_MONTHLY_VIP_PRICE_ID")
    elif payload.frequency == "annualy":
        # Use yearly price ID from config
        if payload.plan_name == "pro":
            price_id = await get_config_value_from_cache("STRIPE_ANNUAL_PRO_PRICE_ID")
        elif payload.plan_name == "vip":
            # Assuming you have a yearly price ID for VIP as well
            price_id = await get_config_value_from_cache("STRIPE_ANNUAL_VIP_PRICE_ID")

    return price_id

