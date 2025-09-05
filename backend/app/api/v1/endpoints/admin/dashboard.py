from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func, and_, or_, case, distinct
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta, date
from collections import defaultdict

from app.api.v1.deps import get_db, require_admin
from app.models.user import User
from app.models.subscription import Subscription, PricingPlan
from app.models.chat import ChatMessage
from app.models.character import Character  #, GenderEnum
from app.models.usage_metrics import UsageMetrics

router = APIRouter()

# Helper function to parse date range
def parse_date_range(date_range: str) -> tuple[datetime, datetime]:
    """Parse date range string into start and end dates"""
    now = datetime.now()
    
    if date_range == "7d":
        start_date = now - timedelta(days=7)
    elif date_range == "30d":
        start_date = now - timedelta(days=30)
    elif date_range == "90d":
        start_date = now - timedelta(days=90)
    elif date_range == "1y":
        start_date = now - timedelta(days=365)
    else:
        start_date = now - timedelta(days=30)  # default to 30 days
    
    return start_date, now

def parse_date_params(date_range: Optional[str] = None, from_date: Optional[str] = None, to_date: Optional[str] = None) -> tuple[datetime, datetime]:
    """Parse date parameters - supports both date_range and from/to parameters"""
    if from_date and to_date:
        try:
            start_date = datetime.fromisoformat(from_date.replace('Z', '+00:00'))
            end_date = datetime.fromisoformat(to_date.replace('Z', '+00:00'))
            return start_date, end_date
        except ValueError:
            pass
    
    # Fallback to date_range parsing
    return parse_date_range(date_range or "30d")

# KPIs endpoint
@router.get("/analytics/kpis", dependencies=[Depends(require_admin)])
async def get_kpis(
    date_range: Optional[str] = Query(None, description="Date range: 7d, 30d, 90d, 1y"),
    from_date: Optional[str] = Query(None, alias="from", description="Start date (ISO format)"),
    to_date: Optional[str] = Query(None, alias="to", description="End date (ISO format)"),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """Get key performance indicators"""
    start_date, end_date = parse_date_params(date_range, from_date, to_date)
    
    # Active users (users with messages in the date range)
    active_users_result = await db.execute(
        select(func.count(distinct(ChatMessage.user_id)))
        .where(ChatMessage.created_at >= start_date)
        .where(ChatMessage.created_at <= end_date)
    )
    active_users = active_users_result.scalar() or 0
    
    # New users (registered in the date range)
    new_users_result = await db.execute(
        select(func.count(User.id))
        .where(User.created_at >= start_date)
        .where(User.created_at <= end_date)
    )
    new_users = new_users_result.scalar() or 0
    
    # MRR calculation
    active_subs_result = await db.execute(
        select(func.sum(PricingPlan.price))
        .join(Subscription, PricingPlan.plan_name == Subscription.plan_name)
        .where(Subscription.status == 'active')
        .where(or_(
            PricingPlan.billing_cycle == 'monthly',
            PricingPlan.billing_cycle == 'yearly'
        ))
    )
    total_revenue = active_subs_result.scalar() or 0
    
    # Convert yearly to monthly for MRR
    yearly_subs_result = await db.execute(
        select(func.sum(PricingPlan.price))
        .join(Subscription, PricingPlan.plan_name == Subscription.plan_name)
        .where(Subscription.status == 'active')
        .where(PricingPlan.billing_cycle == 'yearly')
    )
    yearly_revenue = yearly_subs_result.scalar() or 0
    mrr = total_revenue - yearly_revenue + (yearly_revenue / 12) if yearly_revenue else total_revenue
    
    # Churn rate (cancelled subscriptions in period)
    total_subs_result = await db.execute(select(func.count(Subscription.id)).where(Subscription.status == 'active'))
    total_subs = total_subs_result.scalar() or 0
    
    churned_subs_result = await db.execute(
        select(func.count(Subscription.id))
        .where(Subscription.status == 'canceled')
        .where(Subscription.updated_at >= start_date)
        .where(Subscription.updated_at <= end_date)
    )
    churned_subs = churned_subs_result.scalar() or 0
    churn_rate_pct = (churned_subs / total_subs * 100) if total_subs > 0 else 0
    
    # Average messages per session
    total_messages_result = await db.execute(
        select(func.count(ChatMessage.id))
        .where(ChatMessage.created_at >= start_date)
        .where(ChatMessage.created_at <= end_date)
    )
    total_messages = total_messages_result.scalar() or 0
    
    total_sessions_result = await db.execute(
        select(func.count(distinct(ChatMessage.session_id)))
        .where(ChatMessage.created_at >= start_date)
        .where(ChatMessage.created_at <= end_date)
    )
    total_sessions = total_sessions_result.scalar() or 0
    avg_messages_per_session = total_messages / total_sessions if total_sessions > 0 else 0
    
    return {
        "activeUsers": active_users,
        "newUsers": new_users,
        "mrr": float(mrr) if mrr else 0.0,
        "churnRatePct": float(churn_rate_pct),
        "avgMessagesPerSession": float(avg_messages_per_session)
    }

# Users series endpoint
@router.get("/users/timeseries", dependencies=[Depends(require_admin)])
async def get_users_series(
    date_range: Optional[str] = Query(None, description="Date range: 7d, 30d, 90d, 1y"),
    from_date: Optional[str] = Query(None, alias="from", description="Start date (ISO format)"),
    to_date: Optional[str] = Query(None, alias="to", description="End date (ISO format)"),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """Get users time series data"""
    start_date, end_date = parse_date_params(date_range, from_date, to_date)
    
    # Get daily new users
    new_users_result = await db.execute(
        select(
            func.date(User.created_at).label('date'),
            func.count(User.id).label('newUsers')
        )
        .where(User.created_at >= start_date)
        .where(User.created_at <= end_date)
        .group_by(func.date(User.created_at))
        .order_by(func.date(User.created_at))
    )
    
    # Get daily active users
    active_users_result = await db.execute(
        select(
            func.date(ChatMessage.created_at).label('date'),
            func.count(distinct(ChatMessage.user_id)).label('activeUsers')
        )
        .where(ChatMessage.created_at >= start_date)
        .where(ChatMessage.created_at <= end_date)
        .group_by(func.date(ChatMessage.created_at))
        .order_by(func.date(ChatMessage.created_at))
    )
    
    new_users_data = {str(row.date): row.newUsers for row in new_users_result.fetchall()}
    active_users_data = {str(row.date): row.activeUsers for row in active_users_result.fetchall()}
    
    # Combine data for all dates in range
    series = []
    current_date = start_date.date()
    end_date_only = end_date.date()
    
    while current_date <= end_date_only:
        date_str = str(current_date)
        series.append({
            "date": date_str,
            "newUsers": new_users_data.get(date_str, 0),
            "activeUsers": active_users_data.get(date_str, 0)
        })
        current_date += timedelta(days=1)
    
    return {"series": series}

# Messages series endpoint
@router.get("/engagement/messages-timeseries", dependencies=[Depends(require_admin)])
async def get_messages_series(
    date_range: Optional[str] = Query(None, description="Date range: 7d, 30d, 90d, 1y"),
    from_date: Optional[str] = Query(None, alias="from", description="Start date (ISO format)"),
    to_date: Optional[str] = Query(None, alias="to", description="End date (ISO format)"),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """Get messages time series data"""
    start_date, end_date = parse_date_params(date_range, from_date, to_date)
    
    result = await db.execute(
        select(
            func.date(ChatMessage.created_at).label('date'),
            func.count(ChatMessage.id).label('messages')
        )
        .where(ChatMessage.created_at >= start_date)
        .where(ChatMessage.created_at <= end_date)
        .group_by(func.date(ChatMessage.created_at))
        .order_by(func.date(ChatMessage.created_at))
    )
    
    data = {str(row.date): row.messages for row in result.fetchall()}
    
    # Fill in missing dates with 0
    series = []
    current_date = start_date.date()
    end_date_only = end_date.date()
    
    while current_date <= end_date_only:
        date_str = str(current_date)
        series.append({
            "date": date_str,
            "messages": data.get(date_str, 0)
        })
        current_date += timedelta(days=1)
    
    return {"series": series}

# Subscriptions overview endpoint
@router.get("/subscriptions/overview", dependencies=[Depends(require_admin)])
async def get_subscriptions_overview(
    date_range: str = Query("30d", description="Date range: 7d, 30d, 90d, 1y"),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """Get subscriptions overview"""
    start_date, end_date = parse_date_range(date_range)
    
    # Active subscriptions
    active_result = await db.execute(
        select(func.count(Subscription.id))
        .where(Subscription.status == 'active')
    )
    active = active_result.scalar() or 0
    
    # New subscriptions in range
    new_in_range_result = await db.execute(
        select(func.count(Subscription.id))
        .where(Subscription.created_at >= start_date)
        .where(Subscription.created_at <= end_date)
    )
    new_in_range = new_in_range_result.scalar() or 0
    
    # Churned subscriptions in range
    churned_in_range_result = await db.execute(
        select(func.count(Subscription.id))
        .where(Subscription.status == 'canceled')
        .where(Subscription.updated_at >= start_date)
        .where(Subscription.updated_at <= end_date)
    )
    churned_in_range = churned_in_range_result.scalar() or 0
    
    # Plan distribution
    plan_dist_result = await db.execute(
        select(
            Subscription.plan_name,
            func.count(Subscription.id).label('count')
        )
        .where(Subscription.status == 'active')
        .group_by(Subscription.plan_name)
    )
    plan_distribution = [{"plan_name": row.plan_name or "unknown", "count": row.count} for row in plan_dist_result.fetchall()]
    
    # MRR and ARR calculation
    mrr_result = await db.execute(
        select(func.sum(PricingPlan.price))
        .join(Subscription, PricingPlan.plan_name == Subscription.plan_name)
        .where(Subscription.status == 'active')
        .where(PricingPlan.billing_cycle == 'monthly')
    )
    monthly_revenue = mrr_result.scalar() or 0
    
    arr_result = await db.execute(
        select(func.sum(PricingPlan.price))
        .join(Subscription, PricingPlan.plan_name == Subscription.plan_name)
        .where(Subscription.status == 'active')
        .where(PricingPlan.billing_cycle == 'yearly')
    )
    yearly_revenue = arr_result.scalar() or 0
    
    mrr = float(monthly_revenue + (yearly_revenue / 12))
    arr = float(yearly_revenue + (monthly_revenue * 12))
    
    return {
        "active": active,
        "newInRange": new_in_range,
        "churnedInRange": churned_in_range,
        "planDistribution": plan_distribution,
        "mrr": mrr,
        "arr": arr
    }

# Subscriptions series endpoint
@router.get("/subscriptions/timeseries", dependencies=[Depends(require_admin)])
async def get_subscriptions_series(
    date_range: str = Query("30d", description="Date range: 7d, 30d, 90d, 1y"),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """Get subscriptions time series data"""
    start_date, end_date = parse_date_range(date_range)
    
    # New subscriptions by date
    new_subs_result = await db.execute(
        select(
            func.date(Subscription.created_at).label('date'),
            func.count(Subscription.id).label('new')
        )
        .where(Subscription.created_at >= start_date)
        .where(Subscription.created_at <= end_date)
        .group_by(func.date(Subscription.created_at))
        .order_by(func.date(Subscription.created_at))
    )
    
    # Churned subscriptions by date
    churned_subs_result = await db.execute(
        select(
            func.date(Subscription.updated_at).label('date'),
            func.count(Subscription.id).label('churned')
        )
        .where(Subscription.status == 'canceled')
        .where(Subscription.updated_at >= start_date)
        .where(Subscription.updated_at <= end_date)
        .group_by(func.date(Subscription.updated_at))
        .order_by(func.date(Subscription.updated_at))
    )
    
    new_data = {str(row.date): row.new for row in new_subs_result.fetchall()}
    churned_data = {str(row.date): row.churned for row in churned_subs_result.fetchall()}
    
    # Fill in missing dates
    series = []
    current_date = start_date.date()
    end_date_only = end_date.date()
    
    while current_date <= end_date_only:
        date_str = str(current_date)
        series.append({
            "date": date_str,
            "new": new_data.get(date_str, 0),
            "churned": churned_data.get(date_str, 0)
        })
        current_date += timedelta(days=1)
    
    return {"series": series}

# Revenue series endpoint
@router.get("/revenue/timeseries", dependencies=[Depends(require_admin)])
async def get_revenue_series(
    date_range: str = Query("30d", description="Date range: 7d, 30d, 90d, 1y"),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """Get revenue time series data"""
    start_date, end_date = parse_date_range(date_range)
    
    # For simplicity, we'll calculate MRR based on active subscriptions at each point in time
    # In practice, you'd want more sophisticated revenue tracking
    result = await db.execute(
        select(
            func.date(Subscription.created_at).label('date'),
            func.sum(PricingPlan.price).label('revenue')
        )
        .join(PricingPlan, PricingPlan.plan_name == Subscription.plan_name)
        .where(Subscription.created_at >= start_date)
        .where(Subscription.created_at <= end_date)
        .where(Subscription.status == 'active')
        .group_by(func.date(Subscription.created_at))
        .order_by(func.date(Subscription.created_at))
    )
    
    data = {str(row.date): float(row.revenue or 0) for row in result.fetchall()}
    
    # Fill in missing dates
    series = []
    current_date = start_date.date()
    end_date_only = end_date.date()
    
    while current_date <= end_date_only:
        date_str = str(current_date)
        series.append({
            "date": date_str,
            "mrr": data.get(date_str, 0.0)
        })
        current_date += timedelta(days=1)
    
    return {"series": series}

# Session length endpoint
@router.get("/engagement/session-length", dependencies=[Depends(require_admin)])
async def get_session_length(
    date_range: str = Query("30d", description="Date range: 7d, 30d, 90d, 1y"),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """Get session length statistics"""
    start_date, end_date = parse_date_range(date_range)
    
    # Get session durations (simplified - based on message count per session)
    result = await db.execute(
        select(
            ChatMessage.session_id,
            func.count(ChatMessage.id).label('message_count'),
            func.max(ChatMessage.created_at).label('end_time'),
            func.min(ChatMessage.created_at).label('start_time')
        )
        .where(ChatMessage.created_at >= start_date)
        .where(ChatMessage.created_at <= end_date)
        .group_by(ChatMessage.session_id)
    )
    
    durations = []
    for row in result.fetchall():
        if row.end_time and row.start_time:
            duration_minutes = (row.end_time - row.start_time).total_seconds() / 60
            durations.append(duration_minutes)
    
    if not durations:
        return {"avg": 0.0, "p50": 0.0, "p90": 0.0}
    
    durations.sort()
    avg = sum(durations) / len(durations)
    p50 = durations[int(len(durations) * 0.5)]
    p90 = durations[int(len(durations) * 0.9)]
    
    return {
        "avg": float(avg),
        "p50": float(p50),
        "p90": float(p90)
    }

# Role ratio endpoint
@router.get("/engagement/role-ratio", dependencies=[Depends(require_admin)])
async def get_role_ratio(
    date_range: str = Query("30d", description="Date range: 7d, 30d, 90d, 1y"),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """Get message role distribution"""
    start_date, end_date = parse_date_range(date_range)
    
    result = await db.execute(
        select(
            ChatMessage.role,
            func.count(ChatMessage.id).label('count')
        )
        .where(ChatMessage.created_at >= start_date)
        .where(ChatMessage.created_at <= end_date)
        .group_by(ChatMessage.role)
    )
    
    role_counts = {row.role: row.count for row in result.fetchall()}
    total = sum(role_counts.values())
    
    if total == 0:
        return {"user": 0, "assistant": 0}
    
    return {
        "user": role_counts.get("user", 0),
        "assistant": role_counts.get("assistant", 0)
    }

# Characters summary endpoint
@router.get("/characters/summary", dependencies=[Depends(require_admin)])
async def get_characters_summary(
    date_range: str = Query("30d", description="Date range: 7d, 30d, 90d, 1y"),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """Get characters usage summary"""
    start_date, end_date = parse_date_range(date_range)
    
    # Total characters used
    total_chars_result = await db.execute(
        select(func.count(distinct(ChatMessage.character_id)))
        .where(ChatMessage.created_at >= start_date)
        .where(ChatMessage.created_at <= end_date)
    )
    total_characters = total_chars_result.scalar() or 0
    
    # Average characters per user
    users_with_chars_result = await db.execute(
        select(func.count(distinct(ChatMessage.user_id)))
        .where(ChatMessage.created_at >= start_date)
        .where(ChatMessage.created_at <= end_date)
    )
    users_with_chars = users_with_chars_result.scalar() or 1
    avg_per_user = total_characters / users_with_chars if users_with_chars > 0 else 0
    
    # By gender
    gender_result = await db.execute(
        select(
            Character.gender,
            func.count(distinct(ChatMessage.character_id)).label('count')
        )
        .join(ChatMessage, Character.id == ChatMessage.character_id)
        .where(ChatMessage.created_at >= start_date)
        .where(ChatMessage.created_at <= end_date)
        .group_by(Character.gender)
    )
    by_gender = [{"gender": str(row.gender), "count": row.count} for row in gender_result.fetchall()]
    
    # Top styles
    styles_result = await db.execute(
        select(
            Character.style,
            func.count(distinct(ChatMessage.character_id)).label('count')
        )
        .join(ChatMessage, Character.id == ChatMessage.character_id)
        .where(ChatMessage.created_at >= start_date)
        .where(ChatMessage.created_at <= end_date)
        .where(Character.style.isnot(None))
        .group_by(Character.style)
        .order_by(func.count(distinct(ChatMessage.character_id)).desc())
        .limit(10)
    )
    top_styles = [{"style": row.style or "unknown", "count": row.count} for row in styles_result.fetchall()]
    
    # By country - column removed from Character; return empty list to preserve response shape
    by_country = []
    
    return {
        "totalCharacters": total_characters,
        "avgPerUser": float(avg_per_user),
        "byGender": by_gender,
        "topStyles": top_styles,
        "byCountry": by_country
    }

# Media usage endpoint
@router.get("/media/usage", dependencies=[Depends(require_admin)])
async def get_media_usage(
    date_range: Optional[str] = Query(None, description="Date range: 7d, 30d, 90d, 1y"),
    from_date: Optional[str] = Query(None, alias="from", description="Start date (ISO format)"),
    to_date: Optional[str] = Query(None, alias="to", description="End date (ISO format)"),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """Get media usage statistics"""
    start_date, end_date = parse_date_params(date_range, from_date, to_date)
    
    # Character images (characters with image_url_s3 set)
    char_images_result = await db.execute(
        select(func.count(distinct(Character.id)))
        .where(Character.image_url_s3.isnot(None))
        .where(Character.created_at >= start_date)
        .where(Character.created_at <= end_date)
    )
    character_images = char_images_result.scalar() or 0
    
    # Voice messages
    voice_input_result = await db.execute(
        select(func.count(ChatMessage.id))
        .where(ChatMessage.created_at >= start_date)
        .where(ChatMessage.created_at <= end_date)
        .where(ChatMessage.audio_url_user.isnot(None))
    )
    voice_input_count = voice_input_result.scalar() or 0
    
    voice_output_result = await db.execute(
        select(func.count(ChatMessage.id))
        .where(ChatMessage.created_at >= start_date)
        .where(ChatMessage.created_at <= end_date)
        .where(ChatMessage.audio_url_output.isnot(None))
    )
    voice_output_count = voice_output_result.scalar() or 0
    
    total_messages_result = await db.execute(
        select(func.count(ChatMessage.id))
        .where(ChatMessage.created_at >= start_date)
        .where(ChatMessage.created_at <= end_date)
    )
    total_messages = total_messages_result.scalar() or 0
    
    voice_pct = ((voice_input_count + voice_output_count) / total_messages * 100) if total_messages > 0 else 0
    
    return {
        "characterImages": character_images,
        "voice": {
            "inputCount": voice_input_count,
            "outputCount": voice_output_count,
            "pctOfMessages": float(voice_pct)
        }
    }

# Funnel endpoint
@router.get("/conversions/funnel", dependencies=[Depends(require_admin)])
async def get_funnel(
    date_range: str = Query("30d", description="Date range: 7d, 30d, 90d, 1y"),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """Get conversion funnel data"""
    start_date, end_date = parse_date_range(date_range)
    
    # Registered users
    registered_result = await db.execute(
        select(func.count(User.id))
        .where(User.created_at >= start_date)
        .where(User.created_at <= end_date)
    )
    registered = registered_result.scalar() or 0
    
    # Verified users
    verified_result = await db.execute(
        select(func.count(User.id))
        .where(User.created_at >= start_date)
        .where(User.created_at <= end_date)
        .where(User.is_email_verified == True)
    )
    verified = verified_result.scalar() or 0
    
    # Subscribed users
    subscribed_result = await db.execute(
        select(func.count(distinct(Subscription.user_id)))
        .where(Subscription.created_at >= start_date)
        .where(Subscription.created_at <= end_date)
    )
    subscribed = subscribed_result.scalar() or 0
    
    return {
        "registered": registered,
        "verified": verified,
        "subscribed": subscribed
    }

# Retention cohorts endpoint
@router.get("/users/retention-cohorts", dependencies=[Depends(require_admin)])
async def get_retention_cohorts(
    date_range: str = Query("30d", description="Date range: 7d, 30d, 90d, 1y"),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """Get user retention cohorts (simplified)"""
    start_date, end_date = parse_date_range(date_range)
    
    # Simplified cohort analysis - group by week
    result = await db.execute(
        select(
            func.date_trunc('week', User.created_at).label('cohort'),
            func.count(User.id).label('size')
        )
        .where(User.created_at >= start_date)
        .where(User.created_at <= end_date)
        .group_by(func.date_trunc('week', User.created_at))
        .order_by(func.date_trunc('week', User.created_at))
    )
    
    cohorts = []
    for row in result.fetchall():
        # Simplified retention calculation (would need more complex logic in production)
        cohorts.append({
            "cohort": str(row.cohort.date()) if row.cohort else "",
            "size": row.size,
            "d7_retainedPct": 85.0,  # Mock data - would need actual retention calculation
            "d14_retainedPct": 70.0  # Mock data - would need actual retention calculation
        })
    
    return {"cohorts": cohorts}

# Verification login endpoint
@router.get("/users/verification-login", dependencies=[Depends(require_admin)])
async def get_verification_login(
    date_range: str = Query("30d", description="Date range: 7d, 30d, 90d, 1y"),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """Get verification and login method statistics"""
    start_date, end_date = parse_date_range(date_range)
    
    # Verification rate
    total_users_result = await db.execute(
        select(func.count(User.id))
        .where(User.created_at >= start_date)
        .where(User.created_at <= end_date)
    )
    total_users = total_users_result.scalar() or 0
    
    verified_users_result = await db.execute(
        select(func.count(User.id))
        .where(User.created_at >= start_date)
        .where(User.created_at <= end_date)
        .where(User.is_email_verified == True)
    )
    verified_users = verified_users_result.scalar() or 0
    
    verification_rate = (verified_users / total_users * 100) if total_users > 0 else 0
    
    # Login methods (simplified - based on whether user has password)
    password_users_result = await db.execute(
        select(func.count(User.id))
        .where(User.created_at >= start_date)
        .where(User.created_at <= end_date)
        .where(User.hashed_password.isnot(None))
    )
    password_users = password_users_result.scalar() or 0
    
    oauth_users = total_users - password_users
    
    login_methods = [
        {"method": "email", "count": password_users},
        {"method": "oauth", "count": oauth_users}
    ]
    
    return {
        "verificationRatePct": float(verification_rate),
        "loginMethods": login_methods
    }

# Heatmap endpoint
@router.get("/engagement/heatmap", dependencies=[Depends(require_admin)])
async def get_heatmap(
    date_range: str = Query("30d", description="Date range: 7d, 30d, 90d, 1y"),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """Get message activity heatmap by day of week and hour"""
    start_date, end_date = parse_date_range(date_range)
    
    result = await db.execute(
        select(
            func.extract('dow', ChatMessage.created_at).label('weekday'),  # 0=Sunday, 6=Saturday
            func.extract('hour', ChatMessage.created_at).label('hour'),
            func.count(ChatMessage.id).label('messages')
        )
        .where(ChatMessage.created_at >= start_date)
        .where(ChatMessage.created_at <= end_date)
        .group_by(
            func.extract('dow', ChatMessage.created_at),
            func.extract('hour', ChatMessage.created_at)
        )
    )
    
    matrix = []
    for row in result.fetchall():
        matrix.append({
            "weekday": int(row.weekday),
            "hour": int(row.hour),
            "messages": row.messages
        })
    
    return {"matrix": matrix}

# Model availability endpoint
@router.get("/system/model-availability", dependencies=[Depends(require_admin)])
async def get_model_availability(db: AsyncSession = Depends(get_db)) -> Dict[str, Any]:
    """Get available models count (mock data - would integrate with model management)"""
    # This would typically query your model configuration tables
    # For now, returning mock data based on common AI model types
    
    return {
        "chatModels": 5,  # e.g., GPT-4, Claude, etc.
        "imageModels": 3,  # e.g., DALL-E, Midjourney, etc.
        "speechModels": 2  # e.g., Whisper, TTS models
    }

# Content trends endpoint
@router.get("/content/trends", dependencies=[Depends(require_admin)])
async def get_content_trends(
    date_range: str = Query("30d", description="Date range: 7d, 30d, 90d, 1y"),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """Get trending character styles"""
    start_date, end_date = parse_date_range(date_range)
    
    result = await db.execute(
        select(
            Character.style,
            func.count(ChatMessage.id).label('count')
        )
        .join(ChatMessage, Character.id == ChatMessage.character_id)
        .where(ChatMessage.created_at >= start_date)
        .where(ChatMessage.created_at <= end_date)
        .where(Character.style.isnot(None))
        .group_by(Character.style)
        .order_by(func.count(ChatMessage.id).desc())
        .limit(10)
    )
    
    styles = [{"style": row.style or "unknown", "count": row.count} for row in result.fetchall()]
    
    return {"styles": styles}

# Promo summary endpoint
@router.get("/promotions/summary", dependencies=[Depends(require_admin)])
async def get_promo_summary(
    date_range: str = Query("30d", description="Date range: 7d, 30d, 90d, 1y"),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """Get promotional codes summary"""
    start_date, end_date = parse_date_range(date_range)
    
    # Total coupons
    total_coupons_result = await db.execute(select(func.count(PromoManagement.promo_id)))
    total_coupons = total_coupons_result.scalar() or 0
    
    # By status
    status_result = await db.execute(
        select(
            PromoManagement.status,
            func.count(PromoManagement.promo_id).label('count')
        )
        .group_by(PromoManagement.status)
    )
    by_status = [{"status": row.status, "count": row.count} for row in status_result.fetchall()]
    
    # Total redemptions in date range
    total_redemptions_result = await db.execute(
        select(func.count(PromoRedemption.redemption_id))
        .where(PromoRedemption.applied_at >= start_date)
        .where(PromoRedemption.applied_at <= end_date)
    )
    total_redemptions = total_redemptions_result.scalar() or 0
    
    # Total discount given
    discount_given_result = await db.execute(
        select(func.sum(PromoRedemption.discount_applied))
        .where(PromoRedemption.applied_at >= start_date)
        .where(PromoRedemption.applied_at <= end_date)
    )
    discount_given = float(discount_given_result.scalar() or 0)
    
    # Top promos
    top_promos_result = await db.execute(
        select(
            PromoRedemption.promo_code,
            func.count(PromoRedemption.redemption_id).label('redemptions'),
            func.sum(PromoRedemption.discount_applied).label('discount')
        )
        .where(PromoRedemption.applied_at >= start_date)
        .where(PromoRedemption.applied_at <= end_date)
        .group_by(PromoRedemption.promo_code)
        .order_by(func.count(PromoRedemption.redemption_id).desc())
        .limit(10)
    )
    
    top_promos = []
    for row in top_promos_result.fetchall():
        top_promos.append({
            "promo_code": row.promo_code,
            "redemptions": row.redemptions,
            "discount": float(row.discount or 0)
        })
    
    return {
        "totalCoupons": total_coupons,
        "byStatus": by_status,
        "totalRedemptions": total_redemptions,
        "discountGiven": discount_given,
        "topPromos": top_promos
    }

# Redemptions series endpoint
@router.get("/promotions/redemptions-timeseries", dependencies=[Depends(require_admin)])
async def get_redemptions_series(
    date_range: str = Query("30d", description="Date range: 7d, 30d, 90d, 1y"),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """Get promo redemptions time series data"""
    start_date, end_date = parse_date_range(date_range)
    
    result = await db.execute(
        select(
            func.date(PromoRedemption.applied_at).label('date'),
            func.count(PromoRedemption.redemption_id).label('redemptions'),
            func.sum(PromoRedemption.discount_applied).label('discount')
        )
        .where(PromoRedemption.applied_at >= start_date)
        .where(PromoRedemption.applied_at <= end_date)
        .group_by(func.date(PromoRedemption.applied_at))
        .order_by(func.date(PromoRedemption.applied_at))
    )
    
    data = {}
    for row in result.fetchall():
        date_str = str(row.date)
        data[date_str] = {
            "redemptions": row.redemptions,
            "discount": float(row.discount or 0)
        }
    
    # Fill in missing dates
    series = []
    current_date = start_date.date()
    end_date_only = end_date.date()
    
    while current_date <= end_date_only:
        date_str = str(current_date)
        day_data = data.get(date_str, {"redemptions": 0, "discount": 0.0})
        series.append({
            "date": date_str,
            "redemptions": day_data["redemptions"],
            "discount": day_data["discount"]
        })
        current_date += timedelta(days=1)
    
    return {"series": series}

# Free vs Paid endpoint
@router.get("/users/free-paid", dependencies=[Depends(require_admin)])
async def get_free_paid(
    date_range: str = Query("30d", description="Date range: 7d, 30d, 90d, 1y"),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """Get free vs paid users breakdown"""
    start_date, end_date = parse_date_range(date_range)
    
    # Total active users in period
    total_users_result = await db.execute(
        select(func.count(distinct(ChatMessage.user_id)))
        .where(ChatMessage.created_at >= start_date)
        .where(ChatMessage.created_at <= end_date)
    )
    total_users = total_users_result.scalar() or 0
    
    # Paid users (with active subscriptions)
    paid_users_result = await db.execute(
        select(func.count(distinct(Subscription.user_id)))
        .where(Subscription.status == 'active')
    )
    paid_users = paid_users_result.scalar() or 0
    
    free_users = max(0, total_users - paid_users)
    
    return {
        "free": free_users,
        "paid": paid_users
    }

# ARPU/LTV endpoint
@router.get("/revenue/arpu-ltv", dependencies=[Depends(require_admin)])
async def get_arpu_ltv(
    date_range: str = Query("30d", description="Date range: 7d, 30d, 90d, 1y"),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """Get Average Revenue Per User and Lifetime Value"""
    start_date, end_date = parse_date_range(date_range)
    
    # ARPU calculation
    total_revenue_result = await db.execute(
        select(func.sum(PricingPlan.price))
        .join(Subscription, PricingPlan.plan_name == Subscription.plan_name)
        .where(Subscription.status == 'active')
    )
    total_revenue = float(total_revenue_result.scalar() or 0)
    
    total_users_result = await db.execute(
        select(func.count(distinct(Subscription.user_id)))
        .where(Subscription.status == 'active')
    )
    total_users = total_users_result.scalar() or 1
    
    arpu = total_revenue / total_users if total_users > 0 else 0
    
    # LTV calculation (simplified - ARPU * average subscription length)
    # In production, you'd want more sophisticated LTV calculation
    avg_subscription_length = 12  # months (mock data)
    ltv = arpu * avg_subscription_length
    
    return {
        "arpu": float(arpu),
        "ltv": float(ltv)
    }

# Paid conversion endpoint
@router.get("/conversions/paid-conversion", dependencies=[Depends(require_admin)])
async def get_paid_conversion(
    date_range: str = Query("30d", description="Date range: 7d, 30d, 90d, 1y"),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """Get free to paid conversion metrics"""
    start_date, end_date = parse_date_range(date_range)
    
    # New users in period
    new_users_result = await db.execute(
        select(func.count(User.id))
        .where(User.created_at >= start_date)
        .where(User.created_at <= end_date)
    )
    new_users = new_users_result.scalar() or 0
    
    # New subscribers in period
    new_subscribers_result = await db.execute(
        select(func.count(Subscription.id))
        .where(Subscription.created_at >= start_date)
        .where(Subscription.created_at <= end_date)
    )
    new_subscribers = new_subscribers_result.scalar() or 0
    
    conversion_pct = (new_subscribers / new_users * 100) if new_users > 0 else 0
    
    return {
        "newUsers": new_users,
        "newSubscribers": new_subscribers,
        "conversionPct": float(conversion_pct)
    }