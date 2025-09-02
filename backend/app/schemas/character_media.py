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
    character_id: int
    name: str
    prompt: str
    duration: int
    negative_prompt: str
    pose: str

class VideoResponse(BaseModel):
    video_url: str
    created_at: datetime