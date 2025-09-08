"""
Character endpoints for AI Friend Chatbot.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse
from sqlalchemy import select, delete, insert, func
from app.schemas.character import CharacterCreate, CharacterRead
from app.api.v1.deps import get_current_user
from app.core.database import get_db
from app.models.character import Character
from app.models.chat import ChatMessage
from app.models.user import User
from app.core.config import settings
from app.core.aws_s3 import upload_to_s3_file, get_file_from_s3_url
from app.services.character_media import generate_image, build_character_prompt, \
                    enhance_prompt, generate_filename_timestamped

from app.core.aws_s3 import generate_presigned_url
from app.services.app_config import get_config_value_from_cache
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
import base64
from io import BytesIO
import datetime
from app.services.subscription import check_user_wallet, deduct_user_coins

router = APIRouter()

@router.post("/create")
async def create_character(
    character: CharacterCreate,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new AI friend character and generate its image."""
    await check_user_wallet(db, user.id, "character")
    positive_prompt = await get_config_value_from_cache("IMAGE_POSITIVE_PROMPT")
    negative_prompt = await get_config_value_from_cache("IMAGE_NEGATIVE_PROMPT")
    prompt = await build_character_prompt(
                    name=character.name,
                    bio=character.bio,
                    gender=character.gender,
                    style=character.style,
                    ethnicity=character.ethnicity,
                    age=character.age,
                    eye_colour=character.eye_colour,
                    hair_style=character.hair_style,
                    hair_colour=character.hair_colour,
                    body_type=character.body_type,
                    breast_size=character.breast_size,
                    butt_size=character.butt_size,
                    dick_size=character.dick_size,
                    personality=character.personality,
                    voice_type=character.voice_type,
                    relationship_type=character.relationship_type,
                    clothing=character.clothing,
                    special_features=character.special_features,
                    positive_prompt=positive_prompt,
                    negative_prompt=negative_prompt
                )
    print('Prompt Generated:', prompt)
    if character.enhanced_prompt:
        prompt = await enhance_prompt(prompt)

    response = await generate_image(prompt, num_images = 1, initial_image = None, size_orientation = "portrait")
    print('Image Generation Response:', response.text)
    if response.status_code == 200:
        json_resp = response.json()
        image_data = json_resp["data"]["images_data"]
        base64_data = image_data[0]
        image_data_bs4 = base64.b64decode(base64_data)
        image_file = BytesIO(image_data_bs4)

        is_image_generated = True

    if not is_image_generated:
        raise HTTPException(status_code=504, detail="Image generation timed out")

    # ##########
    # tmp_filepath = r"./data/character-images/base64_out1.txt"
    # with open(tmp_filepath, "r") as image_file:
    #     base64_image = image_file.read().strip()
    #     image_data = base64.b64decode(base64_image)
    #     image_file = BytesIO(image_data)
    # #######################

    file_extension = "png"
    file_type = "character_image"
    # 3. Save image to S3 storage
    user_role = (user.role if user else "USER").lower()
    user_id = str(user.id)
    username = await generate_filename_timestamped(character.name)
    s3_key = f"{file_type}/{user_role}/{user_id}/{username}.{file_extension}"
    bucket_name = await get_config_value_from_cache("AWS_BUCKET_NAME")
    s3_key, presigned_s3_url = await upload_to_s3_file(file_obj = image_file,
                    s3_key = s3_key,
                    content_type = "image/png", 
                    bucket_name = bucket_name)
 
    # # 4. Save character to DB (example, adjust fields as needed)

    db_character = Character(
                        username=username,
                        bio = character.bio,
                        user_id=user.id,
                        name=character.name,
                        gender=character.gender,
                        age=character.age,
                        ethnicity=character.ethnicity,
                        style=character.style,
                        body_type=character.body_type,
                        hair_colour=character.hair_colour,
                        hair_style=character.hair_style,
                        clothing=character.clothing,
                        eye_colour=character.eye_colour,
                        breast_size=character.breast_size,
                        butt_size=character.butt_size,
                        dick_size=character.dick_size,
                        personality=character.personality,
                        voice_type=character.voice_type,
                        relationship_type=character.relationship_type,
                        special_features=character.special_features,
                        prompt=prompt,
                        image_url_s3=s3_key)

    db.add(db_character)
    await db.commit()
    await db.refresh(db_character)
    await deduct_user_coins(db, user.id, "character")
    return JSONResponse(content={"message": "Character created successfully",
                                     "image_path" : presigned_s3_url}, status_code=200)
    

@router.post("/edit-by-id/{character_id}")
async def edit_character(
    character_id: int,
    character: CharacterCreate,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new AI friend character and generate its image."""
    
    prompt = await build_character_prompt(
                    name=character.name,
                    gender=character.gender,
                    style=character.style,
                    ethnicity=character.ethnicity,
                    age=character.age,
                    eye_colour=character.eye_colour,
                    hair_style=character.hair_style,
                    hair_colour=character.hair_colour,
                    body_type=character.body_type,
                    breast_size=character.breast_size,
                    butt_size=character.butt_size,
                    dick_size=character.dick_size,
                    personality=character.personality,
                    voice_type=character.voice_type,
                    relationship_type=character.relationship_type,
                    clothing=character.clothing,
                    special_features=character.special_features)
    print('Prompt Generated:', prompt)

    # 1. Prepare image generation request
    # url_generate_image = await generate_image_request(prompt)
    
    # # 2. Send get generated image api request
    # is_image_generated, base64_image = get_generated_image(url_generate_image)
    
    # if not is_image_generated or not base64_image:
    #     raise HTTPException(status_code=504, detail="Image generation timed out")

    ##########
    tmp_filepath = r"C:\Users\robert.kumar\aichat\ai-friend-chatbot\backend\data\output3.txt"
    with open(tmp_filepath, "r") as image_file:
        base64_image = image_file.read().strip()
    #######################

    file_extension = "png"
    image_data = base64.b64decode(base64_image)
    image_file = BytesIO(image_data)
    
    # 3. Save image to S3 storage
    user_role = user.role if user else "USER"
    bucket_name = await get_config_value_from_cache("AWS_BUCKET_NAME")
    s3_key, presigned_s3_url = await upload_to_s3_file(file_obj = image_file, file_type = "character_image", 
                      file_name = character.name, user_id = str(user.id), user_role = user_role,
                      folder_date = datetime.datetime.now().strftime("%Y%m%d"), 
                      io_type = "output", 
                      file_extension = file_extension, 
                      content_type = "image/png", 
                      bucket_name = bucket_name)
 
    # 4. Update existing character in DB (instead of creating a new one)
    result = await db.execute(
        select(Character).where(Character.id == character_id, Character.user_id == user.id)
    )
    db_character = result.scalars().first()
    if not db_character:
        raise HTTPException(status_code=404, detail="Character not found")

    # update fields
    db_character.name = character.name
    db_character.gender = character.gender
    db_character.age = character.age
    db_character.ethnicity = character.ethnicity
    db_character.style = character.style
    db_character.body_type = character.body_type
    db_character.hair_colour = character.hair_colour
    db_character.hair_style = character.hair_style
    db_character.clothing = character.clothing
    db_character.eye_colour = character.eye_colour
    db_character.breast_size = character.breast_size
    db_character.butt_size = character.butt_size
    db_character.dick_size = character.dick_size
    db_character.personality = character.personality
    db_character.voice_type = character.voice_type
    db_character.relationship_type = character.relationship_type
    db_character.special_features = character.special_features
    db_character.prompt = prompt
    db_character.image_url_s3 = s3_key

    # persist changes
    db.add(db_character)
    await db.commit()
    await db.refresh(db_character)

    return JSONResponse(content={"message": "Character updated successfully",
                                     "image_path": presigned_s3_url}, status_code=200)


@router.get("/fetch-loggedin-user", response_model=List[CharacterRead])
async def list_characters(
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """List all characters for the logged-in user."""
    result = await db.execute(
        select(Character)
        .where(Character.user_id == user.id)
    )
    characters = result.scalars().all()
    updated_characters = []
    for character in characters:
        char_dict = CharacterRead.model_validate(character).model_dump()
        s3_value = char_dict.get("image_url_s3")
        if s3_value:
            presigned = await generate_presigned_url(s3_key=s3_value)
            char_dict["image_url_s3"] = presigned
        updated_characters.append(CharacterRead(**char_dict))
    return updated_characters


@router.get("/fetch-default", response_model=List[CharacterRead])
async def list_characters(
    db: AsyncSession = Depends(get_db)
):
    """List all default characters created by admin (accessible without authentication)."""
    admin_user_ids_result = await db.execute(
        select(User.id).where(User.role == "ADMIN")
    )
    admin_user_ids = [row[0] for row in admin_user_ids_result.fetchall()]

    result = await db.execute(
        select(Character)
        .where(Character.user_id.in_(admin_user_ids))
    )
    characters = result.scalars().all()
    # Replace image_url_s3 with presigned URL
    updated_characters = []
    for character in characters:
        char_dict = CharacterRead.model_validate(character).model_dump()
        s3_value = char_dict.get("image_url_s3")
        if s3_value:
            presigned = await generate_presigned_url(s3_key=s3_value)
            char_dict["image_url_s3"] = presigned
        updated_characters.append(CharacterRead(**char_dict))
    return updated_characters

@router.get("/fetch-by-id/{character_id}")
async def get_character(
    character_id: int,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get character details."""
    print(f"Fetching character with ID: {character_id} for user ID: {user.id}")
    result = await db.execute(
        select(Character)
        .where(Character.id == character_id, Character.user_id == user.id)
    )
    character = result.scalars().first()
    if not character:
        raise HTTPException(status_code=404, detail="Character not found")
    
    character_dict = CharacterRead.model_validate(character).model_dump()
    # Convert datetime fields to ISO format
    if "created_at" in character_dict and isinstance(character_dict["created_at"], datetime.datetime):
        character_dict["created_at"] = character_dict["created_at"].isoformat()

    return JSONResponse(content={"character": character_dict},
                        status_code=200)

@router.get("/fetch-by-user-id/{user_id}")
async def get_characters_by_user_id(
    user_id: int,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all characters for a given user_id (admin or public use)."""
    print(f"Fetching characters for user ID: {user_id}")
    result = await db.execute(
        select(Character)
        .where(Character.user_id == user_id)
    )
    characters = result.scalars().all()
    output = []
    for character in characters:
        character_dict = CharacterRead.model_validate(character).model_dump()
        if character_dict["image_url_s3"]:
            character_dict["image_url_s3"] = await generate_presigned_url(s3_key = character_dict["image_url_s3"])
        if "created_at" in character_dict and isinstance(character_dict["created_at"], datetime.datetime):
            character_dict["created_at"] = character_dict["created_at"].isoformat()
        if "updated_at" in character_dict and isinstance(character_dict["updated_at"], datetime.datetime):
            character_dict["updated_at"] = character_dict["updated_at"].isoformat()

        output.append({"character": character_dict})
    return JSONResponse(content={"characters": output}, status_code=200)

@router.get("/message-count")
async def get_character_message_count(
    db: AsyncSession = Depends(get_db)
):
    """Return message counts for all characters as a JSON list of
    {"character_id": <id>, "count_message": <count>}.
    Includes characters with zero messages.
    """
    # Left join characters with chat messages so characters with zero
    # messages are included with count 0.
    result = await db.execute(
        select(Character.id, func.count(ChatMessage.id).label("count"))
        .outerjoin(ChatMessage, ChatMessage.character_id == Character.id)
        .group_by(Character.id)
    )

    rows = result.fetchall()
    counts = []
    for row in rows:
        char_id = row[0]
        cnt = int(row[1]) if row[1] is not None else 0
        counts.append({"character_id": char_id, "count_message": cnt})

    return JSONResponse(content=counts, status_code=200)
