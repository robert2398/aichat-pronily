from typing import Optional, List
from datetime import datetime, date, timedelta
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import func, select, cast, Date, text, case

from app.api.v1.deps import get_db, require_admin
from app.models.subscription import (
    CoinTransaction, CoinPurchase, Subscription, Order, PromoManagement, PricingPlan
)
from app.models.user import User
from app.models.character import Character

router = APIRouter()


def _date_range_defaults(start_date: Optional[str], end_date: Optional[str]):
    # pass-through; router endpoints handle optional strings and SQL filters
    return start_date, end_date


def _parse_datetime(s: Optional[str]):
    """Parse an ISO or YYYY-MM-DD date string into a datetime (or None)."""
    if not s:
        return None
    try:
        return datetime.fromisoformat(s.replace("Z", "+00:00"))
    except Exception:
        try:
            return datetime.strptime(s, "%Y-%m-%d")
        except Exception:
            return None


@router.get("/coins/purchases-summary", dependencies=[Depends(require_admin)])
async def coins_purchases_summary(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    interval: Optional[str] = Query(None),  # daily, weekly, monthly
    db: AsyncSession = Depends(get_db),
):
    """Aggregated coin purchase data."""
    # overall totals from coin_purchases table
    # keep the raw strings for returning in the response, but parse into
    # datetime objects so asyncpg receives proper timestamp/date params
    start_date_raw, end_date_raw = _date_range_defaults(start_date, end_date)

    def _parse_dt(s: Optional[str]):
        if not s:
            return None
        try:
            # accept YYYY-MM-DD or full ISO (with optional Z)
            return datetime.fromisoformat(s.replace("Z", "+00:00"))
        except Exception:
            try:
                return datetime.strptime(s, "%Y-%m-%d")
            except Exception:
                return None

    start_dt = _parse_dt(start_date_raw)
    end_dt = _parse_dt(end_date_raw)

    q = select(func.count(CoinPurchase.id).label("total_purchase_transactions"), func.coalesce(func.sum(CoinPurchase.coin_reward), 0).label("total_coins_purchased"))
    if start_dt:
        q = q.where(CoinPurchase.created_at >= start_dt)
    if end_dt:
        q = q.where(CoinPurchase.created_at <= end_dt)

    result = await db.execute(q)
    totals = result.first() or (0, 0)

    response = {
        "start_date": start_date_raw,
        "end_date": end_date_raw,
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
        if start_dt:
            breakdown_q = breakdown_q.where(CoinPurchase.created_at >= start_dt)
        if end_dt:
            breakdown_q = breakdown_q.where(CoinPurchase.created_at <= end_dt)
        breakdown_q = breakdown_q.group_by(label).order_by(label)

        rows = await db.execute(breakdown_q)
        breakdown = [{"date": r[0], "coins_purchased": int(r[1])} for r in rows]
        response["breakdown"] = breakdown

    return response


# @router.get("/coins/usage-by-feature", dependencies=[Depends(require_admin)])
# async def coins_usage_by_feature(
#     start_date: Optional[str] = Query(None),
#     end_date: Optional[str] = Query(None),
#     feature: Optional[str] = Query(None),
#     db: AsyncSession = Depends(get_db),
# ):
#     """Coins spent by feature."""
#     # parse date strings into datetimes for DB comparison
#     start_dt = _parse_datetime(start_date)
#     end_dt = _parse_datetime(end_date)

#     q = select(func.coalesce(func.sum(CoinTransaction.coins), 0)).label("total")
#     # base total
#     total_q = select(func.coalesce(func.sum(CoinTransaction.coins), 0).label("total_coins_spent"))
#     if start_dt:
#         total_q = total_q.where(CoinTransaction.created_at >= start_dt)
#     if end_dt:
#         total_q = total_q.where(CoinTransaction.created_at <= end_dt)
#     if feature:
#         total_q = total_q.where(CoinTransaction.source_type == feature)

#     total_row = await db.execute(total_q)
#     total_coins = int((total_row.scalar()) or 0)

#     by_feature_q = select(CoinTransaction.source_type.label("feature"), func.coalesce(func.sum(CoinTransaction.coins), 0).label("coins_spent"))
#     if start_dt:
#         by_feature_q = by_feature_q.where(CoinTransaction.created_at >= start_dt)
#     if end_dt:
#         by_feature_q = by_feature_q.where(CoinTransaction.created_at <= end_dt)
#     if feature:
#         by_feature_q = by_feature_q.where(CoinTransaction.source_type == feature)
#     by_feature_q = by_feature_q.group_by(CoinTransaction.source_type).order_by(func.sum(CoinTransaction.coins).desc())

#     rows = await db.execute(by_feature_q)
#     features = []
#     for feat, coins in rows:
#         coins_i = int(coins or 0)
#         pct = round((coins_i / total_coins * 100), 2) if total_coins > 0 else 0.0
#         features.append({"feature": feat, "coins_spent": coins_i, "percentage": pct})

#     return {"start_date": start_date, "end_date": end_date, "total_coins_spent": total_coins, "by_feature": features}

@router.get("/coins/usage-by-feature", dependencies=[Depends(require_admin)])
async def coins_usage_by_feature(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    feature: Optional[str] = Query(None),
    flow: Optional[str] = Query("spent"),  # 'spent' | 'credited' | 'both'
    db: AsyncSession = Depends(get_db),
):
    """
    Coins by feature, separated by flow (spent=debit, credited=credit).
    Default: spent (usage).
    """
    ct = CoinTransaction

    # parse dates (you already have _parse_datetime in your snippet)
    start_dt = _parse_datetime(start_date)
    end_dt = _parse_datetime(end_date)

    def base_where(q):
        if start_dt:
            q = q.where(ct.created_at >= start_dt)
        if end_dt:
            q = q.where(ct.created_at <= end_dt)
        if feature:
            q = q.where(ct.source_type == feature)
        return q

    # totals
    total_spent_q = base_where(select(func.coalesce(func.sum(ct.coins), 0))).where(ct.transaction_type == 'debit')
    total_credited_q = base_where(select(func.coalesce(func.sum(ct.coins), 0))).where(ct.transaction_type == 'credit')

    total_spent = int((await db.execute(total_spent_q)).scalar() or 0)
    total_credited = int((await db.execute(total_credited_q)).scalar() or 0)

    # by feature helpers
    async def by_feature(direction: str):
        dir_filter = ct.transaction_type == ('debit' if direction == 'spent' else 'credit')
        q = base_where(
            select(
                ct.source_type.label('feature'),
                func.coalesce(func.sum(ct.coins), 0).label('coins'),
                func.count(ct.id).label('transactions'),
            ).where(dir_filter)
        ).group_by(ct.source_type).order_by(func.sum(ct.coins).desc())
        rows = await db.execute(q)
        if direction == 'spent':
            denom = total_spent or 1
        else:
            denom = total_credited or 1
        out = []
        for feat, coins, tx in rows:
            c = int(coins or 0)
            pct = round(c / denom * 100, 2) if denom else 0.0
            out.append({"feature": feat, "coins": c, "transactions": int(tx), "share_pct": pct})
        return out

    if flow == 'both':
        by_spent = await by_feature('spent')
        by_credited = await by_feature('credited')

        # merge on feature to compute net (credited - spent)
        index = {}
        for row in by_spent:
            index[row["feature"]] = {"feature": row["feature"], "spent": row["coins"], "credited": 0}
        for row in by_credited:
            d = index.setdefault(row["feature"], {"feature": row["feature"], "spent": 0, "credited": 0})
            d["credited"] = row["coins"]

        combined = []
        for feat, vals in index.items():
            net = vals["credited"] - vals["spent"]
            # optional: separate shares for spent vs credited; net has no meaningful share
            combined.append({
                "feature": feat,
                "spent": vals["spent"],
                "credited": vals["credited"],
                "net": net,
            })

        return {
            "start_date": start_date, "end_date": end_date, "flow": "both",
            "totals": {"spent": total_spent, "credited": total_credited, "net": total_credited - total_spent},
            "by_feature": combined,
        }

    # single flow (default: spent)
    direction = 'debit' if flow == 'spent' else 'credit'
    items = await by_feature('spent' if flow == 'spent' else 'credited')
    total = total_spent if flow == 'spent' else total_credited

    return {
        "start_date": start_date,
        "end_date": end_date,
        "flow": flow,
        "total_coins": total,
        "by_feature": items,  # [{feature, coins, transactions, share_pct}]
    }



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
    # parse as_of_date into a datetime for window calculations
    as_of_dt = _parse_datetime(as_of_date)
    window_end = as_of_dt or datetime.utcnow()
    window_start = window_end - timedelta(days=30)

    for plan_name, active_count in rows:
        active_i = int(active_count or 0)

        # monthly price: prefer PricingPlan.price by plan_name
        monthly_price = None
        if plan_name is not None:
            price_row = await db.execute(select(PricingPlan.price).where(PricingPlan.plan_name == plan_name).limit(1))
            price_val = price_row.scalar()
            if price_val is not None:
                try:
                    monthly_price = float(price_val)
                except Exception:
                    monthly_price = None

        # churn in the last 30 days ending at window_end
        churn_q = select(func.count(Subscription.id)).where(
            Subscription.plan_name == plan_name,
            Subscription.status == 'canceled',
            Subscription.current_period_end != None,
            Subscription.current_period_end >= window_start,
            Subscription.current_period_end <= window_end,
        )
        churn_count = int((await db.execute(churn_q)).scalar() or 0)

        denom = active_i + churn_count
        churn_rate = round((churn_count / denom * 100), 2) if denom > 0 else 0.0
        retention_rate = round((100.0 - churn_rate), 2) if denom > 0 else 0.0

        # average subscription duration in months for this plan (use start_date -> current_period_end or window_end)
        avg_epoch_q = select(func.avg(func.extract('epoch', func.coalesce(Subscription.current_period_end, window_end) - Subscription.start_date))).where(
            Subscription.plan_name == plan_name,
            Subscription.start_date != None,
        )
        avg_seconds = (await db.execute(avg_epoch_q)).scalar()
        if avg_seconds:
            avg_months = round(float(avg_seconds) / (3600.0 * 24.0 * 30.436875), 2)
        else:
            avg_months = 0.0

        plans.append({
            "plan_name": plan_name,
            "monthly_price": round(monthly_price, 2) if monthly_price is not None else None,
            "active_subscribers": active_i,
            "retention_rate": retention_rate,
            "churn_rate": churn_rate,
            "avg_subscription_duration": avg_months,
        })
        total_active += active_i

    highest_retention_plan = None
    if plans:
        highest_retention_plan = plans[0]["plan_name"]

    return {"as_of_date": as_of_date, "total_active_subscribers": total_active, "plans": plans, "highest_retention_plan": highest_retention_plan}


@router.get("/subscriptions/history", dependencies=[Depends(require_admin)])
async def subscriptions_history(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    metric: Optional[str] = Query("active_count"),  # active_count, new_subscriptions, cancellations
    interval: Optional[str] = Query("monthly"),     # monthly | quarterly
    db: AsyncSession = Depends(get_db),
):
    """
    Historical subscription metrics over time.

    - metric=active_count        : number of active subscriptions at the END of each period
    - metric=new_subscriptions   : count of subscriptions that STARTED within each period
    - metric=cancellations       : count of subscriptions that ENDED within each period (status='canceled')
    - interval                   : 'monthly' (default) or 'quarterly'
    - start_date / end_date      : ISO date strings; defaults to last 12 months aligned to interval start
    """

    # ---- validate inputs ----
    metric = (metric or "active_count").lower()
    if metric not in {"active_count", "new_subscriptions", "cancellations"}:
        metric = "active_count"

    interval = (interval or "monthly").lower()
    if interval not in {"daily", "weekly", "monthly", "quarterly"}:
        interval = "monthly"

    # ---- parse & default dates ----
    def _to_date(s: Optional[str]) -> Optional[date]:
        if not s:
            return None
        try:
            # Accept 'YYYY-MM-DD' or full ISO; ignore time part
            return datetime.fromisoformat(s.replace("Z", "+00:00")).date()
        except Exception:
            return None

    start_dt = _to_date(start_date)
    end_dt = _to_date(end_date) or date.today()

    if not start_dt:
        # default: last 12 months from end_dt (inclusive)
        start_dt = end_dt - timedelta(days=365)

    # ---- align to period boundaries ----
    def _month_start(d: date) -> date:
        return d.replace(day=1)

    def _quarter_start(d: date) -> date:
        q_month = ((d.month - 1) // 3) * 3 + 1
        return date(d.year, q_month, 1)

    # support daily, weekly, monthly, quarterly
    if interval == "daily":
        # align to day boundaries
        start_dt = start_dt
        end_dt = end_dt
        step_sql = "interval '1 day'"
        label_sql = "to_char(p.period_start, 'YYYY-MM-DD')"
        trunc_unit = "day"
        period_add_sql = "interval '1 day'"
    elif interval == "weekly":
        # align to ISO week (period_start should be a date that represents week start)
        # use generate_series stepping by 1 week and label with ISO week
        # for alignment we keep start_dt as-is; label formatting uses ISO week
        start_dt = start_dt
        end_dt = end_dt
        step_sql = "interval '1 week'"
        label_sql = "to_char(p.period_start, 'IYYY-\"W\"IW')"
        trunc_unit = "week"
        period_add_sql = "interval '1 week'"
    elif interval == "monthly":
        start_dt = _month_start(start_dt)
        end_dt = _month_start(end_dt)
        step_sql = "interval '1 month'"
        label_sql = "to_char(p.period_start, 'YYYY-MM')"
        trunc_unit = "month"
        period_add_sql = "interval '1 month'"
    else:  # quarterly
        start_dt = _quarter_start(start_dt)
        end_dt = _quarter_start(end_dt)
        step_sql = "interval '3 month'"
        label_sql = "to_char(p.period_start, 'YYYY-\"Q\"Q')"
        trunc_unit = "quarter"
        period_add_sql = "interval '3 month'"

    # ---- SQL templates (Postgres) ----
    # We build a periods CTE with period_start and next_period_start (boundary moment).
    # Then left join to subscriptions with the metric-specific predicate.
    base_cte = f"""
            WITH periods AS (
                SELECT gs::date AS period_start,
                             (date_trunc('{trunc_unit}', gs)::date
                                + {period_add_sql}) AS next_period_start
                FROM generate_series(cast(:start_date as date), cast(:end_date as date), {step_sql}) AS gs
            )
    """

    if metric == "active_count":
        # Active at end of period = active at next_period_start instant
        sql = text(
            base_cte
            + f"""
            SELECT {label_sql} AS period,
                   COUNT(s.*) AS value
            FROM periods p
            LEFT JOIN subscriptions s
              ON s.start_date < p.next_period_start
             AND (s.current_period_end IS NULL OR s.current_period_end >= p.next_period_start)
            GROUP BY period
            ORDER BY period
            """
        )

    elif metric == "new_subscriptions":
        # Started within the period
        sql = text(
            base_cte
            + f"""
            SELECT {label_sql} AS period,
                   COUNT(s.*) AS value
            FROM periods p
            LEFT JOIN subscriptions s
              ON date_trunc('{trunc_unit}', s.start_date) = p.period_start
            GROUP BY period
            ORDER BY period
            """
        )

    else:  # cancellations
        # Ended within the period (status='canceled' and ended in that bucket)
        # If you have a dedicated `canceled_at`, prefer that column. We use current_period_end here.
        sql = text(
            base_cte
            + f"""
            SELECT {label_sql} AS period,
                   COUNT(s.*) AS value
            FROM periods p
            LEFT JOIN subscriptions s
              ON s.status = 'canceled'
             AND s.current_period_end IS NOT NULL
             AND date_trunc('{trunc_unit}', s.current_period_end) = p.period_start
            GROUP BY period
            ORDER BY period
            """
        )

    params = {"start_date": start_dt, "end_date": end_dt}
    rows = await db.execute(sql, params)
    history = [{"period": r[0], "value": int(r[1] or 0)} for r in rows]

    return {"metric": metric, "interval": interval, "history": history}

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
    """Revenue trends combining orders and coin purchases.

    Fixes:
    - Parse start_date/end_date strings into datetimes to avoid Postgres comparing
      timestamp columns against varchar parameters.
    - Support daily/monthly interval period formatting.
    """
    # choose period label based on interval (daily, weekly, monthly, quarterly)
    if interval == 'daily':
        period_expr = func.to_char(Order.applied_at, 'YYYY-MM-DD').label('period')
    elif interval == 'weekly':
        # ISO week label, e.g. 2025-W01
        period_expr = func.to_char(Order.applied_at, 'IYYY-"W"IW').label('period')
    elif interval == 'quarterly':
        # Quarter label, e.g. 2025-Q1
        period_expr = func.to_char(Order.applied_at, 'YYYY-"Q"Q').label('period')
    else:
        # default to monthly
        period_expr = func.to_char(Order.applied_at, 'YYYY-MM').label('period')

    # base queries
    sub_q = select(period_expr, func.coalesce(func.sum(Order.subtotal_at_apply), 0).label('subscription_revenue')).where(Order.subscription_id != None)
    coin_q = select(period_expr, func.coalesce(func.sum(Order.subtotal_at_apply), 0).label('coin_revenue')).where(Order.subscription_id == None)

    # parse ISO date strings into datetimes so SQLAlchemy/asyncpg send proper timestamp/date params
    start_dt = None
    end_dt = None
    try:
        if start_date:
            start_dt = datetime.fromisoformat(start_date)
        if end_date:
            end_dt = datetime.fromisoformat(end_date)
    except Exception:
        # leave as None; DB-side validation/empty results are acceptable
        start_dt = None
        end_dt = None

    if start_dt:
        sub_q = sub_q.where(Order.applied_at >= start_dt)
        coin_q = coin_q.where(Order.applied_at >= start_dt)
    if end_dt:
        sub_q = sub_q.where(Order.applied_at <= end_dt)
        coin_q = coin_q.where(Order.applied_at <= end_dt)

    sub_q = sub_q.group_by(period_expr).order_by(period_expr)
    coin_q = coin_q.group_by(period_expr).order_by(period_expr)

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
    # support daily | weekly | monthly | quarterly
    interval = (interval or 'weekly').lower()
    if interval == 'daily':
        period_label = func.to_char(CoinTransaction.created_at, 'YYYY-MM-DD')
    elif interval == 'weekly':
        period_label = func.to_char(CoinTransaction.created_at, 'IYYY-"W"IW')
    elif interval == 'quarterly':
        period_label = func.to_char(CoinTransaction.created_at, 'YYYY-"Q"Q')
    else:
        # default to monthly
        period_label = func.to_char(CoinTransaction.created_at, 'YYYY-MM')
    q = select(
        period_label.label('period'),
    func.coalesce(func.sum(case((CoinTransaction.transaction_type == 'credit', CoinTransaction.coins), else_=0)), 0).label('coins_purchased'),
    func.coalesce(func.sum(case((CoinTransaction.transaction_type == 'debit', CoinTransaction.coins), else_=0)), 0).label('coins_spent')
    )
    # parse date strings
    start_dt = _parse_datetime(start_date)
    end_dt = _parse_datetime(end_date)
    if start_dt:
        q = q.where(CoinTransaction.created_at >= start_dt)
    if end_dt:
        q = q.where(CoinTransaction.created_at <= end_dt)
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
    # parse dates
    start_dt = _parse_datetime(start_date)
    end_dt = _parse_datetime(end_date)

    if metric == 'coins':
        q = select(CoinTransaction.user_id.label('user_id'), func.coalesce(func.sum(CoinTransaction.coins), 0).label('coins_spent')).where(CoinTransaction.transaction_type == 'debit')
        if start_dt:
            q = q.where(CoinTransaction.created_at >= start_dt)
        if end_dt:
            q = q.where(CoinTransaction.created_at <= end_dt)
        q = q.group_by(CoinTransaction.user_id).order_by(func.sum(CoinTransaction.coins).desc()).limit(limit)
        rows = await db.execute(q)
        users = []
        for uid, coins in rows:
            users.append({"user_id": int(uid), "coins_spent": int(coins or 0)})
        return {"start_date": start_date, "end_date": end_date, "metric": metric, "top_spenders": users}

    # revenue
    q = select(Order.user_id.label('user_id'), func.coalesce(func.sum(Order.subtotal_at_apply), 0).label('total_revenue'))
    if start_dt:
        q = q.where(Order.applied_at >= start_dt)
    if end_dt:
        q = q.where(Order.applied_at <= end_dt)
    if plan:
        # join to subscriptions to filter by plan
        q = q.join(Subscription, Subscription.user_id == Order.user_id).where(Subscription.plan_name == plan)
    q = q.group_by(Order.user_id).order_by(func.sum(Order.subtotal_at_apply).desc()).limit(limit)
    rows = await db.execute(q)
    top = []
    for uid, rev in rows:
        # get coins counts for user in window
        coins_q = select(func.coalesce(func.sum(CoinTransaction.coins), 0).label('coins')).where(CoinTransaction.user_id == uid)
        if start_dt:
            coins_q = coins_q.where(CoinTransaction.created_at >= start_dt)
        if end_dt:
            coins_q = coins_q.where(CoinTransaction.created_at <= end_dt)
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
    start_dt = _parse_datetime(start_date)
    end_dt = _parse_datetime(end_date)

    if metric == 'actions':
        # use count of coin transactions as proxy for actions
        q = select(CoinTransaction.user_id, func.count(CoinTransaction.id).label('total_actions'))
        if start_dt:
            q = q.where(CoinTransaction.created_at >= start_dt)
        if end_dt:
            q = q.where(CoinTransaction.created_at <= end_dt)
        if feature:
            q = q.where(CoinTransaction.source_type == feature)
        q = q.group_by(CoinTransaction.user_id).order_by(func.count(CoinTransaction.id).desc()).limit(limit)
        rows = await db.execute(q)
        out = []
        for uid, actions in rows:
            coins_q = select(func.coalesce(func.sum(CoinTransaction.coins), 0)).where(CoinTransaction.user_id == uid)
            if start_dt:
                coins_q = coins_q.where(CoinTransaction.created_at >= start_dt)
            if end_dt:
                coins_q = coins_q.where(CoinTransaction.created_at <= end_dt)
            coins_val = int((await db.execute(coins_q)).scalar() or 0)
            # determine most used feature for this user (by action count) within the same time window
            feat_q = select(CoinTransaction.source_type, func.count(CoinTransaction.id).label('cnt')).where(CoinTransaction.user_id == uid)
            if start_dt:
                feat_q = feat_q.where(CoinTransaction.created_at >= start_dt)
            if end_dt:
                feat_q = feat_q.where(CoinTransaction.created_at <= end_dt)
            feat_q = feat_q.group_by(CoinTransaction.source_type).order_by(func.count(CoinTransaction.id).desc()).limit(1)
            feat_row = await db.execute(feat_q)
            most_used = None
            first = feat_row.first()
            if first:
                most_used = first[0]
            # determine most spent feature (by coins) for this user within the same window
            spent_feat_q = select(CoinTransaction.source_type, func.coalesce(func.sum(CoinTransaction.coins), 0).label('coins')).where(CoinTransaction.user_id == uid, CoinTransaction.transaction_type == 'debit')
            if start_dt:
                spent_feat_q = spent_feat_q.where(CoinTransaction.created_at >= start_dt)
            if end_dt:
                spent_feat_q = spent_feat_q.where(CoinTransaction.created_at <= end_dt)
            spent_feat_q = spent_feat_q.group_by(CoinTransaction.source_type).order_by(func.sum(CoinTransaction.coins).desc()).limit(1)
            spent_row = await db.execute(spent_feat_q)
            most_spent_feature = None
            most_spent_feature_coins = 0
            sr = spent_row.first()
            if sr:
                most_spent_feature = sr[0]
                try:
                    most_spent_feature_coins = int(sr[1] or 0)
                except Exception:
                    most_spent_feature_coins = int(sr[1]) if sr[1] is not None else 0

            out.append({"user_id": int(uid), "total_actions": int(actions), "total_coins_spent": coins_val, "avg_coins_per_action": round(coins_val / int(actions) if actions else 0, 2), "most_used_feature": most_used, "most_spent_feature": most_spent_feature, "most_spent_feature_coins": most_spent_feature_coins})
        return {"start_date": start_date, "end_date": end_date, "metric": metric, "top_active_users": out}

    # default coins_spent
    q = select(CoinTransaction.user_id, func.coalesce(func.sum(CoinTransaction.coins), 0).label('total_coins_spent')).where(CoinTransaction.transaction_type == 'debit')
    if start_dt:
        q = q.where(CoinTransaction.created_at >= start_dt)
    if end_dt:
        q = q.where(CoinTransaction.created_at <= end_dt)
    if feature:
        q = q.where(CoinTransaction.source_type == feature)
    q = q.group_by(CoinTransaction.user_id).order_by(func.sum(CoinTransaction.coins).desc()).limit(limit)
    rows = await db.execute(q)
    out = []
    for uid, coins in rows:
        actions_q = select(func.count(CoinTransaction.id)).where(CoinTransaction.user_id == uid)
        if start_dt:
            actions_q = actions_q.where(CoinTransaction.created_at >= start_dt)
        if end_dt:
            actions_q = actions_q.where(CoinTransaction.created_at <= end_dt)
        actions_val = int((await db.execute(actions_q)).scalar() or 0)
        # determine most used feature for this user (by action count) within the same time window
        feat_q = select(CoinTransaction.source_type, func.count(CoinTransaction.id).label('cnt')).where(CoinTransaction.user_id == uid)
        if start_dt:
            feat_q = feat_q.where(CoinTransaction.created_at >= start_dt)
        if end_dt:
            feat_q = feat_q.where(CoinTransaction.created_at <= end_dt)
        feat_q = feat_q.group_by(CoinTransaction.source_type).order_by(func.count(CoinTransaction.id).desc()).limit(1)
        feat_row = await db.execute(feat_q)
        most_used = None
        first = feat_row.first()
        if first:
            most_used = first[0]

        # determine most spent feature (by coins) for this user within the same window
        spent_feat_q = select(CoinTransaction.source_type, func.coalesce(func.sum(CoinTransaction.coins), 0).label('coins')).where(CoinTransaction.user_id == uid, CoinTransaction.transaction_type == 'debit')
        if start_dt:
            spent_feat_q = spent_feat_q.where(CoinTransaction.created_at >= start_dt)
        if end_dt:
            spent_feat_q = spent_feat_q.where(CoinTransaction.created_at <= end_dt)
        spent_feat_q = spent_feat_q.group_by(CoinTransaction.source_type).order_by(func.sum(CoinTransaction.coins).desc()).limit(1)
        spent_row = await db.execute(spent_feat_q)
        most_spent_feature = None
        most_spent_feature_coins = 0
        sr = spent_row.first()
        if sr:
            most_spent_feature = sr[0]
            try:
                most_spent_feature_coins = int(sr[1] or 0)
            except Exception:
                most_spent_feature_coins = int(sr[1]) if sr[1] is not None else 0

        out.append({"user_id": int(uid), "total_actions": actions_val, "total_coins_spent": int(coins or 0), "avg_coins_per_action": round(int(coins or 0) / actions_val if actions_val else 0, 2), "most_used_feature": most_used, "most_spent_feature": most_spent_feature, "most_spent_feature_coins": most_spent_feature_coins})
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
    start_dt = _parse_datetime(start_date)
    end_dt = _parse_datetime(end_date)

    q = select(CoinTransaction.source_type.label('feature'), func.count(CoinTransaction.id).label('total_actions'), func.count(func.distinct(CoinTransaction.user_id)).label('unique_users'), func.coalesce(func.sum(CoinTransaction.coins), 0).label('coins_spent'))
    if start_dt:
        q = q.where(CoinTransaction.created_at >= start_dt)
    if end_dt:
        q = q.where(CoinTransaction.created_at <= end_dt)
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
    start_dt = _parse_datetime(start_date)
    end_dt = _parse_datetime(end_date)

    ct = CoinTransaction
    q = select(ct.order_id.label('character_id'), func.coalesce(func.sum(ct.coins), 0).label('coins_spent'), func.count(ct.id).label('interactions'), func.count(func.distinct(ct.user_id)).label('unique_users')).where(ct.source_type == 'character')
    if start_dt:
        q = q.where(ct.created_at >= start_dt)
    if end_dt:
        q = q.where(ct.created_at <= end_dt)
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
    q = select(
        pm.coupon.label('promo_code'),
        pm.promo_name,
        func.coalesce(func.count(Order.id), 0).label('times_redeemed'),
    func.coalesce(func.sum(case((Order.subscription_id == None, 1), else_=0)), 0).label('coin_purchase_count'),
    func.coalesce(func.sum(case((Order.subscription_id != None, 1), else_=0)), 0).label('subscription_count'),
        func.coalesce(func.sum(Order.discount_applied), 0).label('total_discount_given'),
        func.coalesce(func.sum(Order.subtotal_at_apply), 0).label('total_revenue_generated'),
    )
    q = q.join(Order, Order.promo_id == pm.id)
    start_dt = _parse_datetime(start_date)
    end_dt = _parse_datetime(end_date)

    if promo_code:
        q = q.where(pm.coupon.ilike(f"%{promo_code}%"))
    if status:
        q = q.where(pm.status == status)
    if start_dt:
        q = q.where(Order.applied_at >= start_dt)
    if end_dt:
        q = q.where(Order.applied_at <= end_dt)
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
