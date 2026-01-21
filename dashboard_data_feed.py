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

async def seed():
    rng = random.Random()
    now = dt.datetime.now(dt.timezone.utc)
    start = now - dt.timedelta(days=TIME_RANGE_DAYS)
    spikes = build_spike_windows(rng, start, now)

    async with AsyncSessionLocal() as session:
        pricing_plans = await ensure_pricing_plans(session)
        promos = await ensure_promos(session)

        existing_users = (
            (
                await session.execute(
                    select(User.id, User.email, User.full_name, User.created_at).where(
                        User.email.like(f"{DUMMY_EMAIL_PREFIX}%")
                    )
                )
            )
            .all()
        )
        existing_user_count = len(existing_users)
        users_to_create = max(TARGET_USERS - existing_user_count, 0)

        print(f"Existing dummy users: {existing_user_count}")
        print(f"Creating {users_to_create} new dummy users...")

        user_rows = []
        profile_rows = []
        wallet_rows = []
        user_meta = []

        password_hash = hash_password(DEFAULT_PASSWORD)

        for i in range(users_to_create):
            user_id = generate_id()
            created_at = random_datetime_with_spikes(rng, start, now, spikes)
            email = f"{DUMMY_EMAIL_PREFIX}{existing_user_count + i + 1}@example.com"
            full_name = f"Dashboard User {existing_user_count + i + 1}"
            role = RoleEnum.USER.value
            user_rows.append(
                {
                    "id": user_id,
                    "email": email,
                    "hashed_password": password_hash,
                    "full_name": full_name,
                    "role": role,
                    "is_active": True,
                    "is_email_verified": True,
                    "has_active_subscription": False,
                    "created_at": created_at,
                    "updated_at": created_at,
                }
            )
            profile_rows.append(
                {
                    "user_id": user_id,
                    "full_name": full_name,
                    "email_id": email,
                    "username": f"user_{user_id[:8]}",
                    "gender": rng.choice(["male", "female", "other"]),
                }
            )
            wallet_rows.append(
                {
                    "user_id": user_id,
                    "coin_balance": 0,
                }
            )
            loc = rng.choice(LOCATIONS)
            user_meta.append(
                {
                    "id": user_id,
                    "email": email,
                    "full_name": full_name,
                    "created_at": created_at,
                    "country": loc["country"],
                    "city": loc["city"],
                }
            )

        if user_rows:
            await session.execute(insert(User).values(user_rows))
            await session.execute(insert(UserProfile).values(profile_rows))
            await session.execute(insert(UserWallet).values(wallet_rows))
            await session.commit()

        # Load existing dummy users into meta list
        for user_id, email, full_name, created_at in existing_users:
            loc = rng.choice(LOCATIONS)
            user_meta.append(
                {
                    "id": user_id,
                    "email": email,
                    "full_name": full_name,
                    "created_at": created_at,
                    "country": loc["country"],
                    "city": loc["city"],
                }
            )

        dummy_user_ids = [u["id"] for u in user_meta]

        # Ensure wallets for existing dummy users
        existing_wallets = (
            (
                await session.execute(
                    select(UserWallet.user_id).where(
                        UserWallet.user_id.in_(dummy_user_ids)
                    )
                )
            )
            .scalars()
            .all()
        )
        existing_wallets = set(existing_wallets)
        missing_wallets = [
            {"user_id": uid, "coin_balance": 0}
            for uid in dummy_user_ids
            if uid not in existing_wallets
        ]
        if missing_wallets:
            await session.execute(insert(UserWallet).values(missing_wallets))
            await session.commit()

        # Characters
        existing_char_counts = {
            row[0]: row[1]
            for row in (
                await session.execute(
                    select(Character.user_id, func.count(Character.id))
                    .where(Character.user_id.in_(dummy_user_ids))
                    .group_by(Character.user_id)
                )
            ).all()
        }

        existing_chars = (
            (
                await session.execute(
                    select(Character.id, Character.user_id, Character.name).where(
                        Character.user_id.in_(dummy_user_ids)
                    )
                )
            )
            .all()
        )
        user_char_ids: Dict[str, List[str]] = defaultdict(list)
        char_name_map: Dict[str, str] = {}
        for char_id, user_id, name in existing_chars:
            user_char_ids[user_id].append(char_id)
            char_name_map[char_id] = name

        character_rows = []
        new_character_ids = []
        for user in user_meta:
            user_id = user["id"]
            existing_count = existing_char_counts.get(user_id, 0)
            target_count = target_chars_for_user(user_id)
            to_create = max(target_count - existing_count, 0)
            for idx in range(to_create):
                character_id = generate_id()
                created_at = random_datetime_with_spikes(rng, start, now, spikes)
                name = rng.choice(
                    [
                        "Luna",
                        "Mia",
                        "Nova",
                        "Aria",
                        "Skye",
                        "Zara",
                        "Ava",
                        "Chloe",
                        "Serena",
                        "Nyx",
                        "Ember",
                        "Riley",
                        "Isla",
                    ]
                )
                username = f"{user_id[:6]}_{idx}_{rng.randint(1000,9999)}"
                character_rows.append(
                    {
                        "id": character_id,
                        "username": username,
                        "user_id": user_id,
                        "name": name,
                        "gender": rng.choice(["Girl", "Boy", "Non-binary"]),
                        "style": rng.choice(["Glam", "Casual", "Vintage", "Sporty"]),
                        "ethnicity": rng.choice(
                            ["Latina", "Asian", "Caucasian", "Mixed", "Black"]
                        ),
                        "age": rng.randint(20, 35),
                        "eye_colour": rng.choice(["brown", "blue", "green", "hazel"]),
                        "hair_style": rng.choice(
                            ["curly", "straight", "wavy", "pixie", "braided"]
                        ),
                        "hair_colour": rng.choice(
                            ["black", "brunette", "blonde", "red", "auburn"]
                        ),
                        "body_type": rng.choice(["petite", "athletic", "curvy", "slim"]),
                        "breast_size": rng.choice(["A", "B", "C", "D"]),
                        "butt_size": rng.choice(["S", "M", "L"]),
                        "personality": rng.choice(
                            ["playful", "sweet", "bold", "mysterious", "chill"]
                        ),
                        "voice_type": rng.choice(["soft", "husky", "bright", "calm"]),
                        "relationship_type": rng.choice(
                            ["flirty", "romantic", "friendly"]
                        ),
                        "clothing": rng.choice(
                            ["streetwear", "formal", "casual", "sporty"]
                        ),
                        "special_features": "Freckles and a quick wit",
                        "background": rng.choice(
                            [
                                "digital nomad who loves beaches",
                                "DJ spinning at underground clubs",
                                "comic artist who sketches nightly",
                                "fitness trainer filming routines",
                                "gamer who speedruns classics",
                            ]
                        ),
                        "prompt": f"Act as {name}, a friendly companion.",
                        "image_url_s3": f"characters/{character_id}/image.webp",
                        "webp_image_url_s3": f"characters/{character_id}/image.webp",
                        "gif_url_s3": f"characters/{character_id}/hover.gif",
                        "animated_webp_url_s3": f"characters/{character_id}/hover.webp",
                        "privacy": "private",
                        "created_at": created_at,
                        "updated_at": created_at,
                    }
                )
                user_char_ids[user_id].append(character_id)
                char_name_map[character_id] = name
                new_character_ids.append(character_id)

        for i in range(0, len(character_rows), BATCH_SIZE):
            batch = character_rows[i : i + BATCH_SIZE]
            if batch:
                await session.execute(insert(Character).values(batch))
                await session.commit()

        all_character_ids = [
            char_id for char_ids in user_char_ids.values() for char_id in char_ids
        ]
        char_owner_map = {}
        for owner_id, char_ids in user_char_ids.items():
            for char_id in char_ids:
                char_owner_map[char_id] = owner_id

        # Character media
        existing_media_count = (
            await session.execute(
                select(func.count(CharacterMedia.id)).where(
                    CharacterMedia.user_id.in_(dummy_user_ids)
                )
            )
        ).scalar_one()
        media_needed = max(TARGET_MEDIA - existing_media_count, 0)
        print(f"Existing character_media: {existing_media_count}")
        print(f"Creating {media_needed} character_media rows...")

        coin_tx_created = 0
        coin_balances: Dict[str, int] = defaultdict(int)
        coin_rows: List[dict] = []

        def add_coin_tx(row: dict, mandatory: bool = False) -> None:
            nonlocal coin_tx_created
            if not mandatory and (coin_tx_created >= COIN_TX_TARGET_MAX):
                return
            coin_rows.append(row)
            coin_tx_created += 1
            delta = row["coins"] if row["transaction_type"] == "credit" else -row["coins"]
            coin_balances[row["user_id"]] += delta

        media_rows: List[dict] = []
        base_media_per_char = 2
        base_media = min(media_needed, len(new_character_ids) * base_media_per_char)
        remaining_media = max(media_needed - base_media, 0)

        # Ensure new characters have some media
        for char_id in new_character_ids:
            for _ in range(base_media_per_char):
                if len(media_rows) >= base_media:
                    break
                user_id = char_owner_map.get(char_id)
                if not user_id:
                    continue
                created_at = random_datetime_with_spikes(rng, start, now, spikes)
                media_type = "image" if rng.random() < 0.8 else "chat_image"
                media_id = generate_id()
                s3_key = (
                    f"chat_image/{user_id}/{uuid.uuid4().hex}.webp"
                    if media_type == "chat_image"
                    else f"image/{user_id}/{uuid.uuid4().hex}.webp"
                )
                media_rows.append(
                    {
                        "id": media_id,
                        "character_id": char_id,
                        "user_id": user_id,
                        "media_type": media_type,
                        "s3_path": s3_key,
                        "mime_type": "image/webp",
                        "created_at": created_at,
                    }
                )
                if media_type == "image" and rng.random() < 0.5:
                    add_coin_tx(
                        {
                            "id": generate_id(),
                            "user_id": user_id,
                            "character_id": char_id,
                            "transaction_type": "debit",
                            "coins": rng.choice([15, 20, 25, 30]),
                            "source_type": "image",
                            "order_id": None,
                            "period_start": None,
                            "period_end": None,
                            "created_at": created_at,
                            "ip": random_ip(rng),
                            "country_code": rng.choice(LOCATIONS)["country"],
                            "city": rng.choice(LOCATIONS)["city"],
                            "visitor_session_id": None,
                        }
                    )

        # Remaining media distributed across characters
        for _ in range(remaining_media):
            char_id = rng.choice(all_character_ids)
            user_id = char_owner_map.get(char_id)
            if not user_id:
                continue
            created_at = random_datetime_with_spikes(rng, start, now, spikes)
            media_type = "image" if rng.random() < 0.8 else "chat_image"
            media_id = generate_id()
            s3_key = (
                f"chat_image/{user_id}/{uuid.uuid4().hex}.webp"
                if media_type == "chat_image"
                else f"image/{user_id}/{uuid.uuid4().hex}.webp"
            )
            media_rows.append(
                {
                    "id": media_id,
                    "character_id": char_id,
                    "user_id": user_id,
                    "media_type": media_type,
                    "s3_path": s3_key,
                    "mime_type": "image/webp",
                    "created_at": created_at,
                }
            )
            if media_type == "image" and rng.random() < 0.5:
                add_coin_tx(
                    {
                        "id": generate_id(),
                        "user_id": user_id,
                        "character_id": char_id,
                        "transaction_type": "debit",
                        "coins": rng.choice([15, 20, 25, 30]),
                        "source_type": "image",
                        "order_id": None,
                        "period_start": None,
                        "period_end": None,
                        "created_at": created_at,
                        "ip": random_ip(rng),
                        "country_code": rng.choice(LOCATIONS)["country"],
                        "city": rng.choice(LOCATIONS)["city"],
                        "visitor_session_id": None,
                    }
                )

            if len(media_rows) >= BATCH_SIZE:
                await session.execute(insert(CharacterMedia).values(media_rows))
                if coin_rows:
                    await session.execute(insert(CoinTransaction).values(coin_rows))
                    coin_rows.clear()
                await session.commit()
                media_rows.clear()

        if media_rows:
            await session.execute(insert(CharacterMedia).values(media_rows))
            if coin_rows:
                await session.execute(insert(CoinTransaction).values(coin_rows))
                coin_rows.clear()
            await session.commit()
            media_rows.clear()

        # Load media for packs
        media_lookup = defaultdict(list)
        media_rows_all = (
            (
                await session.execute(
                    select(
                        CharacterMedia.id, CharacterMedia.character_id, CharacterMedia.s3_path
                    ).where(CharacterMedia.user_id.in_(dummy_user_ids))
                )
            )
            .all()
        )
        for media_id, char_id, s3_path in media_rows_all:
            media_lookup[char_id].append((media_id, s3_path))

        # Media packs + access
        pack_candidates = [
            cid for cid, medias in media_lookup.items() if len(medias) >= 4
        ]
        rng.shuffle(pack_candidates)
        pack_target = min(len(pack_candidates), max(200, int(len(pack_candidates) * 0.2)))

        pack_rows = []
        pack_media_rows = []
        pack_ids = []

        for char_id in pack_candidates[:pack_target]:
            pack_id = generate_id()
            creator_id = char_owner_map.get(char_id)
            if not creator_id:
                continue
            created_at = random_datetime_with_spikes(rng, start, now, spikes)
            media_items = rng.sample(media_lookup[char_id], k=rng.randint(4, 8))
            pack_rows.append(
                {
                    "id": pack_id,
                    "character_id": char_id,
                    "created_by": creator_id,
                    "name": f"Exclusive Pack {pack_id[:6]}",
                    "description": "Private content bundle",
                    "price_tokens": rng.choice([100, 150, 200, 250, 300]),
                    "num_images": len(media_items),
                    "num_videos": 0,
                    "is_active": True,
                    "thumbnail_s3_path": media_items[0][1],
                    "created_at": created_at,
                }
            )
            for media_id, _s3 in media_items:
                pack_media_rows.append(
                    {
                        "id": generate_id(),
                        "media_pack_id": pack_id,
                        "character_media_id": media_id,
                    }
                )
            pack_ids.append(pack_id)

            if len(pack_rows) >= BATCH_SIZE:
                await session.execute(insert(MediaPack).values(pack_rows))
                await session.execute(insert(MediaPackMedia).values(pack_media_rows))
                await session.commit()
                pack_rows.clear()
                pack_media_rows.clear()

        if pack_rows:
            await session.execute(insert(MediaPack).values(pack_rows))
            if pack_media_rows:
                await session.execute(insert(MediaPackMedia).values(pack_media_rows))
            await session.commit()

        # Media pack access + coin transactions (private-content)
        access_rows = []
        unlock_target = min(6000, max(1000, len(pack_ids) * 3))
        used_pairs = set()

        for _ in range(unlock_target):
            user_id = rng.choice(dummy_user_ids)
            pack_id = rng.choice(pack_ids) if pack_ids else None
            if not pack_id:
                break
            pair = (user_id, pack_id)
            if pair in used_pairs:
                continue
            used_pairs.add(pair)
            created_at = random_datetime_with_spikes(rng, start, now, spikes)
            access_rows.append(
                {
                    "id": generate_id(),
                    "user_id": user_id,
                    "media_pack_id": pack_id,
                    "unlocked_at": created_at,
                }
            )
            add_coin_tx(
                {
                    "id": generate_id(),
                    "user_id": user_id,
                    "character_id": None,
                    "transaction_type": "debit",
                    "coins": rng.choice([75, 100, 150, 200]),
                    "source_type": "private-content",
                    "order_id": None,
                    "period_start": None,
                    "period_end": None,
                    "created_at": created_at,
                    "ip": random_ip(rng),
                    "country_code": rng.choice(LOCATIONS)["country"],
                    "city": rng.choice(LOCATIONS)["city"],
                    "visitor_session_id": None,
                }
            )

            if len(access_rows) >= BATCH_SIZE:
                await session.execute(insert(UserMediaPackAccess).values(access_rows))
                if coin_rows:
                    await session.execute(insert(CoinTransaction).values(coin_rows))
                    coin_rows.clear()
                await session.commit()
                access_rows.clear()

        if access_rows:
            await session.execute(insert(UserMediaPackAccess).values(access_rows))
            if coin_rows:
                await session.execute(insert(CoinTransaction).values(coin_rows))
                coin_rows.clear()
            await session.commit()

        # Orders + subscriptions + credit coin transactions
        subscription_plan_ids = [p["pricing_id"] for p in SUBSCRIPTION_PLANS]
        coin_pack_ids = [p["pricing_id"] for p in COIN_PACKS]
        active_sub_users = set()

        order_rows = []
        subscription_rows = []
        credit_coin_rows = []

        for user in user_meta:
            user_id = user["id"]
            orders_to_create = rng.randint(3, 7)
            for _ in range(orders_to_create):
                is_subscription = rng.random() < 0.45
                if is_subscription:
                    plan_id = rng.choice(subscription_plan_ids)
                    plan_cfg = next(p for p in SUBSCRIPTION_PLANS if p["pricing_id"] == plan_id)
                    discount_type = plan_cfg["discount_type"]
                else:
                    plan_id = rng.choice(coin_pack_ids)
                    plan_cfg = next(p for p in COIN_PACKS if p["pricing_id"] == plan_id)
                    discount_type = "coin_purchase"

                applied_at = random_datetime_with_spikes(rng, start, now, spikes)
                status = rng.choices(
                    ["success", "failed", "refunded"], weights=[0.85, 0.1, 0.05]
                )[0]
                promo = rng.choice(promos) if promos and rng.random() < 0.1 else None
                subtotal = float(plan_cfg["price"])
                discount_applied = 0.0
                promo_id = None
                promo_code = None
                if promo and status == "success":
                    percent = float(promo.percent_off or 0)
                    discount_applied = round(subtotal * percent / 100, 2)
                    subtotal = max(subtotal - discount_applied, 0.0)
                    promo_id = promo.id
                    promo_code = promo.coupon

                order_id = generate_id()
                order_rows.append(
                    {
                        "id": order_id,
                        "promo_id": promo_id,
                        "promo_code": promo_code,
                        "user_id": user_id,
                        "pricing_id": plan_id,
                        "provider": "dummy",
                        "provider_order_ref": f"pay_{rng.randint(10000, 99999)}",
                        "provider_coin": "usd",
                        "paid_value_coin": subtotal
                        if status == "success"
                        else 0,
                        "discount_type": discount_type,
                        "discount_applied": discount_applied,
                        "subtotal_at_apply": subtotal,
                        "currency": "USD",
                        "status": status,
                        "applied_at": applied_at,
                        "created_at": applied_at,
                        "ip": random_ip(rng),
                        "country_code": user["country"],
                        "city": user["city"],
                        "visitor_session_id": None,
                    }
                )

                if status == "success":
                    # Credit transaction for successful order
                    credit_coin_rows.append(
                        {
                            "id": generate_id(),
                            "user_id": user_id,
                            "character_id": None,
                            "transaction_type": "credit",
                            "coins": int(plan_cfg["coin_reward"]),
                            "source_type": "subscription"
                            if is_subscription
                            else "coin_purchase",
                            "order_id": order_id,
                            "period_start": applied_at,
                            "period_end": applied_at + dt.timedelta(days=30),
                            "created_at": applied_at,
                            "ip": random_ip(rng),
                            "country_code": user["country"],
                            "city": user["city"],
                            "visitor_session_id": None,
                        }
                    )
                    coin_balances[user_id] += int(plan_cfg["coin_reward"])
                    coin_tx_created += 1

                if is_subscription and status == "success":
                    sub_status = rng.choices(
                        ["active", "trialing", "canceled"], weights=[0.6, 0.1, 0.3]
                    )[0]
                    if discount_type == "subscription_monthly":
                        period_days = 30
                    elif discount_type == "subscription_quarterly":
                        period_days = 90
                    else:
                        period_days = 365

                    if sub_status == "active":
                        current_period_end = now + dt.timedelta(
                            days=rng.randint(15, 120)
                        )
                        active_sub_users.add(user_id)
                    else:
                        current_period_end = applied_at + dt.timedelta(
                            days=period_days * rng.randint(1, 3)
                        )
                        if current_period_end > now:
                            current_period_end = now - dt.timedelta(days=rng.randint(1, 30))

                    subscription_rows.append(
                        {
                            "id": generate_id(),
                            "user_id": user_id,
                            "payment_customer_id": f"cust_{user_id[:10]}",
                            "subscription_id": f"sub_{uuid.uuid4().hex[:12]}",
                            "tagada_subscription_id": None,
                            "tagada_customer_id": None,
                            "order_id": order_id,
                            "price_id": plan_id,
                            "plan_name": pricing_plans[plan_id].plan_name,
                            "status": sub_status,
                            "current_period_end": current_period_end,
                            "start_date": applied_at,
                            "cancel_at_period_end": sub_status == "canceled",
                            "total_coins_rewarded": int(plan_cfg["coin_reward"]),
                            "signup_ip": random_ip(rng),
                            "signup_country_code": user["country"],
                            "signup_city": user["city"],
                            "created_at": applied_at,
                            "updated_at": applied_at,
                        }
                    )

                if len(order_rows) >= BATCH_SIZE:
                    await session.execute(insert(Order).values(order_rows))
                    order_rows.clear()
                    if subscription_rows:
                        await session.execute(insert(Subscription).values(subscription_rows))
                        subscription_rows.clear()
                    if credit_coin_rows:
                        await session.execute(insert(CoinTransaction).values(credit_coin_rows))
                        credit_coin_rows.clear()
                    await session.commit()

        if order_rows:
            await session.execute(insert(Order).values(order_rows))
        if subscription_rows:
            await session.execute(insert(Subscription).values(subscription_rows))
        if credit_coin_rows:
            await session.execute(insert(CoinTransaction).values(credit_coin_rows))
        await session.commit()

        if active_sub_users:
            await session.execute(
                update(User)
                .where(User.id.in_(list(active_sub_users)))
                .values(has_active_subscription=True)
            )
            await session.commit()

        # Chat messages + chat coin transactions
        existing_chat_count = (
            await session.execute(
                select(func.count(ChatMessage.id)).where(
                    ChatMessage.user_id.in_(dummy_user_ids)
                )
            )
        ).scalar_one()
        chats_needed = max(TARGET_CHATS - existing_chat_count, 0)
        print(f"Existing chat messages: {existing_chat_count}")
        print(f"Creating {chats_needed} chat messages...")

        user_sessions = {
            user_id: [
                f"sess_{user_id[:8]}_{rng.randint(1000,9999)}"
                for _ in range(rng.randint(1, 3))
            ]
            for user_id in dummy_user_ids
        }

        chat_rows = []
        chat_coin_rows = []

        for _ in range(chats_needed):
            user_id = rng.choice(dummy_user_ids)
            if not user_char_ids[user_id]:
                continue
            character_id = rng.choice(user_char_ids[user_id])
            character_name = char_name_map.get(character_id, "Companion")
            session_id = rng.choice(user_sessions[user_id])
            created_at = random_datetime_with_spikes(rng, start, now, spikes)

            roll = rng.random()
            media_type = None
            s3_media = None
            is_media = False
            transcription = None

            if roll < 0.10:
                media_type = "chat_image"
                s3_media = f"chat_image/{user_id}/{uuid.uuid4().hex}.webp"
                is_media = True
            elif roll < 0.15:
                media_type = "voice_with_image"
                s3_media = {
                    "input_key": f"voice/input/{user_id}/{uuid.uuid4().hex}.mp3",
                    "output_key": f"voice/output/{user_id}/{uuid.uuid4().hex}.mp3",
                    "image_key": f"chat_image/{user_id}/{uuid.uuid4().hex}.webp",
                }
                is_media = True
                transcription = f"Voice note about {character_name}"
            elif roll < 0.20:
                media_type = "voice"
                s3_media = {
                    "input_key": f"voice/input/{user_id}/{uuid.uuid4().hex}.mp3",
                    "output_key": f"voice/output/{user_id}/{uuid.uuid4().hex}.mp3",
                }
                is_media = True
                transcription = f"Voice note about {character_name}"

            chat_rows.append(
                {
                    "id": generate_id(),
                    "session_id": session_id,
                    "user_id": user_id,
                    "character_id": character_id,
                    "user_query": f"Hey {character_name}, how's it going?",
                    "ai_message": f"{character_name} replies with a friendly note.",
                    "debug_ai_message": None,
                    "transcription": transcription,
                    "context_window": rng.choice([30, 60, 90]),
                    "is_media_available": is_media,
                    "media_type": media_type,
                    "s3_url_media": s3_media,
                    "created_at": created_at,
                }
            )

            if media_type in ("chat_image", "voice_with_image"):
                if coin_tx_created < COIN_TX_TARGET_MAX:
                    chat_coin_rows.append(
                        {
                            "id": generate_id(),
                            "user_id": user_id,
                            "character_id": character_id,
                            "transaction_type": "debit",
                            "coins": rng.choice([25, 35, 50]),
                            "source_type": "chat_image",
                            "order_id": None,
                            "period_start": None,
                            "period_end": None,
                            "created_at": created_at,
                            "ip": random_ip(rng),
                            "country_code": rng.choice(LOCATIONS)["country"],
                            "city": rng.choice(LOCATIONS)["city"],
                            "visitor_session_id": None,
                        }
                    )
                    coin_balances[user_id] -= chat_coin_rows[-1]["coins"]
                    coin_tx_created += 1
            else:
                if rng.random() < 0.75 and coin_tx_created < COIN_TX_TARGET_MAX:
                    chat_coin_rows.append(
                        {
                            "id": generate_id(),
                            "user_id": user_id,
                            "character_id": character_id,
                            "transaction_type": "debit",
                            "coins": rng.choice([5, 10, 15, 20]),
                            "source_type": "chat",
                            "order_id": None,
                            "period_start": None,
                            "period_end": None,
                            "created_at": created_at,
                            "ip": random_ip(rng),
                            "country_code": rng.choice(LOCATIONS)["country"],
                            "city": rng.choice(LOCATIONS)["city"],
                            "visitor_session_id": None,
                        }
                    )
                    coin_balances[user_id] -= chat_coin_rows[-1]["coins"]
                    coin_tx_created += 1

            if len(chat_rows) >= BATCH_SIZE:
                await session.execute(insert(ChatMessage).values(chat_rows))
                if chat_coin_rows:
                    await session.execute(insert(CoinTransaction).values(chat_coin_rows))
                    chat_coin_rows.clear()
                await session.commit()
                chat_rows.clear()

        if chat_rows:
            await session.execute(insert(ChatMessage).values(chat_rows))
            if chat_coin_rows:
                await session.execute(insert(CoinTransaction).values(chat_coin_rows))
            await session.commit()

        # Character unlock coin transactions (source_type: character)
        char_unlock_rows = []
        for char_id in all_character_ids:
            if rng.random() < 0.4 and coin_tx_created < COIN_TX_TARGET_MAX:
                user_id = char_owner_map.get(char_id)
                if not user_id:
                    continue
                created_at = random_datetime_with_spikes(rng, start, now, spikes)
                char_unlock_rows.append(
                    {
                        "id": generate_id(),
                        "user_id": user_id,
                        "character_id": char_id,
                        "transaction_type": "debit",
                        "coins": rng.choice([60, 80, 100, 120]),
                        "source_type": "character",
                        "order_id": None,
                        "period_start": None,
                        "period_end": None,
                        "created_at": created_at,
                        "ip": random_ip(rng),
                        "country_code": rng.choice(LOCATIONS)["country"],
                        "city": rng.choice(LOCATIONS)["city"],
                        "visitor_session_id": None,
                    }
                )
                coin_balances[user_id] -= char_unlock_rows[-1]["coins"]
                coin_tx_created += 1

                if len(char_unlock_rows) >= BATCH_SIZE:
                    await session.execute(
                        insert(CoinTransaction).values(char_unlock_rows)
                    )
                    await session.commit()
                    char_unlock_rows.clear()

        if char_unlock_rows:
            await session.execute(insert(CoinTransaction).values(char_unlock_rows))
            await session.commit()

        # Top-up coin transactions if below target min
        existing_coin_tx_count = (
            await session.execute(
                select(func.count(CoinTransaction.id)).where(
                    CoinTransaction.user_id.in_(dummy_user_ids)
                )
            )
        ).scalar_one()
        if existing_coin_tx_count < COIN_TX_TARGET_MIN:
            missing = min(COIN_TX_TARGET_MIN - existing_coin_tx_count, 50_000)
            filler_rows = []
            for _ in range(missing):
                user_id = rng.choice(dummy_user_ids)
                character_id = rng.choice(user_char_ids[user_id])
                created_at = random_datetime_with_spikes(rng, start, now, spikes)
                filler_rows.append(
                    {
                        "id": generate_id(),
                        "user_id": user_id,
                        "character_id": character_id,
                        "transaction_type": "debit",
                        "coins": rng.choice([5, 10, 15]),
                        "source_type": "chat",
                        "order_id": None,
                        "period_start": None,
                        "period_end": None,
                        "created_at": created_at,
                        "ip": random_ip(rng),
                        "country_code": rng.choice(LOCATIONS)["country"],
                        "city": rng.choice(LOCATIONS)["city"],
                        "visitor_session_id": None,
                    }
                )
                coin_balances[user_id] -= filler_rows[-1]["coins"]

                if len(filler_rows) >= BATCH_SIZE:
                    await session.execute(insert(CoinTransaction).values(filler_rows))
                    await session.commit()
                    filler_rows.clear()

            if filler_rows:
                await session.execute(insert(CoinTransaction).values(filler_rows))
                await session.commit()

        # Update wallet balances
        wallet_updates = []
        wallet_rows_db = (
            (
                await session.execute(
                    select(UserWallet.user_id, UserWallet.coin_balance).where(
                        UserWallet.user_id.in_(dummy_user_ids)
                    )
                )
            )
            .all()
        )
        for user_id, balance in wallet_rows_db:
            delta = coin_balances.get(user_id, 0)
            new_balance = max(0, int(balance or 0) + delta)
            wallet_updates.append({"user_id": user_id, "coin_balance": new_balance})

        if wallet_updates:
            stmt = (
                update(UserWallet)
                .where(UserWallet.user_id == bindparam("user_id"))
                .values(coin_balance=bindparam("coin_balance"))
            )
            await session.execute(stmt, wallet_updates)
            await session.commit()

        print("Seed completed.")

