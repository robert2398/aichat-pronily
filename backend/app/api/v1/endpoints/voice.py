from fastapi import APIRouter
from fastapi import Request
from fastapi.responses import Response
import aiohttp, uuid, os
from app.services.voice import store_voice_to_s3 #,transcribe, generate_reply, tts
router = APIRouter()

@router.post("/voice", response_class=Response)
async def voice():
    # TwiML response to record voice input
    return Response(content="""
    <Response>
        <Say voice="Polly.Joanna">Welcome to the AI assistant. Please speak after the beep. We will process your message shortly.</Say>
        <Record action="/process_recording" method="POST" maxLength="20" timeout="3" playBeep="true" />
        <Say>I didn’t receive anything. Goodbye.</Say>
    </Response>
    """, media_type="application/xml")


@router.post("/process_recording")
async def process_recording(request: Request):
    form = await request.form()
    recording_url = form.get("RecordingUrl")
    call_sid = form.get("CallSid")

    # 1. Download Twilio-recorded audio file
    audio_path = f"/tmp/{uuid.uuid4()}.mp3"
    async with aiohttp.ClientSession() as session:
        async with session.get(recording_url + ".mp3") as resp:
            with open(audio_path, "wb") as f:
                f.write(await resp.read())

    # 2. Transcribe audio using your own API
    transcript = await transcribe(audio_path)

    # 3. Generate AI reply using your own API
    ai_reply = await generate_reply(transcript)

    # 4. Convert reply to voice (MP3)
    mp3_bytes = await tts(ai_reply)
    mp3_url = await store_mp3(str(uuid.uuid4()), mp3_bytes)

    # 5. Respond with TwiML <Play> to return audio
    return Response(f"""
    <Response>
        <Play>{mp3_url}</Play>
        <Say>Thank you for calling. Goodbye!</Say>
    </Response>
    """, media_type="application/xml")

