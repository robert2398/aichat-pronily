"""
Pydantic schemas for Character.
"""
from pydantic import BaseModel
from typing import Optional, Literal
from datetime import datetime

class CharacterBase(BaseModel):
    username: str
    name: str
    bio: Optional[str]
    gender: str
    style: Optional[str]
    ethnicity: Optional[str]
    age: Optional[int]
    eye_colour: Optional[str]
    hair_style: Optional[str]
    hair_colour: Optional[str]
    body_type: Optional[str]
    breast_size: Optional[str]
    butt_size: Optional[str]
    dick_size: Optional[str]
    personality: Optional[str]
    voice_type: Optional[str]
    relationship_type: Optional[str]
    clothing: Optional[str]
    special_features: Optional[str]
    

class CharacterCreate(CharacterBase):
    enhanced_prompt: Optional[bool]

class CharacterRead(CharacterBase):
    id: int
    user_id: int
    updated_at: datetime
    image_url_s3: Optional[str] = None
    creator_role: Optional[str] = None
    model_config = {
        "from_attributes": True,
    }
