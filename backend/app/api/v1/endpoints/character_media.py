"""
Character endpoints for AI Friend Chatbot.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse
from sqlalchemy import func, select, delete, insert, cast, String
from app.schemas.character_media import ImageCreate, VideoCreate
from app.api.v1.deps import get_current_user
from app.core.database import get_db
from app.models.character_media import CharacterMedia
from app.models.user import User
from app.core.config import settings
from app.core.aws_s3 import upload_to_s3_file, get_file_from_s3_url
from app.services.character_media import build_image_prompt, fetch_image_as_base64,\
                generate_image, generate_filename_timestamped, generate_video
from app.core.aws_s3 import generate_presigned_url
from app.services.app_config import get_config_value_from_cache
from sqlalchemy.ext.asyncio import AsyncSession
import base64
from io import BytesIO
import asyncio
import requests
import httpx

from fastapi.responses import StreamingResponse

from app.services.subscription import check_user_wallet, deduct_user_coins

router = APIRouter()

@router.post("/create-image")
async def create_image(
    image: ImageCreate,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    await check_user_wallet(db, user.id, "image")
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

    await deduct_user_coins(db, user.id, "image")
    return JSONResponse(
        content={
            "message": "Images created successfully",
            "image_paths": list_presigned_images,
        },
        status_code=200,
    )

@router.post("/create-video")
async def create_video(
    video: VideoCreate,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    await check_user_wallet(db, user.id, "video")
    # Convert input image to base64 once
    # base64_image = await fetch_image_as_base64(image.image_s3_url)

    response = await generate_video(video.prompt, video.duration, 
                                    video.pose, video.negative_prompt)
    if response.status_code != 200:
        raise HTTPException(status_code=500, detail="Video generation failed")
    # json_resp = {"status": "Successfully created video",
    # "data": {"video_url": "https://pornai0001.s3.amazonaws.com/videos/video_68b6fd55dfed14.35141648.mp4",
    # "info": {"ckpt_name":"t2v","pos_prompt":"Ainematic short video of two young couples, all 18+, on a secluded beach at sunset. Couple 1: a male with a muscular build, tanned skin, and a thick, erect penis; a female with a curvy body, full breasts, and a shaved vulva. Couple 2: a male with an athletic frame, veiny erect penis; a female with a slim figure, small breasts, and trimmed vulva. Couple 1 in missionary, her legs wrapped around him; Couple 2 in doggy style, her back arched. Camera pans slowly from a wide ocean view to close-ups of their passionate movements. Mood: sensual, raw.","width":720,"height":1280,"duration":5},
    # "server": "t2v",
    # "created_at": "2025-09-02T14:21:10.345986Z"}}
    
    
    json_resp = response.json()
    print(json_resp["data"]["video_url"])
    
    url = json_resp["data"]["video_url"]
    r = requests.get(url, stream=True, timeout=60)
    r.raise_for_status()
    r.raw.decode_content = True

    user_role = (user.role if user else "USER").lower()
    user_id = str(user.id)

    filename = await generate_filename_timestamped(video.name)
    s3_key = f"video/{user_role}/{user_id}/{filename}.mp4"
    bucket_name = await get_config_value_from_cache("AWS_BUCKET_NAME")
    s3_key, presigned_s3_url = await upload_to_s3_file(
        file_obj=r.raw,
        s3_key=s3_key,
        content_type="video/mp4",
        bucket_name=bucket_name,
    )
    
    db_character_media = CharacterMedia(
            user_id=user.id,
            character_id=video.character_id,
            media_type="video",
            s3_path= s3_key
        )
    db.add(db_character_media)
    await db.commit()
    await db.refresh(db_character_media)
    await deduct_user_coins(db, user.id, "video")
    return JSONResponse(
        content={
            "message": "Images created successfully",
            "video_path": presigned_s3_url,
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

@router.get("/download-proxy")
async def download_proxy(url: str, name: str | None = None):
    filename = name or "download.bin"

    async def body_iter():
        try:
            async with httpx.AsyncClient(follow_redirects=True, timeout=None) as client:
                # Open and KEEP the stream INSIDE the generator
                async with client.stream("GET", url) as r:
                    # raise if 4xx/5xx before we start yielding
                    r.raise_for_status()
                    async for chunk in r.aiter_bytes():
                        yield chunk
        except Exception as e:
            # Do NOT re-raise from inside the generator; just end the stream.
            print("download-proxy stream error:", e)

    headers = {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": f'attachment; filename="{filename}"',
        # Add Cache-Control as you like; CORS is typically handled by middleware
        "Cache-Control": "no-store",
    }
    return StreamingResponse(body_iter(), headers=headers)
 
@router.get("/get-default-character-media", status_code=200)
async def get_default_character_media(
    db: AsyncSession = Depends(get_db)
):
    # Fetch media uploaded by users with role 'ADMIN' (case-insensitive)
    stmt = (
        select(CharacterMedia)
        .join(User, CharacterMedia.user_id == User.id)
        # User.role is an ENUM in Postgres; cast to text before calling lower()
        .where(func.lower(cast(User.role, String)) == "admin")
        .order_by(CharacterMedia.created_at.desc())
    )
    media = await db.execute(stmt)
    media_list = media.scalars().all()
    if not media_list:
        raise HTTPException(status_code=404, detail="No media found")
    # Convert ORM objects to JSON-serializable dicts
    media_serialized = []
    for im in media_list:
        media_serialized.append({
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
            "message": "Media retrieved successfully",
            "media": media_serialized,
        },
        status_code=200,
    )