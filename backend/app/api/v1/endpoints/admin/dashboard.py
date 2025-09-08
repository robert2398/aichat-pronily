from typing import Optional, List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import func, select, cast, Date, text

from app.api.v1.deps import get_db, require_admin
from app.models.subscription import (
    CoinTransaction, CoinPurchase, Subscription, Order, PromoManagement
)
from app.models.user import User
from app.models.character import Character

router = APIRouter()


def _date_range_defaults(start_date: Optional[str], end_date: Optional[str]):
    # pass-through; router endpoints handle optional strings and SQL filters
    return start_date, end_date


@router.get("/coins/purchases-summary", dependencies=[Depends(require_admin)])
async def coins_purchases_summary(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    interval: Optional[str] = Query(None),  # daily, weekly, monthly
    db: AsyncSession = Depends(get_db),
):
    """Aggregated coin purchase data."""
    # overall totals from coin_purchases table
    start_date, end_date = _date_range_defaults(start_date, end_date)

    q = select(func.count(CoinPurchase.id).label("total_purchase_transactions"), func.coalesce(func.sum(CoinPurchase.coin_reward), 0).label("total_coins_purchased"))
    if start_date:
        q = q.where(CoinPurchase.created_at >= start_date)
    if end_date:
        q = q.where(CoinPurchase.created_at <= end_date)

    result = await db.execute(q)
    totals = result.first() or (0, 0)

    response = {
        "start_date": start_date,
        "end_date": end_date,
        "total_purchase_transactions": int(totals[0] or 0),
        "total_coins_purchased": int(totals[1] or 0),
    }

    if interval:
        # simple daily/monthly bucketing using DATE(created_at) or strftime fallback
        if interval == "daily":
            period_expr = cast(func.date(CoinPurchase.created_at), Date)
            label = func.to_char(CoinPurchase.created_at, 'YYYY-MM-DD')
        elif interval == "monthly":
            label = func.to_char(CoinPurchase.created_at, 'YYYY-MM')
        else:
            label = func.to_char(CoinPurchase.created_at, 'IYYY-"W"IW')

        breakdown_q = select(label.label("date"), func.coalesce(func.sum(CoinPurchase.coin_reward), 0).label("coins_purchased"))
        if start_date:
            breakdown_q = breakdown_q.where(CoinPurchase.created_at >= start_date)
        if end_date:
            breakdown_q = breakdown_q.where(CoinPurchase.created_at <= end_date)
        breakdown_q = breakdown_q.group_by(label).order_by(label)

        rows = await db.execute(breakdown_q)
        breakdown = [{"date": r[0], "coins_purchased": int(r[1])} for r in rows]
        response["breakdown"] = breakdown

    return response


@router.get("/coins/usage-by-feature", dependencies=[Depends(require_admin)])
async def coins_usage_by_feature(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    feature: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """Coins spent by feature."""
    q = select(func.coalesce(func.sum(CoinTransaction.coins), 0)).label("total")
    # base total
    total_q = select(func.coalesce(func.sum(CoinTransaction.coins), 0).label("total_coins_spent"))
    if start_date:
        total_q = total_q.where(CoinTransaction.created_at >= start_date)
    if end_date:
        total_q = total_q.where(CoinTransaction.created_at <= end_date)
    if feature:
        total_q = total_q.where(CoinTransaction.source_type == feature)

    total_row = await db.execute(total_q)
    total_coins = int((total_row.scalar()) or 0)

    by_feature_q = select(CoinTransaction.source_type.label("feature"), func.coalesce(func.sum(CoinTransaction.coins), 0).label("coins_spent"))
    if start_date:
        by_feature_q = by_feature_q.where(CoinTransaction.created_at >= start_date)
    if end_date:
        by_feature_q = by_feature_q.where(CoinTransaction.created_at <= end_date)
    if feature:
        by_feature_q = by_feature_q.where(CoinTransaction.source_type == feature)
    by_feature_q = by_feature_q.group_by(CoinTransaction.source_type).order_by(func.sum(CoinTransaction.coins).desc())

    rows = await db.execute(by_feature_q)
    features = []
    for feat, coins in rows:
        coins_i = int(coins or 0)
        pct = round((coins_i / total_coins * 100), 2) if total_coins > 0 else 0.0
        features.append({"feature": feat, "coins_spent": coins_i, "percentage": pct})

    return {"start_date": start_date, "end_date": end_date, "total_coins_spent": total_coins, "by_feature": features}


@router.get("/subscriptions/plan-summary", dependencies=[Depends(require_admin)])
async def subscriptions_plan_summary(
    as_of_date: Optional[str] = Query(None),
    include_inactive: Optional[bool] = Query(False),
    db: AsyncSession = Depends(get_db),
):
    """Subscription counts and simple retention/churn snapshot by plan."""
    q = select(Subscription.plan_name, func.count(Subscription.id).label("active_subscribers"))
    if not include_inactive:
        q = q.where(Subscription.status == 'active')
    if as_of_date:
        # naive filter: subscriptions created before or equal to as_of_date
        q = q.where(Subscription.start_date <= as_of_date)

    q = q.group_by(Subscription.plan_name)
    rows = await db.execute(q)
    plans = []
    total_active = 0
    for plan_name, active_count in rows:
        plans.append({
            "plan_name": plan_name,
            "monthly_price": None,
            "active_subscribers": int(active_count or 0),
            "retention_rate": None,
            "churn_rate": None,
            "avg_subscription_duration": None,
        })
        total_active += int(active_count or 0)

    highest_retention_plan = None
    if plans:
        highest_retention_plan = plans[0]["plan_name"]

    return {"as_of_date": as_of_date, "total_active_subscribers": total_active, "plans": plans, "highest_retention_plan": highest_retention_plan}


@router.get("/subscriptions/history", dependencies=[Depends(require_admin)])
async def subscriptions_history(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    metric: Optional[str] = Query('active_count'),  # active_count, new_subscriptions, cancellations
    interval: Optional[str] = Query('monthly'),
    db: AsyncSession = Depends(get_db),
):
    """Historical subscription metrics over time."""
    # For simplicity implement monthly active_count and new_subscriptions
    if interval != 'monthly':
        # fallback to monthly for now
        interval = 'monthly'

    if metric == 'active_count':
        # Count subscriptions active at end of each month in period using a generate_series helper (Postgres)
        sql = text(
            '''
            SELECT to_char(date_trunc('month', months.generated_month), 'YYYY-MM') AS period,
                   count(s.*) AS value
            FROM (
                SELECT generate_series(:start_date::date, :end_date::date, interval '1 month') AS generated_month
            ) months
            LEFT JOIN subscriptions s
              ON date_trunc('month', s.start_date) <= months.generated_month
             AND (s.current_period_end IS NULL OR s.current_period_end >= months.generated_month)
            GROUP BY period
            ORDER BY period
            '''
        )
        params = {"start_date": start_date or '2024-01-01', "end_date": end_date or '2025-12-01'}
        rows = await db.execute(sql, params)
        history = [{"period": r[0], "value": int(r[1])} for r in rows]
        return {"metric": metric, "interval": interval, "history": history}

    # other metrics not implemented fully, return empty
    return {"metric": metric, "interval": interval, "history": []}


@router.get("/users/lifetime-value", dependencies=[Depends(require_admin)])
async def users_lifetime_value(
    user_id: Optional[int] = Query(None),
    detailed: Optional[bool] = Query(False),
    db: AsyncSession = Depends(get_db),
):
    """Compute simple lifetime value (sum of orders.price + coin purchases price)"""
    if user_id:
        # sum orders subtotal and coin_purchases price for the user
        orders_q = select(func.coalesce(func.sum(Order.subtotal_at_apply), 0)).where(Order.user_id == user_id)
        coin_q = select(func.coalesce(func.sum(CoinPurchase.price), 0)).where(CoinPurchase.id == CoinPurchase.id)
        orders_sum = await db.execute(orders_q)
        total_orders = float(orders_sum.scalar() or 0.0)
        # coin purchases not linked to user in this schema; approximate by querying orders that are coin purchases via discount_type or similar
        # fallback: 0 for coin purchase value by user
        total_coins_val = 0.0

        coins_acquired_q = select(func.coalesce(func.sum(CoinTransaction.coins), 0)).where(CoinTransaction.user_id == user_id)
        coins_spent_q = select(func.coalesce(func.sum(CoinTransaction.coins), 0)).where(CoinTransaction.user_id == user_id, CoinTransaction.transaction_type == 'debit')
        acquired = await db.execute(coins_acquired_q)
        spent = await db.execute(coins_spent_q)
        total_coins_acquired = int(acquired.scalar() or 0)
        total_coins_spent = int(spent.scalar() or 0)

        resp = {
            "user_id": user_id,
            "total_revenue": round(total_orders + total_coins_val, 2),
            "coins_purchase_value": round(total_coins_val, 2),
            "subscription_value": round(total_orders, 2),
            "total_coins_acquired": total_coins_acquired,
            "total_coins_spent": total_coins_spent,
            "lifetime_duration_months": None,
        }
        if detailed:
            resp["details"] = {}
        return resp

    # aggregate / average LTV across users
    total_rev_q = select(func.coalesce(func.sum(Order.subtotal_at_apply), 0))
    total_users_q = select(func.count(User.id))
    total_rev = float((await db.execute(total_rev_q)).scalar() or 0.0)
    total_users = int((await db.execute(total_users_q)).scalar() or 0)
    avg_ltv = round(total_rev / total_users, 2) if total_users > 0 else 0.0

    return {"average_ltv": avg_ltv, "total_revenue_all_users": round(total_rev, 2), "total_users": total_users}


@router.get("/revenue/trends", dependencies=[Depends(require_admin)])
async def revenue_trends(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    interval: Optional[str] = Query('monthly'),
    segment: Optional[str] = Query('all'),  # all, subscription, coins
    db: AsyncSession = Depends(get_db),
):
    """Revenue trends combining orders (subscription) and coin purchases."""
    # monthly aggregation from orders and coin_purchases
    # subscription revenue from orders.subtotal_at_apply when subscription_id is not null
    sub_q = select(func.to_char(Order.applied_at, 'YYYY-MM').label('period'), func.coalesce(func.sum(Order.subtotal_at_apply), 0).label('subscription_revenue')).where(Order.subscription_id != None)
    coin_q = select(func.to_char(Order.applied_at, 'YYYY-MM').label('period'), func.coalesce(func.sum(Order.subtotal_at_apply), 0).label('coin_revenue')).where(Order.subscription_id == None)

    if start_date:
        sub_q = sub_q.where(Order.applied_at >= start_date)
        coin_q = coin_q.where(Order.applied_at >= start_date)
    if end_date:
        sub_q = sub_q.where(Order.applied_at <= end_date)
        coin_q = coin_q.where(Order.applied_at <= end_date)

    sub_q = sub_q.group_by(text('period')).order_by(text('period'))
    coin_q = coin_q.group_by(text('period')).order_by(text('period'))

    sub_rows = await db.execute(sub_q)
    coin_rows = await db.execute(coin_q)

    sub_map = {r[0]: float(r[1] or 0.0) for r in sub_rows}
    coin_map = {r[0]: float(r[1] or 0.0) for r in coin_rows}

    periods = sorted(set(list(sub_map.keys()) + list(coin_map.keys())))
    trends = []
    total = 0.0
    for p in periods:
        s = sub_map.get(p, 0.0)
        c = coin_map.get(p, 0.0)
        t = round(s + c, 2)
        trends.append({"period": p, "subscription_revenue": round(s, 2), "coin_revenue": round(c, 2), "total_revenue": t})
        total += t

    avg_monthly = round(total / len(periods), 2) if periods else 0.0
    return {"currency": "USD", "interval": interval, "revenue_trends": trends, "total_revenue_all_periods": round(total, 2), "avg_monthly_revenue": avg_monthly}


@router.get("/coins/trends", dependencies=[Depends(require_admin)])
async def coins_trends(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    interval: Optional[str] = Query('weekly'),
    cohort: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """Coins purchased vs spent over time (simple weekly/monthly grouping)."""
    # use coin_transactions table for spent and purchases (transaction_type)
    period_label = func.to_char(CoinTransaction.created_at, 'IYYY-"W"IW') if interval == 'weekly' else func.to_char(CoinTransaction.created_at, 'YYYY-MM')
    q = select(period_label.label('period'), func.coalesce(func.sum(func.case([(CoinTransaction.transaction_type == 'credit', CoinTransaction.coins)], else_=0)), 0).label('coins_purchased'), func.coalesce(func.sum(func.case([(CoinTransaction.transaction_type == 'debit', CoinTransaction.coins)], else_=0)), 0).label('coins_spent'))
    if start_date:
        q = q.where(CoinTransaction.created_at >= start_date)
    if end_date:
        q = q.where(CoinTransaction.created_at <= end_date)
    if cohort:
        # no cohort mapping supported in schema; ignore
        pass
    q = q.group_by('period').order_by('period')
    rows = await db.execute(q)
    trends = []
    total_purchased = 0
    total_spent = 0
    for p, purchased, spent in rows:
        purchased_i = int(purchased or 0)
        spent_i = int(spent or 0)
        trends.append({"period": p, "coins_purchased": purchased_i, "coins_spent": spent_i})
        total_purchased += purchased_i
        total_spent += spent_i

    net = total_purchased - total_spent
    ratio = round((total_purchased / total_spent), 2) if total_spent > 0 else None

    return {"interval": interval, "coin_trends": trends, "net_coins_change": net, "purchase_to_spend_ratio": ratio}


@router.get("/users/top-spenders", dependencies=[Depends(require_admin)])
async def users_top_spenders(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    limit: int = Query(10),
    metric: str = Query('revenue'),
    plan: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """Top spending users by revenue or coins."""
    # For revenue, sum orders.subtotal_at_apply per user; for coins, sum coin transactions debit coins
    if metric == 'coins':
        q = select(CoinTransaction.user_id.label('user_id'), func.coalesce(func.sum(CoinTransaction.coins), 0).label('coins_spent')).where(CoinTransaction.transaction_type == 'debit')
        if start_date:
            q = q.where(CoinTransaction.created_at >= start_date)
        if end_date:
            q = q.where(CoinTransaction.created_at <= end_date)
        q = q.group_by(CoinTransaction.user_id).order_by(func.sum(CoinTransaction.coins).desc()).limit(limit)
        rows = await db.execute(q)
        users = []
        for uid, coins in rows:
            users.append({"user_id": int(uid), "coins_spent": int(coins or 0)})
        return {"start_date": start_date, "end_date": end_date, "metric": metric, "top_spenders": users}

    # revenue
    q = select(Order.user_id.label('user_id'), func.coalesce(func.sum(Order.subtotal_at_apply), 0).label('total_revenue'))
    if start_date:
        q = q.where(Order.applied_at >= start_date)
    if end_date:
        q = q.where(Order.applied_at <= end_date)
    if plan:
        # join to subscriptions to filter by plan
        q = q.join(Subscription, Subscription.user_id == Order.user_id).where(Subscription.plan_name == plan)
    q = q.group_by(Order.user_id).order_by(func.sum(Order.subtotal_at_apply).desc()).limit(limit)
    rows = await db.execute(q)
    top = []
    for uid, rev in rows:
        # get coins counts for user in window
        coins_q = select(func.coalesce(func.sum(CoinTransaction.coins), 0).label('coins')).where(CoinTransaction.user_id == uid)
        if start_date:
            coins_q = coins_q.where(CoinTransaction.created_at >= start_date)
        if end_date:
            coins_q = coins_q.where(CoinTransaction.created_at <= end_date)
        coins_val = int((await db.execute(coins_q)).scalar() or 0)
        top.append({"user_id": int(uid), "subscription_plan": None, "total_revenue": float(rev or 0.0), "coins_purchased": coins_val, "coins_spent": coins_val})

    return {"start_date": start_date, "end_date": end_date, "metric": metric, "top_spenders": top}


@router.get("/users/top-active", dependencies=[Depends(require_admin)])
async def users_top_active(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    limit: int = Query(10),
    metric: str = Query('coins_spent'),
    feature: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """Top active users by coins_spent or actions."""
    if metric == 'actions':
        # use count of coin transactions as proxy for actions
        q = select(CoinTransaction.user_id, func.count(CoinTransaction.id).label('total_actions'))
        if start_date:
            q = q.where(CoinTransaction.created_at >= start_date)
        if end_date:
            q = q.where(CoinTransaction.created_at <= end_date)
        if feature:
            q = q.where(CoinTransaction.source_type == feature)
        q = q.group_by(CoinTransaction.user_id).order_by(func.count(CoinTransaction.id).desc()).limit(limit)
        rows = await db.execute(q)
        out = []
        for uid, actions in rows:
            coins_q = select(func.coalesce(func.sum(CoinTransaction.coins), 0)).where(CoinTransaction.user_id == uid)
            coins_val = int((await db.execute(coins_q)).scalar() or 0)
            out.append({"user_id": int(uid), "total_actions": int(actions), "total_coins_spent": coins_val, "avg_coins_per_action": round(coins_val / int(actions) if actions else 0, 2)})
        return {"start_date": start_date, "end_date": end_date, "metric": metric, "top_active_users": out}

    # default coins_spent
    q = select(CoinTransaction.user_id, func.coalesce(func.sum(CoinTransaction.coins), 0).label('total_coins_spent')).where(CoinTransaction.transaction_type == 'debit')
    if start_date:
        q = q.where(CoinTransaction.created_at >= start_date)
    if end_date:
        q = q.where(CoinTransaction.created_at <= end_date)
    if feature:
        q = q.where(CoinTransaction.source_type == feature)
    q = q.group_by(CoinTransaction.user_id).order_by(func.sum(CoinTransaction.coins).desc()).limit(limit)
    rows = await db.execute(q)
    out = []
    for uid, coins in rows:
        actions_q = select(func.count(CoinTransaction.id)).where(CoinTransaction.user_id == uid)
        actions_val = int((await db.execute(actions_q)).scalar() or 0)
        out.append({"user_id": int(uid), "total_actions": actions_val, "total_coins_spent": int(coins or 0), "avg_coins_per_action": round(int(coins or 0) / actions_val if actions_val else 0, 2)})
    return {"start_date": start_date, "end_date": end_date, "metric": metric, "top_active_users": out}


@router.get("/engagement/feature-breakdown", dependencies=[Depends(require_admin)])
async def engagement_feature_breakdown(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    cohort: Optional[str] = Query(None),
    detail: Optional[bool] = Query(False),
    db: AsyncSession = Depends(get_db),
):
    """Engagement metrics by feature."""
    q = select(CoinTransaction.source_type.label('feature'), func.count(CoinTransaction.id).label('total_actions'), func.count(func.distinct(CoinTransaction.user_id)).label('unique_users'), func.coalesce(func.sum(CoinTransaction.coins), 0).label('coins_spent'))
    if start_date:
        q = q.where(CoinTransaction.created_at >= start_date)
    if end_date:
        q = q.where(CoinTransaction.created_at <= end_date)
    q = q.group_by(CoinTransaction.source_type).order_by(func.count(CoinTransaction.id).desc())
    rows = await db.execute(q)
    features = []
    for feat, actions, uniq, coins in rows:
        item = {"feature": feat, "total_actions": int(actions), "unique_users": int(uniq), "coins_spent": int(coins or 0)}
        if detail and uniq:
            item["avg_actions_per_user"] = round(int(actions) / int(uniq), 2)
            item["avg_coins_per_user"] = round(int(coins or 0) / int(uniq), 2)
        features.append(item)
    return {"start_date": start_date, "end_date": end_date, "feature_breakdown": features}


@router.get("/engagement/top-characters", dependencies=[Depends(require_admin)])
async def engagement_top_characters(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    limit: int = Query(10),
    metric: str = Query('coins_spent'),
    db: AsyncSession = Depends(get_db),
):
    """Top characters by coins spent or interactions."""
    # assume character interactions are recorded in CoinTransaction with source_type 'character' and order_id linking to media or character id in other tables is not present
    # try to join CharacterMedia or Character if possible; fallback: group by source_identifier in CoinTransaction if present
    # For simplicity, we will aggregate by order_id which may include character id in some setups; otherwise return empty
    ct = CoinTransaction
    q = select(ct.order_id.label('character_id'), func.coalesce(func.sum(ct.coins), 0).label('coins_spent'), func.count(ct.id).label('interactions'), func.count(func.distinct(ct.user_id)).label('unique_users')).where(ct.source_type == 'character')
    if start_date:
        q = q.where(ct.created_at >= start_date)
    if end_date:
        q = q.where(ct.created_at <= end_date)
    q = q.group_by(ct.order_id).order_by(func.sum(ct.coins).desc()).limit(limit)
    rows = await db.execute(q)
    out = []
    for char_id, coins, interactions, uniq in rows:
        out.append({"character_id": char_id, "character_name": None, "coins_spent": int(coins or 0), "interactions": int(interactions or 0), "unique_users": int(uniq or 0)})
    return {"start_date": start_date, "end_date": end_date, "metric": metric, "top_characters": out}


@router.get("/promotions/performance", dependencies=[Depends(require_admin)])
async def promotions_performance(
    promo_code: Optional[str] = Query(None),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    metric: Optional[str] = Query('revenue'),
    status: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """Promo performance metrics."""
    pm = PromoManagement
    q = select(pm.coupon.label('promo_code'), pm.promo_name, func.coalesce(func.count(Order.id), 0).label('times_redeemed'), func.coalesce(func.sum(func.case([(Order.subscription_id == None, 1)], else_=0)), 0).label('coin_purchase_count'), func.coalesce(func.sum(func.case([(Order.subscription_id != None, 1)], else_=0)), 0).label('subscription_count'), func.coalesce(func.sum(Order.discount_applied), 0).label('total_discount_given'), func.coalesce(func.sum(Order.subtotal_at_apply), 0).label('total_revenue_generated'))
    q = q.join(Order, Order.promo_id == pm.id)
    if promo_code:
        q = q.where(pm.coupon.ilike(f"%{promo_code}%"))
    if status:
        q = q.where(pm.status == status)
    if start_date:
        q = q.where(Order.applied_at >= start_date)
    if end_date:
        q = q.where(Order.applied_at <= end_date)
    q = q.group_by(pm.coupon, pm.promo_name)
    rows = await db.execute(q)
    res = []
    for promo_code, promo_name, times_redeemed, coin_purchase_count, subscription_count, total_discount_given, total_revenue_generated in rows:
        times = int(times_redeemed or 0)
        rev = float(total_revenue_generated or 0.0)
        avg_rev = round(rev / times, 2) if times > 0 else 0.0
        res.append({
            "promo_code": promo_code,
            "promo_name": promo_name,
            "times_redeemed": times,
            "coin_purchase_count": int(coin_purchase_count or 0),
            "subscription_count": int(subscription_count or 0),
            "total_discount_given": float(total_discount_given or 0.0),
            "total_revenue_generated": rev,
            "avg_revenue_per_use": avg_rev,
        })
    return {"start_date": start_date, "end_date": end_date, "promotions": res}


@router.get("/metrics/summary", dependencies=[Depends(require_admin)])
async def metrics_summary(
    as_of_date: Optional[str] = Query(None),
    interval: Optional[str] = Query('monthly'),
    cohort: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """High level SaaS KPIs: ARPU, MRR, churn, LTV, conversion."""
    # MRR approximate: sum of subscription orders in current month
    mrr_q = select(func.coalesce(func.sum(Order.subtotal_at_apply), 0)).where(Order.subscription_id != None)
    if as_of_date:
        mrr_q = mrr_q.where(func.to_char(Order.applied_at, 'YYYY-MM') == func.to_char(text(f"'{as_of_date}'::timestamp"), 'YYYY-MM'))
    mrr = float((await db.execute(mrr_q)).scalar() or 0.0)

    total_users = int((await db.execute(select(func.count(User.id)))).scalar() or 0)
    paying_users = int((await db.execute(select(func.count(func.distinct(Order.user_id))))).scalar() or 0)
    arpu = round(mrr / total_users, 2) if total_users > 0 else 0.0

    # churn naive: percent of subscriptions with status 'canceled' in last month / active_subscribers
    churn_q = select(func.count(Subscription.id)).where(Subscription.status == 'canceled')
    churn_count = int((await db.execute(churn_q)).scalar() or 0)
    active_subscribers = int((await db.execute(select(func.count(Subscription.id)).where(Subscription.status == 'active'))).scalar() or 0)
    churn_rate = round((churn_count / active_subscribers * 100), 2) if active_subscribers > 0 else 0.0

    ltv = round((arpu / (churn_rate / 100)) if churn_rate > 0 else 0.0, 2)

    conversion_rate = round((paying_users / total_users * 100), 2) if total_users > 0 else 0.0

    return {"as_of_date": as_of_date, "ARPU": arpu, "MRR": round(mrr, 2), "churn_rate": churn_rate, "LTV": ltv, "conversion_rate": conversion_rate, "active_subscribers": active_subscribers, "paying_users": paying_users, "total_users": total_users}
