import requests
import time
import base64
from PIL import Image
import io
import os
from app.core.config import settings
from app.schemas.character import CharacterCreate
from fastapi import APIRouter, Depends, HTTPException
from app.api.v1.deps import get_headers_api
from app.services.app_config import get_config_value_from_cache
from typing import Optional
import datetime
async def build_character_prompt(
    name: str,
    bio: Optional[str],
    gender: str,
    style: Optional[str] = "Realistic",
    ethnicity: Optional[str] = "Caucasian",
    age: Optional[int] = 18,
    eye_colour: Optional[str] = "Black",
    hair_style: Optional[str] = "Curly",
    hair_colour: Optional[str] = "Black",
    body_type: Optional[str] = "Fit",
    breast_size: Optional[float] = "Medium",
    butt_size: Optional[float] = "Medium",
    dick_size: Optional[str] = "Average",
    personality: Optional[str] = "Caregiver",
    voice_type: Optional[str] = "Naughty",
    relationship_type: Optional[str] = "Friend",
    clothing: Optional[str] = "Hoodie",
    special_features: Optional[str] = "Tattoos",
    positive_prompt: Optional[str] = "--Ultra-detailed, 8K resolution, cinematic lighting",
    negative_prompt: Optional[str] = "--no blur,--no watermark,--no extra limbs,--no distortion."
) -> str:
    """
    Generate a high-quality character prompt for Flux-style image generation.
    Matches schema of characters table.
    """
    parts: list[str] = []

    # Intro
    intro = f"{style} style portrait of {name}"
    if age:
        intro += f", a {age}-year-old"
    if ethnicity:
        intro += f" {ethnicity.lower()}"
    intro += f" {gender}"
    
    parts.append(intro)

    # Body and appearance
    if body_type:
        parts.append(f"with a {body_type} build")
    if gender == "Girl" or gender == "Trans":
        if breast_size:
            parts.append(f"breast size {breast_size}")
        if butt_size:
            parts.append(f"butt size {butt_size}")
    else:
        if dick_size:
            parts.append(f"{dick_size} dick")
    if eye_colour:
        parts.append(f"{eye_colour} eyes")
    if hair_colour or hair_style:
        parts.append(f"{hair_colour or ''} {hair_style or ''} hair".strip())
    if clothing:
        parts.append(f"wearing {clothing}")

    # Extra descriptive traits
    if personality:
        parts.append(f"personality: {personality}")
    if voice_type:
        parts.append(f"voice: {voice_type}")
    if relationship_type:
        parts.append(f"relationship: {relationship_type}")
    if special_features:
        parts.append(f"special features: {special_features}")

    # User instructions
    if bio:
        parts.append(f"— {bio}")

    # Join prompt
    prompt = ", ".join(parts)
    if positive_prompt:
        prompt += f" --{positive_prompt}"
    # Negative prompts
    if negative_prompt:
        prompt += f" --{negative_prompt}"

    return prompt

async def enhance_prompt(prompt):
    try :
        url = await get_config_value_from_cache("PROMPT_ENHANCE_URL")
        username = await get_config_value_from_cache("IMAGE_GEN_USERNAME")
        payload = { "query" : prompt, "username": username}
        headers = await get_headers_api()
        response = requests.post(url=url, headers=headers, json=payload)
        json_resp = response.json()
        if json_resp["status"].lower() == "success" :
            enhanced_prompt = json_resp["data"]["prompt"]
        return enhanced_prompt
    except:
        return prompt
        
async def generate_image_request(prompt, num_images,initial_image,size_orientation):
    apiurl = await get_config_value_from_cache("IMAGE_GEN_URL")
    ai_model = await get_config_value_from_cache("IMAGE_GEN_MODEL")
    weight = await get_config_value_from_cache("IMAGE_GEN_WEIGHT")
    steps = await get_config_value_from_cache("IMAGE_GEN_STEPS")
    cfg_scale = await get_config_value_from_cache("IMAGE_GEN_CFG_SCALE")
    positive_prompt = await get_config_value_from_cache("IMAGE_GEN_POSITIVE_PROMPT")
    negative_prompt = await get_config_value_from_cache("IMAGE_GEN_NEGATIVE_PROMPT")
    username = await get_config_value_from_cache("IMAGE_GEN_USERNAME")

    headers = await get_headers_api()
    print('Headers:', headers)
    data = {"query" : prompt,
            "num_images" : num_images,
            "ai_model" : ai_model,
            "size" : size_orientation,
            "initial_image" : initial_image,
            "weight" : weight,
            "pos_prompt" : positive_prompt,
            "neg_prompt" : negative_prompt,
            "steps" : steps,
            "cfg_scale" : cfg_scale,
            "username" : username 
            }
    print('Image Generation Payload:', data)
    response = requests.post(apiurl, headers = headers, json=data)
    print('Image Generation Response:', response.text, response.status_code)
    return response

def save_image_to_local_storage(image_data_str, filepath):
    """
    Save base64 image data to a local file.

    Parameters
    ----------
    image_data : bytes
        The binary image data to save.
    file_path : str
        The path where the image will be saved.
    """
    image_data = base64.b64decode(image_data_str)
    image = Image.open(io.BytesIO(image_data))

    image.save(filepath)  # Save as
    print(f"Image saved to {filepath}")

async def generate_username_filename(username: str) -> str:
    safe_username = username.replace(" ", "_").lower()
    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"{safe_username}_{timestamp}"
    return filename


