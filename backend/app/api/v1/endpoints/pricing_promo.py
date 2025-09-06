from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List
import stripe
from app.api.v1.deps import get_db, require_admin
from app.models.subscription import CoinPurchase, PricingPlan, PromoManagement, UserWallet
from app.schemas.subscription import PricingPlanRead, PromoManagementRead, PromoVerifyRequest
from app.services.app_config import get_config_value_from_cache
from app.core.config import settings
from app.api.v1.deps import get_current_user
from sqlalchemy.sql import func
import time
from datetime import datetime, timezone

stripe.api_key = settings.STRIPE_API_KEY
STRIPE_WEBHOOK_SECRET = settings.STRIPE_WEBHOOK_SECRET

router = APIRouter()

@router.get("/get-pricing", response_model=List[PricingPlanRead])
async def get_pricing(db: AsyncSession = Depends(get_db)):
    """
    Retrieve all pricing plans.
    """
    result = await db.execute(select(PricingPlan).where(PricingPlan.billing_cycle != "One Time").order_by(PricingPlan.id))
    pricing_plans = result.scalars().all()
    return pricing_plans

@router.get("/get-promo", response_model=List[PromoManagementRead])
async def get_promo(db: AsyncSession = Depends(get_db)):
    """
    Retrieve all promo data.
    """
    result = await db.execute(select(PromoManagement).order_by(PromoManagement.id).where(PromoManagement.discount_type == "promo"))
    promo_data = result.scalars().all()
    return promo_data


@router.post("/verify-promo")
async def verify_promo(request: PromoVerifyRequest,
                       db: AsyncSession = Depends(get_db),
                       user=Depends(get_current_user)):
    """
    Verify the authenticity of a promo code using Stripe.
    """
    try:
        result = await db.execute(select(PromoManagement).where(PromoManagement.coupon == request.promo_code))
        promo_db = result.scalar_one_or_none()
        if not promo_db:
            return {"valid": False, "reason": "Invalid or inactive promo code."}
        if (getattr(promo_db, "status", "") or "").lower() != "active":
            return {"valid": False, "reason": "Promo code is not active."}
        # compare expiry against server UTC now
        if promo_db.expiry_date and promo_db.expiry_date < datetime.now(timezone.utc):
            return {"valid": False, "reason": "Promo code has expired."}

        promo_list = stripe.PromotionCode.list(code=request.promo_code, limit=1)
        if not promo_list.data or not promo_list.data[0].active:
            return {"valid": False, "reason": "Invalid or inactive promo code."}
        #print('Promo details:', promo_list)
        promo = promo_list.data[0]

        # Double-check Stripe promotion status and expiry (promo.expires_at is a unix timestamp)
        if not getattr(promo, "active", False):
            return {"valid": False, "reason": "Promotion code is not active."}

        promo_expires = getattr(promo, "expires_at", None)
        if promo_expires:
            try:
                if int(promo_expires) < int(time.time()):
                    return {"valid": False, "reason": "Promotion code has expired."}
            except Exception:
                # if parsing fails, treat as invalid
                return {"valid": False, "reason": "Invalid promotion expiry information."}

        # If the promotion includes a nested coupon object, validate that too
        # coupon_obj = getattr(promo, "coupon", None)
        # if coupon_obj:
        #     # coupon.valid is a Stripe flag; also support coupon.redeem_by (unix timestamp)
        #     if getattr(coupon_obj, "valid", None) is False:
        #         return {"valid": False, "reason": "Coupon is invalid."}
        #     redeem_by = getattr(coupon_obj, "redeem_by", None)
        #     if redeem_by:
        #         try:
        #             if int(redeem_by) < int(time.time()):
        #                 return {"valid": False, "reason": "Coupon has expired."}
        #         except Exception:
        #             return {"valid": False, "reason": "Invalid coupon expiry information."}


        # Check pricing_id match (monthly/annual)
        coupon = stripe.Coupon.retrieve(promo.coupon.id)
        # Stripe metadata can be used to store allowed pricing_ids
        allowed_pricing_ids = coupon.metadata.get("allowed_pricing_ids", "")
        if allowed_pricing_ids:
            allowed_ids = [x.strip() for x in allowed_pricing_ids.split(",")]
            if request.pricing_id not in allowed_ids:
                return {"valid": False, "reason": "Coupon not valid for this plan."}

        # # FIRST50 logic: check if coupon is one-time and if user has already redeemed
        # if user.email and "FIRST50" in request.promo_code.upper():
        #     # Search Stripe for previous redemptions by this email
        #     customers = stripe.Customer.list(email=user.email, limit=1)
        #     if customers.data:
        #         customer_id = customers.data[0].id
        #         # Check for previous invoices with this coupon
        #         invoices = stripe.Invoice.list(customer=customer_id, limit=10)
        #         for inv in invoices:
        #             if inv.discount and inv.discount.coupon and inv.discount.coupon.id == coupon.id:
        #                 return {"valid": False, "reason": "FIRST50 coupon already used by this user."}

        return {"valid": True, "reason": "Promotion code is valid."}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Stripe error: {str(e)}")


@router.get("/get-user-coin")
async def get_user_coin(user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """
    Get the user's coin balance.
    """
    stmt = select(UserWallet).where(UserWallet.user_id == user.id)
    result = await db.execute(stmt)
    user_wallet = result.scalar_one_or_none()
    if not user_wallet:
        raise HTTPException(status_code=404, detail="User wallet not found")

    return user_wallet

@router.get("/coin-cost")
async def get_coin_cost(db: AsyncSession = Depends(get_db)):
    """
    Get the coin cost consumption cost for chat, video, and image.
    """
    chat_cost = await get_config_value_from_cache("CHAT_COST")
    character_cost = await get_config_value_from_cache("CHARACTER_COST")
    image_cost = await get_config_value_from_cache("IMAGE_COST")
    video_cost = await get_config_value_from_cache("VIDEO_COST")

    return {
        "chat_cost": int(chat_cost) if chat_cost else 1,
        "character_cost": int(character_cost) if character_cost else 6,
        "image_cost": int(image_cost) if image_cost else 5,
        "video_cost": int(video_cost) if video_cost else 10,
    }
@router.get("/get-coin-pricing")
async def get_coin_pricing (db: AsyncSession = Depends(get_db)):
    """
    Get the coin purchase pricing plans.
    """
    result = await db.execute(select(PricingPlan).where(PricingPlan.billing_cycle == "One Time").order_by(PricingPlan.coin_reward))
    coin_plans = result.scalars().all()
    return coin_plans