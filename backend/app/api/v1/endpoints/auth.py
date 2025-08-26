"""
Auth endpoints for signup, login, refresh.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, insert
#from sqlalchemy.future import select
from fastapi.responses import RedirectResponse
from sqlalchemy.exc import IntegrityError
from app.schemas.user import UserCreate, LoginRequest, LoginResponse, SetPasswordRequest
from app.models.user import User
from app.models.refresh_token import RefreshToken
from app.models.email_verification import EmailVerification
from app.models.user_activation import UserActivation
from app.core.database import get_db
from app.core.templates import templates
from app.core.config import settings
from app.services.email import send_email
from app.services.app_config import get_config_value_from_cache
from passlib.context import CryptContext
import datetime, uuid
from fastapi.responses import JSONResponse
from secrets import token_urlsafe
from passlib.hash import bcrypt
###login

from app.core.security import (
    verify_password,
    create_access_token,
    create_refresh_token, hash_password
)

COOKIE_NAME = "refresh_token"
COOKIE_MAX_AGE = 60 * 60 * 24 * 30

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

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
        expires_at = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(minutes=15)
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
    await db.commit()

    # --- AUTO-LOGIN LOGIC ---
    # access_token = create_access_token(str(user.id))
    # raw_refresh, hashed_refresh = create_refresh_token()

    # expires_at = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=30)
    # await db.execute(
    #     insert(RefreshToken).values(
    #         user_id=user.id,
    #         token_hash=hashed_refresh,
    #         user_agent=None,
    #         ip_address=None,
    #         expires_at=expires_at,
    #     )
    # )
    # await db.commit()
    frontend_url = await get_config_value_from_cache("FRONTEND_URL")
        
    # response = RedirectResponse(url=f"{frontend_url}")
    # response.set_cookie(
    #     key="refresh_token",
    #     value=raw_refresh,
    #     max_age=60 * 60 * 24 * 30,
    #     httponly=True,
    #     secure=not settings.DEBUG,
    #     samesite="strict",
    #     path="/",
    # )
    # response.set_cookie(
    #     key="access_token",
    #     value=access_token,
    #     httponly=False,
    #     secure=not settings.DEBUG,
    #     samesite="strict",
    #     path="/",
    # )
    # return response

    return JSONResponse(content={"message": "Email Verified successfully",},
                                     status_code=200)


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
    expires_at = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=30)
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

    return LoginResponse(access_token=access_token)


