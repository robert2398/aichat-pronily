"""
Dependency overrides for authentication and roles.
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from app.services.auth import AuthService
from app.models.user import User
from app.models.user import RoleEnum
from app.core.database import get_db
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
) -> User:
    user = await AuthService.get_user_from_token(token, db)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
        )
    return user

async def require_admin(
    current_user: User = Depends(get_current_user),
) -> User:
    if current_user.role != RoleEnum.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Require Admin Role",
        )
    return current_user

async def get_headers_api() -> dict[str, str]:
    """
    Return headers for sending RUNPOD SERVERLESS API REQUEST.

    Returns
    -------
    dict[str, str]
        Headers including authorization token.
    """
    headers =  {"API-Key": f"Bearer {settings.API_TOKEN}",
        "Content-Type": "application/json"}
    return headers
