"""
Seed dashboard-focused dummy data (users, characters, orders, subscriptions,
coin transactions, chat messages, character media, and private content).

Usage (PowerShell):
  python scripts/seed_dashboard_dummy_data.py
"""

import asyncio
import datetime as dt
import random
import uuid
from collections import defaultdict
from typing import Dict, List, Tuple

from sqlalchemy import func, insert, select, update, bindparam

from app.core.database import AsyncSessionLocal
from app.core.security import hash_password
from app.models.user import User, UserProfile, RoleEnum
from app.models.character import Character
from app.models.character_media import CharacterMedia
from app.models.chat import ChatMessage
from app.models.private_content import MediaPack, MediaPackMedia, UserMediaPackAccess
from app.models.subscription import (
    CoinTransaction,
    Order,
    PricingPlan,
    PromoManagement,
    Subscription,
    UserWallet,
)
from app.services.app_config import generate_id


# -----------------------------
# CONFIG
# -----------------------------
TARGET_USERS = 500
MIN_CHARS_PER_USER = 5
MAX_CHARS_PER_USER = 20
TARGET_CHATS = 200_000
TARGET_MEDIA = 100_000
COIN_TX_TARGET_GOAL = 250_000
COIN_TX_TARGET_MIN = 200_000
COIN_TX_TARGET_MAX = 300_000
TIME_RANGE_DAYS = 365 * 3
BATCH_SIZE = 1000

DUMMY_EMAIL_PREFIX = "dashseed_"
DEFAULT_PASSWORD = "DemoPass123!"


LOCATIONS = [
    {"country": "US", "city": "New York"},
    {"country": "US", "city": "Los Angeles"},
    {"country": "CA", "city": "Toronto"},
    {"country": "GB", "city": "London"},
    {"country": "DE", "city": "Berlin"},
    {"country": "FR", "city": "Paris"},
    {"country": "BR", "city": "Sao Paulo"},
    {"country": "IN", "city": "Bengaluru"},
    {"country": "SG", "city": "Singapore"},
    {"country": "AU", "city": "Sydney"},
    {"country": "ZA", "city": "Cape Town"},
    {"country": "AE", "city": "Dubai"},
]


SUBSCRIPTION_PLANS = [
    {
        "pricing_id": "hl-sub-monthly",
        "plan_name": "Honey Love Subscription",
        "billing_cycle": "Monthly",
        "price": 19.99,
        "coin_reward": 200,
        "discount_type": "subscription_monthly",
    },
    {
        "pricing_id": "hl-sub-quarterly",
        "plan_name": "Honey Love Subscription",
        "billing_cycle": "Every 3 Months",
        "price": 54.99,
        "coin_reward": 600,
        "discount_type": "subscription_quarterly",
    },
    {
        "pricing_id": "hl-sub-annual",
        "plan_name": "Honey Love Subscription",
        "billing_cycle": "Every 12 Months",
        "price": 179.99,
        "coin_reward": 2400,
        "discount_type": "subscription_annual",
    },
]

COIN_PACKS = [
    {
        "pricing_id": "hl-coin-300",
        "plan_name": "Honey Love Token Pack",
        "billing_cycle": "OneTime",
        "price": 29.99,
        "coin_reward": 300,
        "discount_type": "coin_purchase",
    },
    {
        "pricing_id": "hl-coin-750",
        "plan_name": "Honey Love Token Pack",
        "billing_cycle": "OneTime",
        "price": 69.99,
        "coin_reward": 750,
        "discount_type": "coin_purchase",
    },
    {
        "pricing_id": "hl-coin-1500",
        "plan_name": "Honey Love Token Pack",
        "billing_cycle": "OneTime",
        "price": 129.99,
        "coin_reward": 1500,
        "discount_type": "coin_purchase",
    },
]

PROMOS = [
    {"coupon": "SAVE10", "promo_name": "Save 10", "percent_off": 10},
    {"coupon": "SAVE20", "promo_name": "Save 20", "percent_off": 20},
    {"coupon": "WELCOME15", "promo_name": "Welcome 15", "percent_off": 15},
    {"coupon": "HOLIDAY25", "promo_name": "Holiday 25", "percent_off": 25},
]


def random_ip(rng: random.Random) -> str:
    return ".".join(str(rng.randint(1, 254)) for _ in range(4))


def build_spike_windows(
    rng: random.Random, start: dt.datetime, end: dt.datetime, count: int = 8
) -> List[Tuple[dt.datetime, dt.datetime]]:
    windows = []
    total_days = max((end - start).days, 1)
    for _ in range(count):
        center = start + dt.timedelta(days=rng.randint(0, total_days))
        window_start = center - dt.timedelta(days=2)
        window_end = center + dt.timedelta(days=2)
        windows.append((window_start, window_end))
    return windows


def random_datetime(
    rng: random.Random, start: dt.datetime, end: dt.datetime
) -> dt.datetime:
    delta = end - start
    seconds = rng.randint(0, int(delta.total_seconds()))
    return start + dt.timedelta(seconds=seconds)


def random_datetime_with_spikes(
    rng: random.Random,
    start: dt.datetime,
    end: dt.datetime,
    spikes: List[Tuple[dt.datetime, dt.datetime]],
    spike_prob: float = 0.25,
) -> dt.datetime:
    if spikes and rng.random() < spike_prob:
        w_start, w_end = rng.choice(spikes)
        w_start = max(w_start, start)
        w_end = min(w_end, end)
        return random_datetime(rng, w_start, w_end)
    return random_datetime(rng, start, end)


def target_chars_for_user(user_id: str) -> int:
    seed = int(user_id[:8], 16)
    local_rng = random.Random(seed)
    return local_rng.randint(MIN_CHARS_PER_USER, MAX_CHARS_PER_USER)


async def ensure_pricing_plans(session) -> Dict[str, PricingPlan]:
    plans = SUBSCRIPTION_PLANS + COIN_PACKS
    pricing_ids = [p["pricing_id"] for p in plans]
    existing = (
        (
            await session.execute(
                select(PricingPlan).where(PricingPlan.pricing_id.in_(pricing_ids))
            )
        )
        .scalars()
        .all()
    )
    existing_map = {p.pricing_id: p for p in existing}

    for plan in plans:
        obj = existing_map.get(plan["pricing_id"])
        if obj:
            obj.plan_name = plan["plan_name"]
            obj.pricing_id = plan["pricing_id"]
            obj.coupon = "NOPROMO"
            obj.currency = "USD"
            obj.price = plan["price"]
            obj.discount = None
            obj.billing_cycle = plan["billing_cycle"]
            obj.coin_reward = plan["coin_reward"]
            obj.status = "Active"
            session.add(obj)
        else:
            session.add(
                PricingPlan(
                    plan_name=plan["plan_name"],
                    pricing_id=plan["pricing_id"],
                    coupon="NOPROMO",
                    currency="USD",
                    price=plan["price"],
                    discount=None,
                    billing_cycle=plan["billing_cycle"],
                    coin_reward=plan["coin_reward"],
                    status="Active",
                )
            )
    await session.commit()

    refreshed = (
        (
            await session.execute(
                select(PricingPlan).where(PricingPlan.pricing_id.in_(pricing_ids))
            )
        )
        .scalars()
        .all()
    )
    return {p.pricing_id: p for p in refreshed}


async def ensure_promos(session) -> List[PromoManagement]:
    coupons = [p["coupon"] for p in PROMOS]
    existing = (
        (
            await session.execute(
                select(PromoManagement).where(PromoManagement.coupon.in_(coupons))
            )
        )
        .scalars()
        .all()
    )
    existing_map = {p.coupon: p for p in existing}
    for promo in PROMOS:
        obj = existing_map.get(promo["coupon"])
        if obj:
            obj.promo_name = promo["promo_name"]
            obj.percent_off = promo["percent_off"]
            obj.discount_type = "promo"
            obj.currency = "USD"
            obj.status = "active"
            session.add(obj)
        else:
            session.add(
                PromoManagement(
                    promo_name=promo["promo_name"],
                    discount_type="promo",
                    coupon=promo["coupon"],
                    currency="USD",
                    percent_off=promo["percent_off"],
                    status="active",
                )
            )
    await session.commit()
    refreshed = (
        (
            await session.execute(
                select(PromoManagement).where(PromoManagement.coupon.in_(coupons))
            )
        )
        .scalars()
        .all()
    )
    return refreshed


