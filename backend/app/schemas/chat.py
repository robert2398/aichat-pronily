"""
Pydantic schemas for Chat and Message.
"""
from pydantic import BaseModel
from typing import Optional
from enum import Enum

class ContentType(str, Enum):
    TEXT = "text"
    VOICE = "voice"
    CALL = "call"

class ChatCreate(BaseModel):
    session_id: str
    role: str  # "user" | "assistant" | "system"
    character_id: int
    content_type: ContentType
    user_query: str

class MessageCreate(BaseModel):
    content: str
    is_voice: bool = False

class MessageRead(BaseModel):
    id: int  # Message ID
    session_id: str
    character_id: int
    role: str  # user | assistant | system
    content_type: str  # text, voice, call
    user_query: str
    ai_message: str
    audio_url_user: str | None = None
    audio_url_output: str | None = None
    duration_input: int | None = None
    duration_output: int | None = None
    created_at: str

    class Config:
        from_attributes = True