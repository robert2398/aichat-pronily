"""
Pydantic schemas for Image and Video.
"""
from pydantic import BaseModel
from typing import Optional, Literal
from datetime import datetime

class ImageCreate(BaseModel):
    character_id: int
    name: str
    pose: str
    background: str
    outfit: str
    orientation: str
    positive_prompt: Optional[str] = None
    negative_prompt: Optional[str] = None
    num_images: int
    image_s3_url: str

class ImageResponse(BaseModel):
    image_url: str
    created_at: datetime

class VideoCreate(BaseModel):
    prompt: str
    duration: int
    resolution: Literal["720p", "1080p", "4k"] = "1080p"

class VideoResponse(BaseModel):
    video_url: str
    created_at: datetime