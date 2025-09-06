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
from app.models.subscription import PromoManagement, Order
from app.api.v1.deps import get_current_user
from datetime import datetime, timezone
from app.core.config import settings
from app.services.app_config import get_config_value_from_cache
from app.services.subscription import get_pricing
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
    else:
        customer = stripe.Customer.retrieve(user.payment_customer_id)

    frontend_url = await get_config_value_from_cache("FRONTEND_URL")
    if not payload.price_id:
        raise HTTPException(status_code=400, detail="Invalid plan name")

    stripe_promotion_id = None
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
        stripe_promotion_id = promo.stripe_promotion_id  # Stripe promo_id eg promo_******
    if stripe_promotion_id:
        promo_id = promo.id
        promo_code = payload.coupon
        discount_type = payload.discount_type
        discount_applied = payload.discount_applied or 0

    else:
        promo_id = None
        promo_code = None
        discount_type = None
        discount_applied = 0
    # ensure we store the stripe customer id (not-null) and avoid using a literal string for order_id
    stripe_cust_id = getattr(customer, "id", customer)
    order = Order(
                promo_id=promo_id,
                promo_code=promo_code,
                user_id=user.id,
                stripe_customer_id=stripe_cust_id,
                subscription_id=None,
                order_id=None,
                discount_type=payload.discount_type,
                discount_applied=discount_applied,
                subtotal_at_apply=payload.subtotal_at_apply,
                currency=payload.currency,
                status="pending"
            )
    db.add(order)
    await db.commit()
    if payload.discount_type == "coin_purchase":
        payment_type = "payment"
    else:   
        payment_type = "subscription"       
    session = stripe.checkout.Session.create(
        customer=customer.id,
        payment_method_types=["card"],
        line_items=[{"price": payload.price_id, "quantity": 1}],
        mode=payment_type,
        discounts=[{"promotion_code": stripe_promotion_id}] if stripe_promotion_id else None,
        success_url=frontend_url + "/success?session_id={CHECKOUT_SESSION_ID}",
        cancel_url=frontend_url + "/cancel",
    )
    return CheckoutSessionResponse(session_id=session.id)


@router.post("/webhooks/stripe")
async def stripe_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, STRIPE_WEBHOOK_SECRET
        )
    except Exception as e:
        return JSONResponse(status_code=400, content={"error": str(e)})

    # ✅ Subscription created
    if event["type"] == "checkout.session.completed":
        
        session = event["data"]["object"]
        customer_id = session["customer"]

        # NEW: branch by mode
        if session.get("mode") == "payment":
            # --- ONE-TIME CHECKOUT FLOW ---
            # get the line items so we can see which price was purchased
            cs = stripe.checkout.Session.retrieve(session["id"], expand=["line_items"])
            li = (cs.get("line_items", {}) or {}).get("data", [{}])[0]
            price = (li or {}).get("price") or {}
            price_id = price.get("id")

            pricing = await get_pricing(price_id, db)
            plan_name = pricing.plan_name if pricing else "One-time"
            billing_cycle = "one time"

            # use payment_intent as your "order id" for one-time purchases
            order_id = session.get("payment_intent")
            email = session.get("customer_email") or session.get("email")

            # Find the user (same as your existing logic)
            result = await db.execute(select(User).where(User.payment_customer_id == customer_id))
            user = result.scalar_one_or_none()
            if not user and email:
                result = await db.execute(select(User).where(User.email == email))
                user = result.scalar_one_or_none()
            sub = await db.execute(select(Subscription).where(Subscription.payment_customer_id == customer_id))
            sub = sub.scalar_one_or_none()
            subscription_id = sub.subscription_id if sub else None
            coins = int(pricing.coin_reward or 0) if pricing else 0
            if user:
                # ensure customer id stored
                user.payment_customer_id = customer_id
                await db.commit()

                # Record coin transaction as one-time purchase
                tx = CoinTransaction(
                    user_id=user.id,
                    subscription_id=subscription_id,
                    transaction_type="credit",
                    coins=coins,
                    source_type="coin_purchase",
                    order_id=order_id,
                    period_start=None,
                    period_end=None,
                )
                db.add(tx)
                await db.commit()

                # Update wallet
                wallet_res = await db.execute(select(UserWallet).where(UserWallet.user_id == user.id))
                wallet = wallet_res.scalars().first()
                if wallet:
                    wallet.coin_balance = (wallet.coin_balance or 0) + coins
                else:
                    wallet = UserWallet(user_id=user.id, coin_balance=coins)
                    db.add(wallet)
                await db.commit()

                # Close the pending Order row you created pre-checkout
                res = await db.execute(
                    select(Order).where(
                        Order.user_id == user.id,
                        Order.stripe_customer_id == user.payment_customer_id,
                        Order.status == "pending"
                    ).order_by(Order.id.desc())
                )
                order = res.scalars().first()
                if order:
                    order.status = "success"
                    order.order_id = order_id
                    order.subscription_id = subscription_id
                    await db.commit()

            return {"status": "success"}
        else:
            # --- SUBSCRIPTION FLOW (your existing code) ---
            subscription_id = session["subscription"]
            stripe_sub = stripe.Subscription.retrieve(subscription_id)

            stripe_sub = stripe.Subscription.retrieve(subscription_id)
            print("stripe_sub:", stripe_sub)
            first_item = (stripe_sub.get("items", {}) or {}).get("data", [{}])[0]
            price = (first_item or {}).get("price") or {}
            price_id = price.get("id")
            pricing = await get_pricing(price_id, db)
            if pricing:
                plan_name = pricing.plan_name
                billing_cycle = pricing.billing_cycle.lower()

            # # Use safe .get() because webhook payloads can omit timestamps
            cpe_ts = stripe_sub.get("current_period_end")
            cps_ts = stripe_sub.get("current_period_start")
            current_period_end = datetime.fromtimestamp(cpe_ts) if cpe_ts else None
            current_period_start = datetime.fromtimestamp(cps_ts) if cps_ts else None
            email = session.get("customer_email") or session.get("email")
            order_id = stripe_sub.get("latest_invoice")

            print_val ={
                "customer_id": customer_id,
                "subscription_id": subscription_id,
                "price_id": price_id,
                "plan_name": plan_name,
                "current_period_start": current_period_start,
                "current_period_end": current_period_end,
                "email": email,
                "latest_invoice_id": order_id
            }

            print("Extracted values:", print_val)
            # Find user
            result = await db.execute(select(User).where(User.payment_customer_id == customer_id))
            user = result.scalar_one_or_none()
            if not user and email:
                result = await db.execute(select(User).where(User.email == email))
                user = result.scalar_one_or_none()
            # Reward coins
            
            coins = int(pricing.coin_reward or 0) if pricing else 0
            if user:
                # ensure customer's id stored on the user
                user.payment_customer_id = customer_id
                await db.commit()
                ## subscription entries are not created for one-time purchases like coins
                
                source_type = "subscription"
                # Try to find an existing subscription by Stripe subscription id (order_id)
                existing_res = await db.execute(select(Subscription).where(Subscription.payment_customer_id == customer_id))
                existing_sub = existing_res.scalar_one_or_none()

                if existing_sub:
                    # update existing subscription fields
                    existing_sub.user_id = user.id
                    existing_sub.subscription_id = subscription_id
                    existing_sub.order_id = order_id
                    existing_sub.price_id = price_id
                    existing_sub.plan_name = plan_name
                    existing_sub.status = "active"
                    existing_sub.current_period_end = current_period_end
                    existing_sub.last_rewarded_period_end = current_period_end
                    sub = existing_sub
                    await db.commit()
                else:
                    # create new subscription record
                    sub = Subscription(
                        user_id=user.id,
                        payment_customer_id=customer_id,
                        subscription_id=subscription_id,
                        order_id=order_id,
                        price_id=price_id,
                        plan_name=plan_name,
                        status="active",
                        current_period_end=current_period_end,
                        last_rewarded_period_end=current_period_end,
                        total_coins_rewarded=coins,
                    )
                    db.add(sub)
                    await db.commit()
                    
                # Create coin transaction (do not pass order_id field if DB doesn't have it)
                tx = CoinTransaction(
                    user_id=user.id,
                    subscription_id=subscription_id,
                    transaction_type='credit',
                    coins=coins,
                    source_type=source_type,
                    order_id=order_id,  # new field
                    period_start=current_period_start,
                    period_end=current_period_end
                )
                db.add(tx)
                await db.commit()
                # Update wallet
                wallet_res = await db.execute(select(UserWallet).where(UserWallet.user_id == user.id))
                wallet = wallet_res.scalars().first()
                if wallet:
                    wallet.coin_balance = (wallet.coin_balance or 0) + coins
                else:
                    wallet = UserWallet(user_id=user.id, coin_balance=coins)
                    db.add(wallet)
                await db.commit()
                #if session.get("total_details", {}).get("amount_discount"):
                    # Find pending redemption for this user
                res = await db.execute(
                    select(Order).where(
                        Order.user_id == user.id,
                        Order.stripe_customer_id == user.payment_customer_id,
                        Order.status == "pending"
                    )
                )
                order = res.scalars().first()
                print('order from db : ',  order)
                if order:
                    order.status = "success"
                    order.order_id = order_id
                    order.subscription_id = subscription_id
                    await db.commit()
                    promo_res = await db.execute(select(PromoManagement).where(PromoManagement.id == order.promo_id))
                    promo = promo_res.scalars().first()
                    if promo:
                        promo.applied_count += 1
                    await db.commit()

    # ✅ Renewal / Plan update /Cancellation/ Deletion
    elif event["type"] in ["customer.subscription.updated", "customer.subscription.deleted"]:
        sub_obj = event["data"]["object"]
        subscription_id = sub_obj["id"]
        status = sub_obj.get("status")
        # safe retrieval of timestamp fields; they may be missing for some events
        cpe_ts = sub_obj.get("current_period_end")
        cps_ts = sub_obj.get("current_period_start")
        current_period_end = datetime.fromtimestamp(cpe_ts) if cpe_ts else None
        current_period_start = datetime.fromtimestamp(cps_ts) if cps_ts else None
        price_id = sub_obj["items"]["data"][0]["price"]["id"] if sub_obj.get("items") and sub_obj["items"].get("data") else None
        plan_name = price.get("nickname")
        pricing = await get_pricing(price_id, db)
        if not plan_name and pricing:
            plan_name = pricing.plan_name
        order_id = stripe_sub.get("latest_invoice")
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
                sub.order_id = order_id
                sub.subscription_id = subscription_id
                sub.status = status
                sub.current_period_end = current_period_end
                sub.last_rewarded_period_end = current_period_end
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

                        # Renewal detection (ensure timestamps exist)
                        if old_period_end and current_period_end and current_period_end > old_period_end:
                            if not sub.last_rewarded_period_end or (current_period_end and current_period_end > sub.last_rewarded_period_end):
                                delta = new_coins
                                desc = "Subscription Renewal Reward"
                                sub.last_rewarded_period_end = current_period_end

                        # Mid-cycle upgrade/downgrade: only if both start and end timestamps exist
                        elif current_period_start and current_period_end:
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


@router.get("/status", response_model=SubscriptionStatusResponse)
async def get_subscription_status(request: Request, db: AsyncSession = Depends(get_db)):
    """
    Return current subscription status for the authenticated user.

    If the user cannot be resolved from the bearer token in Authorization header, return status=False.
    """
    # Extract bearer token from Authorization header (if any)
    auth_header = request.headers.get("authorization") or request.headers.get("Authorization")
    token = None
    if auth_header and isinstance(auth_header, str):
        parts = auth_header.split()
        if len(parts) == 2 and parts[0].lower() == "bearer":
            token = parts[1]

    # Try to resolve current user from token if provided
    user = None
    if token:
        try:
            from app.services.auth import AuthService

            user = await AuthService.get_user_from_token(token, db)
        except Exception:
            user = None

    if not user:
        # user not found -> return explicit false status
        return SubscriptionStatusResponse(status=False)

    result = await db.execute(
        select(Subscription)
        .where(Subscription.user_id == user.id)
        .order_by(Subscription.id.desc())
    )
    sub = result.scalars().first()
    if not sub:
        return SubscriptionStatusResponse(status=False)
    return SubscriptionStatusResponse(
        plan_name=sub.plan_name,
        status=sub.status,
        current_period_end=sub.current_period_end
    )
