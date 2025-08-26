# app/api/v1/endpoints/password_reset.py
import datetime , uuid
from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from fastapi.responses import JSONResponse
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from passlib.context import CryptContext

from app.core.database import get_db
from app.models.user            import User
from app.models.password_reset  import PasswordReset
from app.schemas.user           import ForgotPasswordRequest, ResetPasswordConfirm
from app.core.security          import create_reset_code, hash_password, verify_password
from app.core.config            import settings
from app.core.templates         import templates
from app.services.email import send_email

router = APIRouter()
pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")

RESET_EXP_MINUTES = 30

# ──────────────────────────────────────────────────────────────────────────
@router.post("/password-reset/request")
async def forgot_password(
    payload: ForgotPasswordRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    stmt = select(User).where(User.email == payload.email.lower())
    user: User | None = (await db.execute(stmt)).scalar_one_or_none()
    if not user:
        # don't reveal existence
        return {"message": "If the e-mail exists, a reset link was sent."}

    raw_token, hashed = create_reset_code()
    expires_at = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(minutes=RESET_EXP_MINUTES)

    reset = PasswordReset(
        user_id=user.id,
        code_hash=hashed,
        expires_at=expires_at,
    )
    db.add(reset)
    await db.commit()

    reset_url = (
        f"{settings.BACKEND_URL}/api/{settings.API_ENDPOINT_VERSION}/auth/reset-password?"
        f"uid={reset.id}&token={raw_token}"
    )
    html = templates.get_template("reset_password.html").render(
        full_name=user.full_name or "",
        reset_link=reset_url,
        year=datetime.datetime.now(datetime.timezone.utc).year,
    )
    # await send_email(
    #     subject="Reset your AI Friend Chat password",
    #     to=[user.email],
    #     html=html,
    # )
    #return {"message": "If the e-mail exists, a reset link was sent."}
    return JSONResponse(content={"message": "reset link was sent",
                                     "emailcontent" : html}, status_code=202)

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
    if not pwd_ctx.verify(payload.token, pr.code_hash):
        raise HTTPException(status_code=400, detail="Invalid or expired token")

    # 3. Update user password
    user.hashed_password = hash_password(payload.new_password)
    pr.consumed_at       = datetime.datetime.now(datetime.timezone.utc)

    # 4. Invalidate all refresh tokens
    await db.execute(
        update(User).where(User.id == user.id).values(hashed_password=user.hashed_password)
    )
    await db.commit()
    #return {"message": "Password updated. Please log in."}
    return JSONResponse(content={"message": "Password updated. Please log in"},
                         status_code=200)

