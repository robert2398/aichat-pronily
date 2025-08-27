from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.app_config import AppConfig
from app.core.config import settings
from fastapi import HTTPException


_config_cache = None

async def load_config_cache(db: AsyncSession):
    global _config_cache
    result = await db.execute(select(AppConfig))
    configs = result.scalars().all()
    _config_cache = {c.parameter_name: c.parameter_value for c in configs}

async def get_config_value_from_cache(name: str) -> str | None:
    if _config_cache is None:
        raise RuntimeError("Config cache not loaded. Call load_config_cache first.")
    return _config_cache.get(name)
