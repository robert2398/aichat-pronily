from app.api.v1.deps import get_headers_api
from app.services.app_config import get_config_value_from_cache
import requests
from typing import Optional

import aiohttp
import base64
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
