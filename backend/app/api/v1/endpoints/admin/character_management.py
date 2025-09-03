from fastapi import APIRouter, Depends, HTTPException
import asyncio
from app.schemas.character import CharacterCreate
from app.api.v1.deps import get_db
from app.api.v1.deps import require_admin
from app.models.character import Character
from app.models.user import User
from app.schemas.character import CharacterCreate, CharacterRead
from app.api.v1.deps import get_current_user
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.services.character_media import generate_image
from app.core.aws_s3 import generate_presigned_url
from app.services.app_config import get_config_value_from_cache
from typing import List, Dict
import urllib.parse
router = APIRouter()

@router.get("/get-all", dependencies=[Depends(require_admin)], response_model=List[CharacterRead])
async def list_characters(
    db: AsyncSession = Depends(get_db)
):
    """List all characters, including their images and creator's role."""
    # Select explicit character columns and the user's role as creator_role.
    # Returning Pydantic models from the row._mapping avoids a manual Python loop that
    # re-attaches the role to each Character instance.
    result = await db.execute(
        select(
            Character.id,
            Character.user_id,
            Character.username,
            Character.bio,
            Character.name,
            Character.gender,
            Character.style,
            Character.ethnicity,
            Character.age,
            Character.eye_colour,
            Character.hair_style,
            Character.hair_colour,
            Character.body_type,
            Character.breast_size,
            Character.butt_size,
            Character.dick_size,
            Character.personality,
            Character.voice_type,
            Character.relationship_type,
            Character.clothing,
            Character.special_features,
            Character.image_url_s3,
            Character.updated_at,
            Character.created_at,
            User.role.label("creator_role"),
        )
        .join(User, Character.user_id == User.id)
        .order_by(Character.created_at.desc())
    )

    rows = result.all()
    # Build CharacterRead instances directly from the SQL row mapping.
    return [CharacterRead.model_validate(row._mapping) for row in rows]



@router.put("/{character_id}/edit", dependencies=[Depends(require_admin)])
async def edit_character(character_id: int, character_data: CharacterCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Character).where(Character.id == character_id))
    character = result.scalar_one_or_none()
    if not character:
        raise HTTPException(status_code=404, detail="Character not found")

    # Image generation/polling removed in this admin endpoint (functionality handled elsewhere).

    # Update all fields from character_data
    for field, value in character_data.model_dump().items():
        setattr(character, field, value)
    await db.commit()
    await db.refresh(character)
    return {"detail": f"Character {character_id} has been updated"}


@router.post("/{character_id}/delete", dependencies=[Depends(require_admin)])
async def delete_character(character_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Character).where(Character.id == character_id))
    character = result.scalar_one_or_none()
    if not character:
        raise HTTPException(status_code=404, detail="Character not found")
    await db.delete(character)
    await db.commit()
    return {"detail": f"Character {character_id} has been deleted"}


@router.post("/presigned-urls-by-ids", dependencies=[Depends(require_admin)])
async def get_presigned_urls_by_ids(payload: Dict[int, str]):
    """
    Accepts a JSON object mapping ids to S3 values (either full S3 URLs or S3 keys).
    Returns a mapping of the same ids to generated pre-signed GET URLs.
    Example request body: {"1": "s3://bucket/path/to/object", "2": "https://bucket.s3.amazonaws.com/path/to/obj"}
    """
    if not payload:
        raise HTTPException(status_code=400, detail="Payload cannot be empty")

    # Resolve bucket name once to help parse URLs that include the bucket in the path
    # bucket_name = await get_config_value_from_cache("AWS_BUCKET_NAME")

    result = {}
    for id_key, s3_value in payload.items():
        try:
            # # If value looks like a URL, extract the S3 key portion
            # s3_key = None
            # if isinstance(s3_value, str) and (s3_value.startswith("http://") or s3_value.startswith("https://")):
            #     parsed = urllib.parse.urlparse(s3_value)
            #     # Handle virtual-hosted style: bucket.s3.amazonaws.com/key
            #     if parsed.netloc.endswith("s3.amazonaws.com"):
            #         host_bucket = parsed.netloc.split('.')[0]
            #         if host_bucket == bucket_name:
            #             s3_key = parsed.path.lstrip('/')
            #         else:
            #             # path may be /bucket/key
            #             path_parts = parsed.path.lstrip('/').split('/', 1)
            #             if len(path_parts) > 1 and path_parts[0] == bucket_name:
            #                 s3_key = path_parts[1]
            #             else:
            #                 # fallback to path as key
            #                 s3_key = parsed.path.lstrip('/')
            #     else:
            #         # Not an S3-hosted domain (could be CloudFront or custom domain) - use path portion
            #         s3_key = parsed.path.lstrip('/')
            # else:
            #     # Treat value as a raw S3 key
            #     s3_key = s3_value

            # if not s3_key:
            #     raise ValueError(f"Unable to determine S3 key from value: {s3_value}")

            # presigned = await generate_presigned_url(s3_key)
            presigned = await generate_presigned_url(s3_key = s3_value)
            # Ensure returned key is JSON-serializable as the same key type as input (coerce to int when possible)
            try:
                result[int(id_key)] = presigned
            except Exception:
                result[id_key] = presigned
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to generate presigned url for id {id_key}: {e}")

    return result



