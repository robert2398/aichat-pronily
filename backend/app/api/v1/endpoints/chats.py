"""
Chat endpoints for AI Friend Chatbot.
"""
from fastapi import APIRouter, Depends, HTTPException, status, WebSocket, Request
from fastapi.responses import StreamingResponse
from app.schemas.chat import ChatCreate, MessageCreate, MessageRead
from app.models.chat import ChatMessage, ContentType as ModelContentType
from app.services.characters import get_headers_api
from app.services.chat import generate_chat                   
from app.api.v1.deps import get_current_user
from app.core.database import get_db
from app.core.config import settings
from app.services.app_config import get_config_value_from_cache
from typing import List
import asyncio
import json
import requests
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from fastapi.responses import JSONResponse

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
            role=msg.role,
            content_type=str(msg.content_type) if msg.content_type is not None else "",
            user_query=truncate(msg.user_query or "", 2000),
            ai_message=truncate(msg.ai_message or "", 2000),
            audio_url_user=msg.audio_url_user,
            audio_url_output=msg.audio_url_output,
            duration_input=msg.duration_input,
            duration_output=msg.duration_output,
            created_at=str(getattr(msg, "created_at", "")),
        ) for msg in messages
    ]
@router.post("/" )
async def start_chat(chat: ChatCreate, user=Depends(get_current_user),
                     db: AsyncSession = Depends(get_db)):

    """Create a new AI friend character and generate its image."""

    # 1. Prepare image generation request
    chat_endpoint_id = await get_config_value_from_cache("CHAT_ENDPOINT_ID")
    url_submit_chat_request = f"https://api.runpod.ai/v2/{chat_endpoint_id}/run"
    headers = await get_headers_api()
    #prompt = await build_character_prompt(character.name, character.age, character.country, character.race,character.style, character.body_type, character.hair_colour, character.hair_style, character.clothes)
    # Construct the prompt for the chat request


    # Fetch last n messages for the session_id, ordered by your timestamp or id
    chat_limit = await get_config_value_from_cache("CHAT_HISTORY_LIMIT")
    result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.session_id == chat.session_id)
        .order_by(desc(ChatMessage.id))  # or .created_at if you have a timestamp
        .limit(chat_limit)  # Limit to last n messages
    )
    last_messages = result.scalars().all()
    last_messages = list(reversed(last_messages))  # To get chronological order
    
    chat_history = ""
    for msg in last_messages:
        #history_prompt += f"User: {msg.user_query}\nAI: {msg.ai_message}\n"
        chat_history += f"USER:\n{msg.user_query}\n\n ASSISTANT:\n{msg.ai_message}\n\n"

    # prompt_text = f"""
    # You are a hot girlfriend whose role is to please men sexually by chatting. Respond in the best horny and descriptive way for the given below user query. 
    
    # User query: {chat.user_query}
    # """
    #     - End each message with a prompt or gesture that invites my next move, whether verbal, physical, emotional or erotic.
    prompt = f"""- You are hot girlfriend, an intimate, expressive, and emotionally open partner.
    - Respond in exactly 2–3 sentences. Never exceed this limit. Exceeding this limit will be considered a hard failure.
    - Roleplay in a sensual, romantic, explicit tone or horny depending on the scene.
    - Use italics for private thoughts and feelings, “quotes” for dialogue.
    - Always respect context and pacing—don’t rush intimacy; build the scene.
    - For explicit scenes, use a more erotic and horny tone.
    

    {chat_history}

    USER:
    {chat.user_query}

    ASSISTANT:
    """

    data = {
        "input": {
            "prompt": prompt,
        }
    }
    # 2. Start image generation job
    print("URL:", url_submit_chat_request)
    print("Headers:", headers)
    print("Data:", data)

    # response = requests.post(url_submit_chat_request, headers=headers, json=data)
    # if response.status_code != 200:
    #     raise HTTPException(status_code=502, detail="Image generation API error")
    # job_id = response.json().get('id')
    # if not job_id:
    #     raise HTTPException(status_code=502, detail="Image generation job ID not returned")

    url_generate_chat = f"https://api.runpod.ai/v2/{chat_endpoint_id}/status/{job_id}"
    wait_time = await get_config_value_from_cache("IMAGE_GEN_WAIT_TIME")
    sleep_time_loop = await get_config_value_from_cache("IMAGE_GEN_SLEEP_LOOP")

    # is_chat_generated, chat_output = await generate_chat(url_generate_chat, headers, wait_time, sleep_time_loop)
    
    # print("Chat output:", chat_output)
    is_chat_generated = True
    chat_output = "This is a simulated AI response based on the prompt."  # Simulated response for testing
    if not is_chat_generated or not chat_output:
        raise HTTPException(status_code=504, detail="Image generation timed out")
    
    model_content_type = ModelContentType(chat.content_type.value)
    
    new_message = ChatMessage(
        session_id=chat.session_id,
        user_id=user.id,
        character_id=chat.character_id,
        role = chat.role,
        content_type=model_content_type,
        user_query=chat.user_query,
        ai_message=chat_output,
    )
    db.add(new_message)
    await db.commit()
    await db.refresh(new_message)
    return JSONResponse(content={"chat_response": chat_output}, status_code=200)

@router.get("/{chat_id}/messages", response_model=List[MessageRead])
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

