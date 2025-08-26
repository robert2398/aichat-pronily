"""
Pydantic schemas for Chat and Message.
"""
from pydantic import BaseModel
from typing import Optional
from enum import Enum

class ChatCreate(BaseModel):
    session_id: str
    character_id: int
    user_query: str

class MessageCreate(BaseModel):
    content: str
    is_voice: bool = False

class MessageRead(BaseModel):
    id: int
    session_id: str
    character_id: int
    user_query: str
    ai_message: str
    context_window: Optional[int] = None
    created_at: str

    class Config:
        from_attributes = True