from datetime import datetime
from pydantic import BaseModel

class CharacterImageRead(BaseModel):
    id: int
    character_id: int
    user_id: int
    s3_path: str
    mime_type: str
    created_at: datetime

    class Config:
        from_attributes = True