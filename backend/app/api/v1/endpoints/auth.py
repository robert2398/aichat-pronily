"""
Auth endpoints for signup, login, refresh.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, insert, update
#from sqlalchemy.future import select
from fastapi.responses import RedirectResponse
from sqlalchemy.exc import IntegrityError
from app.schemas.user import UserCreate
from app.models.subscription import UserWallet
from app.schemas.auth import (
    LoginRequest,
    LoginResponse,
    SetPasswordRequest,
    ForgotPasswordRequest,
    ResetPasswordConfirm,
    ChangePasswordRequest,
    MessageResponse,
)
from app.models.user import User, UserProfile
from app.models.refresh_token import RefreshToken
from app.models.email_verification import EmailVerification
from app.models.user import UserActivation
from app.core.database import get_db
from app.api.v1.deps import get_current_user
from app.core.templates import templates
from app.core.config import settings
from app.services.email import send_email
from app.services.app_config import get_config_value_from_cache
from passlib.context import CryptContext
import uuid
from fastapi.responses import JSONResponse
from secrets import token_urlsafe
import secrets
import string
from passlib.hash import bcrypt
import datetime

from app.core.security import (
    verify_password,
    create_access_token,
    create_refresh_token, hash_password
)

from app.models.user import UserProfile
from app.models.user import User
from app.models.password_reset import PasswordReset
from app.core.security import create_reset_code, hash_password, verify_password
from app.core.config            import settings
from app.core.templates         import templates
from app.services.email import send_email

COOKIE_NAME = "refresh_token"
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

router = APIRouter()
# ──────────────────────────────────────────────────────────────────────────
@router.post("/password-reset/request")
async def forgot_password(
    payload: ForgotPasswordRequest,
    db: AsyncSession = Depends(get_db),
):
    stmt = select(User).where(User.email == payload.email.lower())
    user: User | None = (await db.execute(stmt)).scalar_one_or_none()
    if not user:
        # don't reveal existence
        return {"message": "If the e-mail exists, password was sent to email."}
    link_ttl_hours = int(await get_config_value_from_cache("SIGNUP_EMAIL_EXPIRY"))
    backend_url = await get_config_value_from_cache("BACKEND_URL")
    api_endpoint = await get_config_value_from_cache("API_ENDPOINT_VERSION")
    company_address = await get_config_value_from_cache("ADDRESS")
    support_email = await get_config_value_from_cache("SUPPORT_EMAIL")
    app_name = await get_config_value_from_cache("APP_NAME")
    expires_at = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=link_ttl_hours)

    # create a reset audit row (optional) and also generate a one-time password
    raw_token, hashed = create_reset_code()
    reset = PasswordReset(
        user_id=user.id,
        code_hash=hashed,
        expires_at=expires_at,
    )
    db.add(reset)
    await db.commit()

    # generate a strong random password (alphanumeric + symbols)
    def _generate_strong_password(length: int = 10) -> str:
        alphabet = string.ascii_letters + string.digits + "!@#$%^&*()-_=+"
        while True:
            pwd = ''.join(secrets.choice(alphabet) for _ in range(length))
            if (
                any(c.islower() for c in pwd)
                and any(c.isupper() for c in pwd)
                and any(c.isdigit() for c in pwd)
                and any(c in "!@#$%^&*()-_=+" for c in pwd)
            ):
                return pwd

    new_password = _generate_strong_password(10)

    # update user's password in DB before sending the email
    user.hashed_password = hash_password(new_password)
    await db.commit()

    reset_url = (
        f"{backend_url}/api/{api_endpoint}/auth/reset-password?"
        f"uid={reset.id}&token={raw_token}"
    )
    html = templates.get_template("reset_password.html").render(
        full_name=user.full_name or "Explorer",
        support_email=support_email,
        app_name=app_name,
        company_address=company_address,
        password=new_password,
        year=datetime.datetime.now(datetime.timezone.utc).year,
    )
    await send_email(
        subject="AI Friend Chat password",
        to=[user.email],
        html=html,
    )
    return {"message": "If the e-mail exists, password was sent to email."}

# ──────────────────────────────────────────────────────────────────────────
@router.post("/password-reset/confirm")
async def reset_password(
    payload: ResetPasswordConfirm,
    db: AsyncSession = Depends(get_db),
):
    # 1. Find pending reset row
    stmt = select(PasswordReset, User).join(User).where(
        PasswordReset.id == payload.uid, #uuid.UUID(payload.token.split(".")[0] or "0"*32),  # safety
        User.email == payload.email.lower(),
        PasswordReset.consumed_at.is_(None),
        PasswordReset.expires_at > datetime.datetime.now(datetime.timezone.utc),
    )
    row = (await db.execute(stmt)).one_or_none()
    if not row:
        raise HTTPException(status_code=400, detail="Invalid or expired token")

    pr: PasswordReset
    user: User
    pr, user = row

    # 2. Verify token
    if not pwd_context.verify(payload.token, pr.code_hash):
        raise HTTPException(status_code=400, detail="Invalid or expired token")

    # 3. Update user password
    user.hashed_password = hash_password(payload.new_password)
    pr.consumed_at = datetime.datetime.now(datetime.timezone.utc)

    # 4. Invalidate all refresh tokens
    await db.execute(
        update(User).where(User.id == user.id).values(hashed_password=user.hashed_password)
    )
    await db.commit()
    return JSONResponse(content={"message": "Password updated. Please log in"},
                         status_code=200)

@router.post("/signup")
async def signup(user: UserCreate, db: AsyncSession = Depends(get_db)):
    try:
        print("[DEBUG] Start signup endpoint")
        try:
            print("[DEBUG] Hashing password")
            hashed_pw = pwd_context.hash(user.password)
            full_name = (user.email).split('@')[0].replace('.', ' ')
            print("[DEBUG] Creating User object")
            db_user = User(
                email=user.email,
                hashed_password=hashed_pw,
                full_name=full_name, 
                is_active=True,
                is_email_verified=False,
            )
            print("[DEBUG] Adding user to DB session")
            db.add(db_user)
            await db.commit()
            print("[DEBUG] Refreshing user from DB")
            await db.refresh(db_user)
        except IntegrityError:
            print("[DEBUG] IntegrityError: Email already registered")
            await db.rollback()
            raise HTTPException(status_code=400, detail="Email already registered")
        print("[DEBUG] User created with id:", db_user.id)
        user_id = db_user.id
        print("[DEBUG] Generating email verification token")
        raw_token = token_urlsafe(32)          # send THIS to the user
        tok_hash  = bcrypt.hash(raw_token)     # store only the hash
        signup_expiry_hours = int(await get_config_value_from_cache("SIGNUP_EMAIL_EXPIRY"))
        company_address = await get_config_value_from_cache("ADDRESS")
        support_email = await get_config_value_from_cache("SUPPORT_EMAIL")
        app_name = await get_config_value_from_cache("APP_NAME")

        expires_at = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=signup_expiry_hours)
        print("[DEBUG] Creating EmailVerification object")
        email_ver = EmailVerification(
            user_id=user_id,
            code_hash=tok_hash,
            sent_to_email=user.email,
            expires_at=expires_at,
        )
        print("[DEBUG] Adding email_ver to DB session")
        db.add(email_ver)
        await db.commit()
        print("[DEBUG] EmailVerification committed")
        print("[DEBUG] Building verify_url")
        backend_url = await get_config_value_from_cache("BACKEND_URL")
        api_version = await get_config_value_from_cache("API_ENDPOINT_VERSION")
        verify_url = (
            f"{backend_url}/api/{api_version}/auth/verify-email?token={raw_token}"
            f"&uid={email_ver.id}"
        )
        print("[DEBUG] Rendering email template")
        html = templates.get_template("verify_email.html").render(
            app_name=app_name,
            link_ttl_hours = signup_expiry_hours,
            support_email = support_email,
            company_address = company_address,
            full_name=full_name,
            verify_link=verify_url,
            year=datetime.datetime.now(datetime.timezone.utc).year,
        )
        print("[DEBUG] Email HTML rendered : ", html)
        print("[DEBUG] verification email to:", user.email)
        await send_email(
            subject="Please verify your email",
            to=[user.email],
            html=html,
        )
        return JSONResponse(content={"message": "Email Verification sent",
                                     "emailcontent" : html}, status_code=201)
    except Exception as e:
        import traceback
        print("[ERROR] Internal server error in signup:", e)
        traceback.print_exc()
        return JSONResponse(content={"error": str(e)}, status_code=500)

@router.get("/verify-email")
async def verify_email(uid: uuid.UUID, token: str, db: AsyncSession = Depends(get_db)):
    stmt = select(EmailVerification).where(
        EmailVerification.id == uid,
        EmailVerification.consumed_at.is_(None),
        EmailVerification.expires_at > datetime.datetime.now(datetime.timezone.utc),
    )
    ev: EmailVerification | None = (await db.execute(stmt)).scalar_one_or_none()
    if not ev or not bcrypt.verify(token, ev.code_hash):
        raise HTTPException(status_code=400, detail="Invalid or expired link")

    # mark consumed + activate user
    ev.consumed_at = datetime.datetime.now(datetime.timezone.utc)
    user = await db.get(User, ev.user_id)
    user.is_email_verified = True
    # ensure a UserProfile exists for this user (create if missing)
    stmt_profile = select(UserProfile).where(UserProfile.user_id == user.id)
    profile = (await db.execute(stmt_profile)).scalar_one_or_none()
    if not profile:
        full_name = user.full_name or (user.email.split('@')[0].replace('.', ' ')) if user.email else None
        new_profile = UserProfile(
            user_id=user.id,
            full_name=full_name,
            email_id=user.email,
        )
        db.add(new_profile)
    await db.commit()

    """
    Get the user's coin balance.
    """
    stmt = select(UserWallet).where(UserWallet.user_id == user.id)
    result = await db.execute(stmt)
    user_wallet = result.scalar_one_or_none()
    if not user_wallet:
        user_wallet = UserWallet(user_id=user.id)
        user_wallet.coin_balance = int(await get_config_value_from_cache("SIGNUP_COIN_REWARD"))
        db.add(user_wallet)
    await db.commit()

    ### --- AUTO-LOGIN LOGIC ---
    access_token = create_access_token(str(user.id))
    raw_refresh, hashed_refresh = create_refresh_token()
    login_expiry_in_days = int(await get_config_value_from_cache("LOGIN_EXPIRY"))
    expires_at = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=login_expiry_in_days)
    await db.execute(
        insert(RefreshToken).values(
            user_id=user.id,
            token_hash=hashed_refresh,
            user_agent=None,
            ip_address=None,
            expires_at=expires_at,
        )
    )
    await db.commit()
    frontend_url = await get_config_value_from_cache("FRONTEND_URL")
    COOKIE_MAX_AGE = int(await get_config_value_from_cache("LOGIN_EXPIRY")) * 60 * 60 * 24
    response = RedirectResponse(url=f"{frontend_url}")
    response.set_cookie(
        key="refresh_token",
        value=raw_refresh,
        max_age=COOKIE_MAX_AGE,
        httponly=True,
        secure=not settings.DEBUG,
        samesite="strict",
        path="/",
    )
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=False,
        secure=not settings.DEBUG,
        samesite="strict",
        path="/",
    )
    return response

    # return JSONResponse(content={"message": "Email Verified successfully",},
    #                                  status_code=200)


@router.get("/activate-user")
async def activate_user(uid: int, token: str, db: AsyncSession = Depends(get_db)):
    """
    Validates the activation link and redirects to the frontend to set a password.
    """
    try:
        stmt = select(UserActivation).where(
            UserActivation.id == uid,
            UserActivation.consumed_at.is_(None),
            UserActivation.expires_at > datetime.datetime.now(datetime.timezone.utc),
        )
        activation: UserActivation | None = (await db.execute(stmt)).scalar_one_or_none()

        if not activation or not bcrypt.verify(token, activation.token_hash):
            frontend_url = await get_config_value_from_cache("FRONTEND_URL")
            error_url = f"{frontend_url}/activation-failed"
            return RedirectResponse(url=error_url)

        frontend_url = await get_config_value_from_cache("FRONTEND_URL")
        redirect_url = f"{frontend_url}/users/set-password?uid={uid}&token={token}"
        print(f"[DEBUG] Redirecting to: {redirect_url}")
        return RedirectResponse(url=redirect_url)

    except Exception as e:
        await db.rollback()
        print(f"[ERROR] User activation link validation failed: {e}")
        try:
            frontend_url = await get_config_value_from_cache("FRONTEND_URL")
            fatal_error_url = f"{frontend_url}/activation-error"
            return RedirectResponse(url=fatal_error_url)
        except Exception as cache_e:
            print(f"Failed to get frontend_url from cache: {cache_e}")
            return JSONResponse(
                status_code=500,
                content={"detail": "A critical error occurred during activation link validation."}
            )

@router.post("/set-password")
async def set_password_after_activation(req: SetPasswordRequest, db: AsyncSession = Depends(get_db)):
    """
    Sets the user's password and activates their account after email validation.
    """
    try:
        stmt = select(UserActivation).where(
            UserActivation.id == req.uid,
            UserActivation.consumed_at.is_(None),
            UserActivation.expires_at > datetime.datetime.now(datetime.timezone.utc),
        )
        activation: UserActivation | None = (await db.execute(stmt)).scalar_one_or_none()

        if not activation or not bcrypt.verify(req.token, activation.token_hash):
            raise HTTPException(status_code=400, detail="Invalid or expired activation link.")

        user = await db.get(User, activation.user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found.")

        user.hashed_password = hash_password(req.password)
        user.is_active = True
        user.is_email_verified = True
        activation.consumed_at = datetime.datetime.now(datetime.timezone.utc)
        
        await db.commit()

        return {"message": f"User {user.email} activated successfully."}

    except Exception as e:
        await db.rollback()
        print(f"[ERROR] Setting password after activation failed: {e}")
        raise HTTPException(status_code=500, detail="An unexpected error occurred.")


@router.post("/login", response_model=LoginResponse)
async def login(
    req: LoginRequest,
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
) -> LoginResponse:
    # 1. locate user
    stmt = select(User).where(User.email == req.email.lower())
    user: User | None = (await db.execute(stmt)).scalar_one_or_none()

    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    if not user.is_email_verified:
        raise HTTPException(status_code=403, detail="E-mail not verified")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="User is blocked or inactive")
    # 2. create tokens
    access_token = create_access_token(str(user.id))
    raw_refresh, hashed_refresh = create_refresh_token()

    # 3. OPTIONAL: rotate -- delete any expired tokens for this user
    await db.execute(
        delete(RefreshToken).where(
            RefreshToken.user_id == user.id,
            RefreshToken.expires_at < datetime.datetime.now(datetime.timezone.utc),
        )
    )

    # 4. insert new refresh row
    login_expiry_in_days = int(await get_config_value_from_cache("LOGIN_EXPIRY"))
    expires_at = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=login_expiry_in_days)
    await db.execute(
        insert(RefreshToken).values(
            user_id=user.id,
            token_hash=hashed_refresh,
            user_agent=request.headers.get("user-agent"),
            ip_address=request.client.host if request.client else None,
            expires_at=expires_at,
        )
    )
    await db.commit()
    COOKIE_MAX_AGE = int(await get_config_value_from_cache("LOGIN_EXPIRY")) * 60 * 60 * 24

    # 5. send cookie (HttpOnly, Secure in prod)
    response.set_cookie(
        key=COOKIE_NAME,
        value=raw_refresh,
        max_age=COOKIE_MAX_AGE,
        httponly=True,
        secure=not settings.DEBUG,
        samesite="strict",
        path="/",
    )

    # include serialized user details in the response
    # ensure we never return None for full_name (UserRead.full_name is required)
    full_name = user.full_name or (user.email.split('@')[0].replace('.', ' ') if user.email else "")

    # Normalize role to return the underlying value or name (avoid Enum representation like 'RoleEnum.ADMIN')
    try:
        role_value = getattr(user.role, "value", None) or getattr(user.role, "name", None) or str(user.role)
    except Exception:
        role_value = str(user.role)

    user_data = {
        "id": user.id,
        "email": user.email,
        "full_name": str(full_name),
        "role": role_value,
        "is_active": bool(user.is_active),
        "is_email_verified": bool(user.is_email_verified),
        "created_at": user.created_at,
        "updated_at": user.updated_at,
    }

    return LoginResponse(access_token=access_token, user=user_data)

@router.post("/change-password", response_model=MessageResponse)
async def change_password(
    req: ChangePasswordRequest,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:
    # Verify old password
    if not verify_password(req.old_password, user.hashed_password):
        raise HTTPException(status_code=403, detail="Old password is incorrect")

    # Ensure the new password is different from the old password
    if req.old_password == req.new_password:
        raise HTTPException(status_code=400, detail="New password must be different from the old password")

    # Update password
    user.hashed_password = hash_password(req.new_password)
    await db.commit()

    return {"message": "Password changed successfully"}