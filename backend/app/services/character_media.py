from app.api.v1.deps import get_headers_api
from app.services.app_config import get_config_value_from_cache
import requests
from typing import Optional
import requests
import base64
from PIL import Image
import io
from app.api.v1.deps import get_headers_api
from app.services.app_config import get_config_value_from_cache
from typing import Optional
import datetime
import aiohttp
import base64
from typing import Optional

# You can tweak these defaults to taste.
_DEFAULT_QUALITY_TAGS = (
    "highly detailed, sharp focus, clean edges, coherent anatomy, natural proportions, "
    "consistent identity across the image, no duplicates of the subject"
)

_DEFAULT_NEGATIVES = (
    "lowres, blurry, jpeg artifacts, watermark, text, logo, oversharpen, "
    "deformed, disfigured, extra limbs, extra fingers, fused fingers, missing fingers, "
    "bad hands, bad feet, mutated, out of frame, cropped face, poor lighting"
)

def _merge_negatives(user_negative: Optional[str]) -> str:
    if not user_negative:
        return _DEFAULT_NEGATIVES
    # De-dupe in a simple, fast way
    base = {t.strip().lower() for t in _DEFAULT_NEGATIVES.split(",")}
    extra = {t.strip().lower() for t in user_negative.split(",")}
    merged = ", ".join(sorted({*base, *extra}))
    return merged

def _clean(value: Optional[str]) -> str:
    return " ".join((value or "").strip().split())

async def build_image_prompt(
    pose: str,
    background: str,
    outfit: str,
    positive_prompt: str,
    negative_prompt: str
) -> str:
    """
    Build a robust image-to-image prompt.

    Notes:
    - The base64 image is assumed to be sent to your image API separately.
      This prompt explicitly instructs the model to use that image as the identity reference.
    - Keep positive/negative prompts short, comma-separated tags work best.
    """
    pose = _clean(pose)
    background = _clean(background)
    outfit = _clean(outfit)
    positive_prompt = _clean(positive_prompt)
    merged_negatives = _merge_negatives(_clean(negative_prompt))

    # Multi-section, model-friendly prompt
    prompt = (
        "TASK: Generate image of the SAME character as the provided base64 reference image. "
        "Use the reference strictly to preserve face, hair, and overall identity. Do not invent new characters.\n\n"
        "REFERENCE: A base64-encoded image will be provided separately as the identity source. "
        "Match distinctive features (face shape, eyes, nose, mouth, hair style/color, skin tone). "
        "Avoid style drift from the reference unless specified.\n\n"
        f"POSE: {pose or 'natural, front-facing'}.\n"
        f"BACKGROUND: {background or 'clean, uncluttered scene that complements the subject'}.\n"
        f"OUTFIT: {outfit or 'outfit that fits the scene; avoid logos/text'}.\n\n"
        "COMPOSITION: Frame the subject clearly; keep the full head and hands in frame if applicable. "
        "Avoid crop-through-face, avoid extreme perspective unless requested.\n"
        "CAMERA & LIGHTING: Realistic lens, balanced exposure, soft natural lighting, gentle contrast, "
        "no harsh color cast unless specified.\n\n"
        f"STYLE & QUALITY: {_DEFAULT_QUALITY_TAGS}.\n\n"
        f"POSITIVE PROMPT: {positive_prompt or 'tasteful, cohesive aesthetics'}.\n"
        f"NEGATIVE PROMPT: {merged_negatives}.\n\n"
        "OUTPUT REQUIREMENTS: No text, no watermark, no signature. "
        "If hands are visible, ensure anatomically correct fingers. "
        "Keep proportions realistic and identity consistent with the reference."
    )

    return prompt

async def fetch_image_as_base64(s3_image_url: str) -> str:
    """
    Download an image from the given presigned S3 URL and return its base64 string.

    Args:
        s3_image_url (str): Presigned URL of the S3 image.

    Returns:
        str: Base64-encoded string of the image.

    Raises:
        ValueError: If the request fails or returns a non-200 status.
    """
    async with aiohttp.ClientSession() as session:
        async with session.get(s3_image_url) as response:
            if response.status != 200:
                raise ValueError(f"Failed to fetch image, status: {response.status}")
            image_bytes = await response.read()
            base64_str = base64.b64encode(image_bytes).decode("utf-8")
            return base64_str

async def generate_video(prompt, duration, video_effect, negative_prompt):
    apiurl = await get_config_value_from_cache("VIDEO_GEN_URL")
    headers = await get_headers_api()
    username = await get_config_value_from_cache("VIDEO_GEN_USERNAME")

    data = {"prompt" : prompt,
            "duration" : duration,
            "negative_prompt" : negative_prompt,
            "video_effect" : video_effect,
            "username" : username }
    response = requests.post(apiurl, headers = headers, json=data)
    return response

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

async def enhance_prompt_video(prompt):
    try :
        url = await get_config_value_from_cache("VIDEO_GEN_PROMPT_ENHANCE")
        username = await get_config_value_from_cache("VIDEO_GEN_USERNAME")
        payload = { "query" : prompt, "username": username}
        headers = await get_headers_api()
        response = requests.post(url=url, headers=headers, json=payload)
        json_resp = response.json()
        if json_resp["status"].lower() == "success" :
            enhanced_prompt = json_resp["data"]["prompt"]
        return enhanced_prompt
    except:
        return prompt

async def generate_image(prompt, num_images, initial_image, size_orientation):
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
    #print('Image Generation Payload:', data)
    response = requests.post(apiurl, headers = headers, json=data)
    print('Image Generation Response:', response.status_code)
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

async def generate_filename_timestamped(username: str) -> str:
    safe_username = username.replace(" ", "_").lower()
    # Use microseconds (%f), then truncate to milliseconds
    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S_%f")[:-3]
    filename = f"{safe_username}_{timestamp}"
    return filename


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

