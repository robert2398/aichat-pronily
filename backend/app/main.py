"""
FastAPI app factory for AI Friend Chatbot backend.
- Includes API routers, CORS, JWT, DB, and background tasks.
"""
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
#from app.api.v1 import deps
from app.api.v1.endpoints import auth, characters, chats, character_media, \
            analytics, subscription, user, voice, pricing_promo
from app.api.v1.endpoints.admin import model_management, user_management, app_config_management, \
            character_management, pricing_promo_management, dashboard
from app.services import app_config
from app.core.database import get_db
from app.core.database import AsyncSessionLocal

# TODO: Load settings from app/core/config.py

@asynccontextmanager
async def lifespan(app: FastAPI):
    async with AsyncSessionLocal() as db:
        await app_config.load_config_cache(db)
    yield  # App is now running

def create_app() -> FastAPI:
    app = FastAPI(
        title="AI Friend Chatbot API",
        version="1.0.0",
        debug=True,
        lifespan=lifespan
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:5174", "http://localhost:5173", "http://13.48.108.119:5174", "http://13.48.108.119:5173"],  # TODO: Restrict in prod
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.add_middleware(SessionMiddleware, secret_key=os.getenv("JWT_SECRET_KEY", "supersecret"))

    # Routers
    app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
    app.include_router(user.router, prefix="/api/v1/user", tags=["auth"])
    app.include_router(characters.router, prefix="/api/v1/characters", tags=["characters"])
    app.include_router(character_media.router, prefix="/api/v1/characters/media", tags=["characters"])
    app.include_router(chats.router, prefix="/api/v1/chats", tags=["chats"])
    app.include_router(analytics.router, prefix="/api/v1/analytics", tags=["analytics"])
    app.include_router(subscription.router, prefix="/api/v1/subscription", tags=["stripe"])
    app.include_router(pricing_promo.router, prefix="/api/v1/subscription", tags=["stripe"])
    app.include_router(voice.router, prefix="/api/v1/voice", tags=["voice"])
    app.include_router(user_management.router, prefix="/api/v1/admin/users", tags=["admin"])
    app.include_router(app_config_management.router, prefix="/api/v1/admin/configs", tags=["admin"])
    app.include_router(model_management.router, prefix="/api/v1/admin/models", tags=["admin"])
    app.include_router(character_management.router, prefix="/api/v1/admin/characters", tags=["admin"])
    app.include_router(pricing_promo_management.router, prefix="/api/v1/admin/pricing", tags=["admin"])
    app.include_router(dashboard.router, prefix="/api/v1/admin/dashboard", tags=["admin"])

    # TODO: Add startup/shutdown events for DB, Alembic migration
    @app.get("/ping")
    async def ping():
        print("PING ENDPOINT CALLED")
        return {"message": "pong"}
    
    return app

app = create_app()


