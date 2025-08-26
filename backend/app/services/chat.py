
import httpx
import asyncio
from app.services.app_config import get_config_value_from_cache
import tiktoken
async def generate_chat(url_generate_chat, headers, wait_time, sleep_time_loop):
    """
    Asynchronously polls a chat generation endpoint until completion or timeout.

    Args:
        url_generate_chat (str): The URL to poll for chat generation status/output.
        headers (dict): HTTP headers for the request (e.g., auth).
        wait_time (float): Maximum time (in seconds) to wait for completion.
        sleep_time_loop (float): Time (in seconds) to sleep between polls.

    Returns:
        tuple: (is_chat_generated (bool), response_output (str))
            is_chat_generated: True if chat was generated before timeout, else False.
            response_output: The generated chat output if available, else ''.
    """
    import time
    time_start = time.time()
    response_output = ''
    is_chat_generated = False
    async with httpx.AsyncClient() as client:
        while True:
            response = await client.get(url_generate_chat, headers=headers)
            response_json = response.json()
            status = response_json.get('status')
            print('Status : ', status)
            if status == 'COMPLETED':
                response_output = response_json['output'][0]['choices'][0]['tokens'][0]
                is_chat_generated = True
                break
            time_end = time.time()
            total_time = time_end - time_start
            if total_time > wait_time:
                break
            await asyncio.sleep(sleep_time_loop)
    return is_chat_generated, response_output



async def approximate_token_count(messages: list) -> int:
    """
    Approximate token count for a list of messages (dicts with 'role' and 'content').
    Uses cl100k_base encoding (default for GPT-3.5/4).
    """
    encoding = tiktoken.get_encoding("cl100k_base")
    total_tokens = 0
    for msg in messages:
        total_tokens += len(encoding.encode(msg["content"]))
    
    return total_tokens