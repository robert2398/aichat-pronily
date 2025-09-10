"""
Chat endpoints for AI Friend Chatbot.
"""
from fastapi import APIRouter, Depends, HTTPException, status, WebSocket, Request
from fastapi.responses import StreamingResponse
from app.schemas.chat import ChatCreate, MessageCreate, MessageRead
from app.models.chat import ChatMessage
from app.models.subscription import UserWallet, CoinTransaction
from app.models.character import Character
from app.services.character_media import get_headers_api
from app.services.chat import generate_chat, approximate_token_count                 
from app.api.v1.deps import get_current_user
from app.core.database import get_db
from app.core.config import settings
from app.services.app_config import get_config_value_from_cache
from app.services.subscription import check_user_wallet, deduct_user_coins
from typing import List
import asyncio
import json
import requests
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import Column, select, desc
from fastapi.responses import JSONResponse

import re

def clean_model_output(text: str) -> str:
    """
    Keep only the content after the *last* assistant marker
    and strip junk like analysis, commentary, etc.
    """
    # Always find the last "assistantfinal"
    match = list(re.finditer(r"assistantfinal", text, re.IGNORECASE))
    if match:
        cut = match[-1].end()
        text = text[cut:]
    
    # Remove obvious junk tokens
    text = re.sub(r"(?is)(analysis|reasoning|commentary).*", "", text).strip()
    
    # Clean leftover quotes/braces
    text = text.strip()
    text = text.strip("{}[]\"'")
    
    return text.strip()

router = APIRouter()
#response_model=ChatCreate
@router.get("/all", response_model=List[MessageRead])
async def get_all_chats(user=Depends(get_current_user), user_id: int = None, db: AsyncSession = Depends(get_db)):
    """Get all previous chats for a user (admin) or current user in descending order of creation."""
    query_user_id = user_id if user_id is not None else user.id
    result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.user_id == query_user_id)
        .order_by(desc(ChatMessage.id))
    )
    messages = result.scalars().all()
    def truncate(text, length=2000):
        if text and len(text) > length:
            return text[:length] + "..."
        return text

    return [
        MessageRead(
            id=msg.id,
            session_id=msg.session_id,
            character_id=msg.character_id,
            user_query=truncate(msg.user_query or "", 2000),
            ai_message=truncate(msg.ai_message or "", 2000),
            created_at=str(getattr(msg, "created_at", "")),
        ) for msg in messages
    ]
@router.post("/" )
async def start_chat(chat: ChatCreate, user=Depends(get_current_user),
                     db: AsyncSession = Depends(get_db)):
    await check_user_wallet(db, user.id, "chat")
    headers = await get_headers_api()
    # Fetch last n messages for the session_id, ordered by your timestamp or id
    chat_limit = await get_config_value_from_cache("CHAT_HISTORY_LIMIT")
    username = await get_config_value_from_cache("CHAT_GEN_USERNAME")
    chat_url = await get_config_value_from_cache("CHAT_GEN_URL")
    is_sfw = False
    character_id = chat.character_id
    if character_id:
        result = await db.execute(select(Character).where(Character.id == character_id))
        character = result.scalar_one_or_none()
        # Build a safe JSON string with a few important character fields.
        # The Character model doesn't provide a to_dict() helper, so serialize manually.
        

    
        
        if character:
            char_dict = {
                "style": character.style or "",
                "ethnicity": character.ethnicity or "",
                "age": character.age or 0,
                "eye_colour": character.eye_colour or "",
                "hair_style": character.hair_style or "",
                "hair_colour": character.hair_colour or "",
                "body_type": character.body_type or "",
                "breast_size": character.breast_size or "",
                "butt_size": character.butt_size or "",
                "dick_size": character.dick_size or "",
                "personality": character.personality or "",
                "voice_type": character.voice_type or "",
                "relationship_type": character.relationship_type or "",
                "clothing": character.clothing or "",
                "special_features": character.special_features or "",
            }
            json_character_details = json.dumps(char_dict)
            name = character.name or "Unknown"
            bio = character.bio or ""
            gender = character.gender or ""
        else:
            json_character_details = ""
            name = "Unknown"
            bio = ""
            gender = ""
    ################# DELETE THIS LATER. SHOULD COME FROM UI
    is_sfw = False
    #####################
    if is_sfw :
        system_prompt = await get_config_value_from_cache("CHAT_GEN_PROMPT_SFW")
    else:
        system_prompt = await get_config_value_from_cache("CHAT_GEN_PROMPT_NSFW")
    system_prompt = system_prompt.replace("replace_character_name", name).replace("replace_character_bio", bio).replace("replace_character_gender", gender).replace("replace_character_details", json_character_details)
    result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.session_id == chat.session_id)
        .order_by(desc(ChatMessage.id))  # or .created_at if you have a timestamp
        .limit(chat_limit)  # Limit to last n messages
    )
    last_messages = result.scalars().all()
    last_messages = list(reversed(last_messages))
    messages = []
    messages.append({"role": "system", "content": system_prompt})
    for msg in last_messages:
        messages.append({"role": "user", "content": msg.user_query})
        messages.append({"role": "assistant", "content": msg.ai_message})
    messages.append({"role": "user", "content": chat.user_query})
    token_count = await approximate_token_count(messages)
    data = {
        "messages": messages,
        "stream": False,
        "username" : username
    }
    print('Sending request to chat API with payload : ', data)
    response = requests.post(chat_url, headers=headers, json=data)
    print(response.text)
    if response.status_code != 200:
        raise HTTPException(status_code=502, detail="Chat API error")
    chat_output = response.json()['message']['content']


    # DEFAULT_STOP = ["<think>", "</think>", "Reasoning:", "Analysis:", "[analysis]", "[/analysis]"]
    # data = {
    #     "messages": messages,
    #     "max_new_tokens": 1024,
    #     "temperature": 1.5,
    #     "top_p": 0.95,
    #     "stop": DEFAULT_STOP,
    # }

    # response = requests.post(chat_url, json=data)
    # chat_output = response.json().get("response", "")
    # chat_output = clean_model_output(chat_output)

    new_message = ChatMessage(
        session_id=chat.session_id,
        user_id=user.id,
        character_id=chat.character_id,
        user_query=chat.user_query,
        ai_message=chat_output,
        context_window=token_count
    )
    db.add(new_message)
    await db.commit()
    await deduct_user_coins(db, user.id, "chat")
    return JSONResponse(content={"chat_response": chat_output}, status_code=200)

@router.get("/get-messages", response_model=List[MessageRead])
def get_chat_messages(chat_id: int, user=Depends(get_current_user)):
    """Get paginated chat history."""
    # TODO: Implement message retrieval
    raise NotImplementedError

@router.post("/{chat_id}/messages", response_model=MessageRead)
def send_message(chat_id: int, message: MessageCreate, user=Depends(get_current_user)):
    """Send a message and get AI response (non-streaming)."""
    # TODO: Implement non-streaming AI reply
    raise NotImplementedError

@router.get("/{chat_id}/messages/stream")
async def stream_message(chat_id: int, content: str, user=Depends(get_current_user)):
    """
    Stream AI response for a user message using OpenAI (chunked JSON).
    This is a fully implemented example endpoint.
    """
    async def event_stream():
        # TODO: Replace with real ChatService and OpenAI streaming
        for chunk in ["Hello, ", "this is ", "a streamed ", "AI reply."]:
            await asyncio.sleep(0.3)
            yield f'{json.dumps({"content": chunk})}\n'
        yield '[DONE]\n'
    return StreamingResponse(event_stream(), media_type="text/event-stream")

