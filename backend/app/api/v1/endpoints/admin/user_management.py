from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy import text
from app.models.user import User
from app.models.user import UserActivation
from app.schemas.user import UserRead, AdminUserCreateRequest
from app.api.v1.deps import get_db
from app.api.v1.deps import require_admin
from app.models.character import Character
from app.models.chat import ChatMessage as Chat
from app.schemas.character import CharacterRead
from app.schemas.chat import MessageRead
from app.schemas.user import UserEditRequest
from app.core.templates import templates
from app.services.app_config import get_config_value_from_cache
from app.services.email import send_email
from passlib.context import CryptContext
from passlib.hash import bcrypt
from secrets import token_urlsafe
import datetime
import uuid

from app.schemas.engagement_stats import EngagementStats
from sqlalchemy import func, distinct
from datetime import timedelta

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

@router.get("/", response_model=list[UserRead], dependencies=[Depends(require_admin)])
async def get_all_users(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User))
    users = result.scalars().all()
    return [UserRead.model_validate(user) for user in users]

@router.post("/create", response_model=UserRead, dependencies=[Depends(require_admin)])
async def create_user_by_admin(user_data: AdminUserCreateRequest, db: AsyncSession = Depends(get_db)):
    """
    Create a new user by admin. User receives an email with activation link.
    """
    try:
        # Check if user already exists
        existing_user_query = select(User).where(User.email == user_data.email.lower())
        existing_user = (await db.execute(existing_user_query)).scalar_one_or_none()
        
        if existing_user:
            raise HTTPException(status_code=400, detail="User with this email already exists")
        
        # Create the user without password (will be set during activation)
        db_user = User(
            email=user_data.email.lower(),
            hashed_password=None,  # Will be set during activation
            full_name=user_data.full_name,
            role=user_data.role,
            is_active=False,  # Will be activated when password is set
            is_email_verified=False,  # Will be verified during activation
        )
        
        db.add(db_user)
        await db.commit()
        await db.refresh(db_user)
        
        # Generate activation token
        raw_token = token_urlsafe(32)
        token_hash = bcrypt.hash(raw_token)
        expires_at = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=24)
        
        activation = UserActivation(
            user_id=db_user.id,
            token_hash=token_hash,
            expires_at=expires_at,
        )
        
        db.add(activation)
        await db.commit()
        await db.refresh(activation)
        
        # Send activation email
        try:
            backend_url = await get_config_value_from_cache("BACKEND_URL")
            api_version = await get_config_value_from_cache("API_ENDPOINT_VERSION")
            activation_url = (
                f"{backend_url}/api/{api_version}/auth/activate-user?token={raw_token}"
                f"&uid={activation.id}"
            )
            print("[DEBUG] Activation email link: ", activation_url)
            html = templates.get_template("admin_user_creation.html").render(
                fullName=user_data.full_name,
                email=user_data.email,
                activationLink=activation_url,
                year=datetime.datetime.now(datetime.timezone.utc).year,
            )
            print("[DEBUG] Sending activation email to user : ", html)
            await send_email(
                subject="Welcome to AI Chat - Activate Your Account",
                to=[user_data.email],
                html=html,
            )
        except Exception as email_error:
            # User is created but email failed - log error but don't fail the request
            print(f"[WARNING] Failed to send activation email to {user_data.email}: {email_error}")
        
        return UserRead.model_validate(db_user)
        
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=400, detail="User with this email already exists")
    except Exception as e:
        await db.rollback()
        print(f"[ERROR] Failed to create user: {e}")
        raise HTTPException(status_code=500, detail="Failed to create user")

@router.post("/deactivate/{user_id}", dependencies=[Depends(require_admin)])
async def deactivate_user(user_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_active = False
    await db.commit()
    await db.refresh(user)
    return {"detail": f"User {user_id} has been deactivated"}

@router.post("/activate/{user_id}", dependencies=[Depends(require_admin)])
async def activate_user(user_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_active = True
    await db.commit()
    await db.refresh(user)
    return {"detail": f"User {user_id} has been activated"}

@router.put("/edit/{user_id}", dependencies=[Depends(require_admin)])
async def edit_user(user_id: int, payload: UserEditRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if payload.full_name is not None:
        user.full_name = payload.full_name
    if payload.role is not None:
        user.role = payload.role
    await db.commit()
    await db.refresh(user)
    
    return {"detail": f"User {user_id} updated", "user": {"id": user.id, "full_name": user.full_name, "role": user.role}}
@router.post("/delete/{user_id}", dependencies=[Depends(require_admin)])
async def delete_user(user_id: int, db: AsyncSession = Depends(get_db)):
    # Delete related records first
    await db.execute(
        text("DELETE FROM email_verifications WHERE user_id = :user_id"),
        {"user_id": user_id}
    )
    await db.execute(
        text("DELETE FROM password_resets WHERE user_id = :user_id"),
        {"user_id": user_id}
    )
    await db.execute(
        text("DELETE FROM refresh_tokens WHERE user_id = :user_id"),
        {"user_id": user_id}
    )
    
    # Try to delete user_activations if table exists
    try:
        await db.execute(
            text("DELETE FROM user_activations WHERE user_id = :user_id"),
            {"user_id": user_id}
        )
    except Exception as e:
        # Table doesn't exist yet, skip this deletion
        print(f"[INFO] user_activations table not found, skipping: {e}")
    
    await db.execute(
        text("DELETE FROM users WHERE id = :user_id"),
        {"user_id": user_id}
    )
    await db.commit()
    return {"detail": f"User {user_id} and related records deleted"}



@router.get("/engagement-stats/{user_id}", response_model=EngagementStats, dependencies=[Depends(require_admin)])
async def get_user_engagement_stats(user_id: int, db: AsyncSession = Depends(get_db)):
    # Total messages
    total_messages = await db.scalar(select(func.count(Chat.id)).where(Chat.user_id == user_id))

    # Total sessions
    session_count = await db.scalar(select(func.count(distinct(Chat.session_id))).where(Chat.user_id == user_id))

    # Avg messages per session
    avg_per_session = total_messages / session_count if session_count else 0

    # Messages per character
    char_counts = await db.execute(
        select(Chat.character_id, func.count(Chat.id))
        .where(Chat.user_id == user_id)
        .group_by(Chat.character_id)
    )
    messages_per_character = {str(cid): count for cid, count in char_counts.fetchall()}

    # Content type breakdown
    ct_counts = await db.execute(
        select(Chat.content_type, func.count(Chat.id))
        .where(Chat.user_id == user_id)
        .group_by(Chat.content_type)
    )
    content_type_breakdown = {str(ct): count for ct, count in ct_counts.fetchall()}

    # Role breakdown
    role_counts = await db.execute(
        select(Chat.role, func.count(Chat.id))
        .where(Chat.user_id == user_id)
        .group_by(Chat.role)
    )
    role_breakdown = {role: count for role, count in role_counts.fetchall()}

    # Messages over time (last 30 days)
    date_30_days_ago = datetime.datetime.now(datetime.timezone.utc) - timedelta(days=30)
    daily_counts = await db.execute(
        select(func.date(Chat.created_at), func.count(Chat.id))
        .where(Chat.user_id == user_id)
        .where(Chat.created_at >= date_30_days_ago)
        .group_by(func.date(Chat.created_at))
        .order_by(func.date(Chat.created_at))
    )
    messages_over_time = [{"date": str(date), "count": count} for date, count in daily_counts.fetchall()]

    # Total characters
    total_characters = await db.scalar(select(func.count(Character.id)).where(Character.user_id == user_id))

    # Most used character
    most_used_character = max(messages_per_character.items(), key=lambda x: x[1])[0] if messages_per_character else ""

    # Prompt usage diversity
    prompt_counts = await db.execute(
        select(Character.prompt)
        .where(Character.user_id == user_id)
    )
    prompt_usage_count = len(set(row[0] for row in prompt_counts.fetchall()))

    # Common traits
    trait_counts = {"gender": {}, "style": {}}
    traits = await db.execute(
        select(Character.gender, Character.style)
        .where(Character.user_id == user_id)
    )
    for gender, style in traits.fetchall():
        trait_counts["gender"][gender] = trait_counts["gender"].get(gender, 0) + 1
        trait_counts["style"][style] = trait_counts["style"].get(style, 0) + 1

    return EngagementStats(
        total_messages=total_messages,
        total_sessions=session_count,
        avg_messages_per_session=round(avg_per_session, 2),
        messages_per_character=messages_per_character,
        content_type_breakdown=content_type_breakdown,
        role_breakdown=role_breakdown,
        messages_over_time=messages_over_time,
        total_characters=total_characters,
        most_used_character=most_used_character,
        prompt_usage_count=prompt_usage_count,
        common_traits=trait_counts
    )
