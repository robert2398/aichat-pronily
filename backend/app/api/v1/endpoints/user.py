####  app/api/v1/endpoints/password_reset.py

from fastapi import APIRouter, Depends, HTTPException, status, Request, Response, Form, File, UploadFile
from typing import Optional
from fastapi.responses import JSONResponse
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime
import re
from app.api.v1.deps import get_current_user
from app.models.user import UserProfile
from app.schemas.user import ProfileUpsertRequest
from app.core.database import get_db
from app.core.aws_s3 import generate_presigned_url, upload_to_s3_file
from app.services.character_media import generate_filename_timestamped
from app.services.app_config import get_config_value_from_cache
router = APIRouter()

@router.post("/add-update-profile")
async def add_update_profile(
    full_name: Optional[str] = Form(None),
    email: Optional[str] = Form(None),
    username: Optional[str] = Form(None),
    gender: Optional[str] = Form(None),
    birth_date: Optional[str] = Form(None),
    file: UploadFile | None = File(None),
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Create or update the authenticated user's profile.
    """
    # 1. find existing profile
    stmt = select(UserProfile).where(UserProfile.user_id == user.id)
    profile = (await db.execute(stmt)).scalar_one_or_none()

    # prefer email form field, then email_id, then fallback to user.email
    new_email_value = email or None

    if profile:
        # update fields if provided
        if full_name is not None:
            profile.full_name = full_name
        if username is not None:
            profile.username = username
        if gender is not None:
            profile.gender = gender
        if birth_date is not None:
            try:
                profile.birth_date = datetime.fromisoformat(birth_date).date()
            except Exception:
                raise HTTPException(status_code=400, detail="Invalid birth_date format, use YYYY-MM-DD")
        # if a file was uploaded, upload to S3 and set profile_image_url to the s3 key
        if file is not None:
            # determine extension from content_type and normalize
            content_type = file.content_type or "application/octet-stream"
            file_extension = (content_type.split("/")[-1] or "").lower()
            if file_extension in ("jpeg", "pjpeg"):
                file_extension = "jpg"
            elif file_extension == "jpg":
                file_extension = "jpg"
            elif file_extension == "png":
                file_extension = "png"
            else:
                # fallback to using raw subtype
                file_extension = re.sub(r"[^a-z0-9]+", "", file_extension)
            # filename base from email
            filename_base = new_email_value or user.email
            # sanitize filename base (remove @, ., spaces, etc)
            filename_base_clean = re.sub(r"[^A-Za-z0-9_-]", "", (filename_base or "").lower())
            filename = await generate_filename_timestamped(filename_base_clean)
            s3_key = f"profile_pic/{filename}.{file_extension}"
            bucket_name = await get_config_value_from_cache("AWS_BUCKET_NAME")
            # file.file is a SpooledTemporaryFile or file-like; pass directly
            await upload_to_s3_file(file.file, s3_key=s3_key, content_type=content_type, bucket_name=bucket_name)
            profile.profile_image_url = s3_key

        await db.commit()
        await db.refresh(profile)
        return JSONResponse(content={"message": "Profile updated", "profile_id": profile.id}, status_code=200)

    # create new profile
    new_profile = UserProfile(
        user_id=user.id,
        full_name=full_name,
        email_id=new_email_value or user.email,
        username=username,
        gender=gender,
    )
    if birth_date is not None:
        try:
            new_profile.birth_date = datetime.fromisoformat(birth_date).date()
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid birth_date format, use YYYY-MM-DD")

    # handle file upload for new profile
    if file is not None:
        content_type = file.content_type or "application/octet-stream"
        file_extension = (content_type.split("/")[-1] or "").lower()
        if file_extension in ("jpeg", "pjpeg"):
            file_extension = "jpg"
        elif file_extension == "jpg":
            file_extension = "jpg"
        elif file_extension == "png":
            file_extension = "png"
        else:
            file_extension = re.sub(r"[^a-z0-9]+", "", file_extension)
        filename_base = new_email_value or user.email
        filename_base_clean = re.sub(r"[^A-Za-z0-9_-]", "", (filename_base or "").lower())
        filename = await generate_filename_timestamped(filename_base_clean)
        s3_key = f"profile_pic/{filename}.{file_extension}"
        bucket_name = await get_config_value_from_cache("AWS_BUCKET_NAME")
        await upload_to_s3_file(file.file, s3_key=s3_key, content_type=content_type, bucket_name=bucket_name)
        new_profile.profile_image_url = s3_key

    db.add(new_profile)
    try:
        await db.commit()
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

    await db.refresh(new_profile)
    return JSONResponse(content={"message": "Profile created", "profile_id": new_profile.id}, status_code=201)


@router.get("/get-profile")
async def get_profile(
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Return the authenticated user's profile. If no profile exists, return the user's email and null for other fields.
    """
    stmt = select(UserProfile).where(UserProfile.user_id == user.id)
    profile = (await db.execute(stmt)).scalar_one_or_none()

    if not profile:
        return JSONResponse(
            content={
                "email": user.email,
                "full_name": None,
                "username": None,
                "gender": None,
                "birth_date": None,
                "profile_image_url": None,
                "created_at": None,
                "updated_at": None,
                "profile_id": None,
            },
            status_code=200,
        )

    # profile exists — serialize dates to ISO
    def _iso(v):
        try:
            return v.isoformat() if v is not None else None
        except Exception:
            return None

    return JSONResponse(
        content={
            "email": profile.email_id or user.email,
            "full_name": profile.full_name,
            "username": profile.username,
            "gender": profile.gender,
            "birth_date": _iso(profile.birth_date),
            "profile_image_url": await generate_presigned_url(profile.profile_image_url),
            "created_at": _iso(profile.created_at),
            "updated_at": _iso(profile.updated_at),
            "profile_id": profile.id,
        },
        status_code=200,
    )

