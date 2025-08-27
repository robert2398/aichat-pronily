"""
Stripe webhook endpoint for subscription events with coupon management.
"""

import asyncio
import stripe
from fastapi import APIRouter, Request, status, Depends, HTTPException
from fastapi.responses import JSONResponse
from app.schemas.subscription import CheckoutSessionRequest, CheckoutSessionResponse, SubscriptionStatusResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.core.database import get_db
from app.models.user import User
from app.models.subscription import Subscription, PricingPlan, CoinTransaction, UserWallet
from app.models.subscription import PromoManagement, PromoRedemption
from app.api.v1.deps import get_current_user
from datetime import datetime, timezone
from app.core.config import settings
from app.services.app_config import get_config_value_from_cache

router = APIRouter()

stripe.api_key = settings.STRIPE_API_KEY
STRIPE_WEBHOOK_SECRET = settings.STRIPE_WEBHOOK_SECRET


@router.post("/create-checkout-session", response_model=CheckoutSessionResponse)
async def create_checkout_session(
    payload: CheckoutSessionRequest,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Create Stripe customer if not already linked
    if not user.payment_customer_id:
        customer = stripe.Customer.create(email=user.email)
        user.payment_customer_id = customer.id
        await db.commit()
        await db.refresh(user)
    else:
        customer = stripe.Customer.retrieve(user.payment_customer_id)

    frontend_url = await get_config_value_from_cache("FRONTEND_URL")
    if not payload.price_id:
        raise HTTPException(status_code=400, detail="Invalid plan name")

    promo_code = None
    if payload.coupon:
        # Check promo validity
        res = await db.execute(select(PromoManagement).where(PromoManagement.coupon == payload.coupon))
        promo = res.scalars().first()
        if not promo:
            raise HTTPException(status_code=400, detail="Invalid coupon")
        if promo.status != "active":
            raise HTTPException(status_code=400, detail="Coupon inactive")
        if promo.expiry_date and datetime.now(timezone.utc) > promo.expiry_date:
            raise HTTPException(status_code=400, detail="Coupon expired")

        promo_code = promo.stripe_promotion_id  # Stripe promo_id eg promo_******
        # Pre-create redemption entry (pending)
        redemption = PromoRedemption(
            promo_id=promo.promo_id,
            promo_code=payload.coupon,
            user_id=user.id,
            discount_applied=payload.discount_applied,
            subtotal_at_apply=payload.subtotal_at_apply,
            status="pending"
        )
        db.add(redemption)
        await db.commit()

    session = stripe.checkout.Session.create(
        customer=customer.id,
        payment_method_types=["card"],
        line_items=[{"price": payload.price_id, "quantity": 1}],
        mode="subscription",
        discounts=[{"promotion_code": promo_code}] if promo_code else None,
        success_url=frontend_url + "/success?session_id={CHECKOUT_SESSION_ID}",
        cancel_url=frontend_url + "/cancel",
    )
    return CheckoutSessionResponse(session_id=session.id)


@router.post("/webhook")
async def stripe_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, STRIPE_WEBHOOK_SECRET
        )
    except Exception as e:
        return JSONResponse(status_code=400, content={"error": str(e)})

    async def get_pricing(price_id: str):
        if not price_id:
            return None
        res = await db.execute(
            select(PricingPlan).where(PricingPlan.pricing_id == price_id)
        )
        return res.scalars().first()

    # ✅ Subscription created
    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        customer_id = session["customer"]
        subscription_id = session["subscription"]
        stripe_sub = stripe.Subscription.retrieve(subscription_id)

        price_id = stripe_sub["items"]["data"][0]["price"]["id"]
        plan_name = stripe_sub["items"]["data"][0]["price"].get("nickname")
        current_period_end = datetime.fromtimestamp(stripe_sub["current_period_end"])
        current_period_start = datetime.fromtimestamp(stripe_sub["current_period_start"])
        email = session.get("customer_email") or session.get("email")

        # Find user
        result = await db.execute(select(User).where(User.payment_customer_id == customer_id))
        user = result.scalar_one_or_none()
        if not user and email:
            result = await db.execute(select(User).where(User.email == email))
            user = result.scalar_one_or_none()

        if user:
            user.payment_customer_id = customer_id
            await db.commit()
            await db.refresh(user)

            sub = Subscription(
                user_id=user.id,
                payment_customer_id=customer_id,
                payment_subscription_id=subscription_id,
                price_id=price_id,
                plan_name=plan_name,
                status="active",
                current_period_end=current_period_end,
                last_rewarded_period_end=current_period_end,
                total_coins_rewarded=0,
            )
            db.add(sub)
            await db.commit()
            await db.refresh(sub)

            # Reward coins
            pricing = await get_pricing(price_id)
            coins = int(pricing.coin_reward or 0) if pricing else 0

            tx = CoinTransaction(
                user_id=user.id,
                coins=coins,
                source_type="subscription",
                source_id=sub.id,
                subscription_id=sub.id,
                description="Subscription Initial Reward",
                period_start=current_period_start,
                period_end=current_period_end,
            )
            db.add(tx)

            # Update wallet
            wallet_res = await db.execute(select(UserWallet).where(UserWallet.user_id == user.id))
            wallet = wallet_res.scalars().first()
            if wallet:
                wallet.coin_balance = (wallet.coin_balance or 0) + coins
            else:
                wallet = UserWallet(user_id=user.id, coin_balance=coins)
                db.add(wallet)

            sub.total_coins_rewarded += coins

            # ✅ Mark promo redemption success if used
            if session.get("total_details", {}).get("amount_discount"):
                # Find pending redemption for this user
                res = await db.execute(
                    select(PromoRedemption).where(
                        PromoRedemption.user_id == user.id,
                        PromoRedemption.stripe_customer_id == user.payment_customer_id,
                        PromoRedemption.status == "pending"
                    )
                )
                redemption = res.scalars().first()
                if redemption:
                    redemption.status = "success"
                    redemption.redeemed_at = datetime.utcnow()
                    promo_res = await db.execute(select(PromoManagement).where(PromoManagement.promo_id == redemption.promo_id))
                    promo = promo_res.scalars().first()
                    if promo:
                        promo.applied_count += 1
                    await db.commit()

            await db.commit()

    # ✅ Renewal / Plan update
    elif event["type"] in ["customer.subscription.updated", "customer.subscription.deleted"]:
        sub_obj = event["data"]["object"]
        subscription_id = sub_obj["id"]
        status = sub_obj["status"]
        current_period_end = datetime.fromtimestamp(sub_obj["current_period_end"])
        current_period_start = datetime.fromtimestamp(sub_obj["current_period_start"])
        price_id = sub_obj["items"]["data"][0]["price"]["id"] if sub_obj["items"]["data"] else None
        plan_name = sub_obj["items"]["data"][0]["price"].get("nickname")
        customer_id = sub_obj["customer"]

        result = await db.execute(select(User).where(User.payment_customer_id == customer_id))
        user = result.scalar_one_or_none()
        if user:
            result = await db.execute(
                select(Subscription)
                .where(Subscription.user_id == user.id)
                .order_by(Subscription.id.desc())
            )
            sub = result.scalars().first()
            if sub:
                old_price_id = sub.price_id
                old_period_end = sub.current_period_end

                sub.status = status
                sub.current_period_end = current_period_end
                sub.price_id = price_id
                sub.plan_name = plan_name
                await db.commit()

                if status == "active" and price_id:
                    old_pricing = await get_pricing(old_price_id)
                    new_pricing = await get_pricing(price_id)

                    if old_pricing and new_pricing:
                        old_coins = int(old_pricing.coin_reward or 0)
                        new_coins = int(new_pricing.coin_reward or 0)

                        delta = 0
                        desc = None

                        # Renewal detection
                        if old_period_end and current_period_end > old_period_end:
                            if not sub.last_rewarded_period_end or current_period_end > sub.last_rewarded_period_end:
                                delta = new_coins
                                desc = "Subscription Renewal Reward"
                                sub.last_rewarded_period_end = current_period_end

                        # Mid-cycle upgrade/downgrade
                        else:
                            start_ts = current_period_start
                            end_ts = current_period_end
                            total_days = (end_ts - start_ts).days or 1
                            elapsed_days = (datetime.utcnow() - start_ts).days
                            remaining_ratio = max(0, (total_days - elapsed_days) / total_days)

                            remaining_new = int(new_coins * remaining_ratio)
                            remaining_old = int(old_coins * remaining_ratio)
                            delta = remaining_new - remaining_old
                            desc = "Subscription Plan Change Adjustment"

                        if delta != 0:
                            tx = CoinTransaction(
                                user_id=user.id,
                                coins=delta,
                                source_type="subscription",
                                source_id=sub.id,
                                subscription_id=sub.id,  # new field
                                description=desc,
                                period_start=current_period_start,
                                period_end=current_period_end,
                            )
                            db.add(tx)
                            wallet_res = await db.execute(select(UserWallet).where(UserWallet.user_id == user.id))
                            wallet = wallet_res.scalars().first()
                            if wallet:
                                wallet.coin_balance = (wallet.coin_balance or 0) + delta
                            else:
                                wallet = UserWallet(user_id=user.id, coin_balance=delta)
                                db.add(wallet)

                            sub.total_coins_rewarded += delta
                            await db.commit()

    return {"status": "success"}


@router.get("/subscription/status", response_model=SubscriptionStatusResponse)
async def get_subscription_status(user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Subscription)
        .where(Subscription.user_id == user.id)
        .order_by(Subscription.id.desc())
    )
    sub = result.scalars().first()
    if not sub:
        return SubscriptionStatusResponse()
    return SubscriptionStatusResponse(
        plan_name=sub.plan_name,
        status=sub.status,
        current_period_end=sub.current_period_end
    )
