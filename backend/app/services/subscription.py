from fastapi import HTTPException
from sqlalchemy.future import select
from app.core.database import get_db
from app.models.subscription import PricingPlan, Subscription
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import User
from app.services.app_config import get_config_value_from_cache
from app.models.subscription import UserWallet, CoinTransaction
from app.api.v1.deps import check_admin

async def get_subscription_id_and_status(db: AsyncSession, user_id: int):
    default_subscription_id = "free"
    if not user_id:
        return default_subscription_id, False
    res = await db.execute(
        select(Subscription).where(Subscription.user_id == user_id)
    )
    subscription = res.scalars().first()
    if subscription:
        return subscription.subscription_id, subscription.status
    return default_subscription_id, False

async def get_pricing(price_id: str, db: AsyncSession):
    if not price_id:
        return None
    res = await db.execute(
        select(PricingPlan).where(PricingPlan.pricing_id == price_id)
    )
    return res.scalars().first()

async def get_media_cost(media_type: str = "chat"):
    if media_type == "chat":
        media_cost = await get_config_value_from_cache("CHAT_COST")
    elif media_type == "image":
        media_cost = await get_config_value_from_cache("IMAGE_COST")
    elif media_type == "video":
        media_cost = await get_config_value_from_cache("VIDEO_COST")
    elif media_type == "character":
        media_cost = await get_config_value_from_cache("CHARACTER_COST")
    else:
        media_cost = 0

    return int(media_cost)

async def check_user_wallet(db: AsyncSession, user_id: int, media_type: str = "chat"):
    is_coin_sufficient = False
    if await check_admin(user_id, db):
        return True
    coins = await db.execute(select(UserWallet).where(UserWallet.user_id == user_id))
    coins = coins.scalars().first()
    if coins:
        coin_balance = coins.coin_balance
    else:
        coin_balance = 0

    media_cost = await get_media_cost(media_type)
    if coin_balance < media_cost:
        raise HTTPException(status_code=402, detail="Insufficient coins. Please purchase more coins to continue.")
    else:
        is_coin_sufficient = True
    return is_coin_sufficient

async def deduct_user_coins(db: AsyncSession, user_id: int, media_type: str = "chat"):
    if await check_admin(user_id, db):
        return True
    media_cost = await get_media_cost(media_type)
    subscription_id, _ = await get_subscription_id_and_status(db, user_id)
    # Record coin transaction as one-time purchase
    tx = CoinTransaction(
        user_id=user_id,
        subscription_id=subscription_id,
        transaction_type="debit",
        coins=media_cost,
        source_type=media_type,
        order_id="default",
        period_start=None,
        period_end=None,
    )
    db.add(tx)
    await db.commit()

    # Update wallet
    wallet_res = await db.execute(select(UserWallet).where(UserWallet.user_id == user_id))
    wallet = wallet_res.scalars().first()
    if wallet:
        wallet.coin_balance = (wallet.coin_balance ) - media_cost
        db.add(wallet)
        await db.commit()
    return True