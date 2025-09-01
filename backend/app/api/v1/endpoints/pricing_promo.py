from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List
import stripe
from app.api.v1.deps import get_db, require_admin
from app.models.subscription import PricingPlan, PromoManagement, UserWallet
from app.schemas.subscription import PricingPlanRead, PromoManagementRead, PromoVerifyRequest
from app.core.config import settings
from app.api.v1.deps import get_current_user

stripe.api_key = settings.STRIPE_API_KEY
STRIPE_WEBHOOK_SECRET = settings.STRIPE_WEBHOOK_SECRET

router = APIRouter()

@router.get("/get-pricing", response_model=List[PricingPlanRead])
async def get_pricing(db: AsyncSession = Depends(get_db)):
    """
    Retrieve all pricing plans.
    """
    result = await db.execute(select(PricingPlan).order_by(PricingPlan.plan_id))
    pricing_plans = result.scalars().all()
    return pricing_plans

@router.get("/get-promo", response_model=List[PromoManagementRead])
async def get_promo(db: AsyncSession = Depends(get_db)):
    """
    Retrieve all promo data.
    """
    result = await db.execute(select(PromoManagement).order_by(PromoManagement.promo_id))
    promo_data = result.scalars().all()
    return promo_data


@router.post("/verify-promo")
async def verify_promo(request: PromoVerifyRequest, user=Depends(get_current_user)):
    """
    Verify the authenticity of a promo code using Stripe.
    """
    try:
        promo_list = stripe.PromotionCode.list(code=request.promo_code, limit=1)
        if not promo_list.data or not promo_list.data[0].active:
            return {"valid": False, "reason": "Invalid or inactive promo code."}

        promo = promo_list.data[0]
        # Check pricing_id match (monthly/annual)
        coupon = stripe.Coupon.retrieve(promo.coupon.id)
        # Stripe metadata can be used to store allowed pricing_ids
        allowed_pricing_ids = coupon.metadata.get("allowed_pricing_ids", "")
        if allowed_pricing_ids:
            allowed_ids = [x.strip() for x in allowed_pricing_ids.split(",")]
            if request.pricing_id not in allowed_ids:
                return {"valid": False, "reason": "Coupon not valid for this plan."}

        # FIRST50 logic: check if coupon is one-time and if user has already redeemed
        if user.email and "FIRST50" in request.promo_code.upper():
            # Search Stripe for previous redemptions by this email
            customers = stripe.Customer.list(email=user.email, limit=1)
            if customers.data:
                customer_id = customers.data[0].id
                # Check for previous invoices with this coupon
                invoices = stripe.Invoice.list(customer=customer_id, limit=10)
                for inv in invoices:
                    if inv.discount and inv.discount.coupon and inv.discount.coupon.id == coupon.id:
                        return {"valid": False, "reason": "FIRST50 coupon already used by this user."}

        return {"valid": True, "promo": promo}
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