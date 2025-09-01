"""
Character endpoints for AI Friend Chatbot.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse
from sqlalchemy import func, select, delete, insert, cast, String
from app.schemas.character_media import ImageCreate
from app.api.v1.deps import get_current_user
from app.core.database import get_db
from app.models.character_media import CharacterMedia
from app.models.user import User
from app.core.config import settings
from app.core.aws_s3 import upload_to_s3_file, get_file_from_s3_url
from app.services.character_media import build_image_prompt, fetch_image_as_base64
from app.services.characters import generate_image, generate_filename_timestamped
from app.core.aws_s3 import generate_presigned_url
from app.services.app_config import get_config_value_from_cache
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
import requests
import os
import base64
from io import BytesIO
from PIL import Image
import asyncio

router = APIRouter()

@router.post("/create-image")
async def create_image(
    image: ImageCreate,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    positive_prompt = await get_config_value_from_cache("IMAGE_POSITIVE_PROMPT")
    negative_prompt = await get_config_value_from_cache("IMAGE_NEGATIVE_PROMPT")
    prompt = await build_image_prompt(
        image.pose,
        image.background,
        image.outfit,
        positive_prompt,
        negative_prompt,
    )
    print("Prompt Generated:", prompt)

    # Convert input image to base64 once
    base64_image = await fetch_image_as_base64(image.image_s3_url)

    # number of parallel images to request
    num_images = image.num_images if hasattr(image, "num_images") else 1

    # Inside create_image

    async def generate_only(idx: int):
        """Generate image + upload to S3. Return presigned URL + s3_key."""
        response = await generate_image(
            prompt,
            num_images=1,
            initial_image=base64_image,
            size_orientation=image.orientation,
        )
        if response.status_code != 200:
            raise HTTPException(status_code=500, detail=f"Image generation failed at index {idx}")

        json_resp = response.json()
        img_data = json_resp["data"]["images_data"][0]
        img_bytes = base64.b64decode(img_data)
        image_file = BytesIO(img_bytes)

        user_role = (user.role if user else "USER").lower()
        user_id = str(user.id)
        current_name = f"{image.name}_image_{idx}"
        filename = await generate_filename_timestamped(current_name)
        s3_key = f"image/{user_role}/{user_id}/{filename}.png"
        bucket_name = await get_config_value_from_cache("AWS_BUCKET_NAME")
        s3_key, presigned_s3_url = await upload_to_s3_file(
            file_obj=image_file,
            s3_key=s3_key,
            content_type="image/png",
            bucket_name=bucket_name,
        )

        return {"s3_key": s3_key, "url": presigned_s3_url}

    # run generation + s3 upload concurrently
    tasks = [generate_only(i) for i in range(num_images)]
    results = await asyncio.gather(*tasks)

    # now save DB records sequentially (safe)
    list_presigned_images = []
    for r in results:
        db_character_media = CharacterMedia(
            user_id=user.id,
            character_id=image.character_id,
            media_type="image",
            s3_path=r["s3_key"],
        )
        db.add(db_character_media)
        await db.commit()
        await db.refresh(db_character_media)
        list_presigned_images.append(r["url"])


    return JSONResponse(
        content={
            "message": "Images created successfully",
            "image_paths": list_presigned_images,
        },
        status_code=200,
    )

@router.get("/get-users-character-media", status_code=200)
async def get_users_character_images(
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Fetch images for the current user
    images = await db.execute(select(CharacterMedia).where(CharacterMedia.user_id == user.id).order_by(CharacterMedia.created_at.desc()))
    image_list = images.scalars().all()
    if not image_list:
        raise HTTPException(status_code=404, detail="No images found")
    # Convert ORM objects to JSON-serializable dicts
    images_serialized = []
    for im in image_list:
        images_serialized.append({
            "id": im.id,
            "character_id": im.character_id,
            "user_id": im.user_id,
            "media_type": im.media_type,
            "s3_path_gallery": await generate_presigned_url(im.s3_path),
            "mime_type": im.mime_type,
            "created_at": im.created_at.isoformat() if im.created_at is not None else None,
        })

    return JSONResponse(
        content={
            "message": "Images retrieved successfully",
            "images": images_serialized,
        },
        status_code=200,
    )

@router.get("/get-default-character-images", status_code=200)
async def get_default_character_images(
    db: AsyncSession = Depends(get_db)
):
    # Fetch images uploaded by users with role 'ADMIN' (case-insensitive)
    stmt = (
        select(CharacterMedia)
        .join(User, CharacterMedia.user_id == User.id)
        # User.role is an ENUM in Postgres; cast to text before calling lower()
        .where(func.lower(cast(User.role, String)) == "admin")
        .order_by(CharacterMedia.created_at.desc())
    )
    images = await db.execute(stmt)
    image_list = images.scalars().all()
    if not image_list:
        raise HTTPException(status_code=404, detail="No images found")
    # Convert ORM objects to JSON-serializable dicts
    images_serialized = []
    for im in image_list:
        images_serialized.append({
            "id": im.id,
            "character_id": im.character_id,
            "user_id": im.user_id,
            "media_type": im.media_type,
            "s3_path_gallery": await generate_presigned_url(im.s3_path),
            "mime_type": im.mime_type,
            "created_at": im.created_at.isoformat() if im.created_at is not None else None,
        })

    return JSONResponse(
        content={
            "message": "Images retrieved successfully",
            "images": images_serialized,
        },
        status_code=200,
    )