from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

SQLALCHEMY_DATABASE_URL = settings.DATABASE_URL
#SQLALCHEMY_DATABASE_URL = "postgresql+asyncpg://postgres:ZqZc6NVsp2u5flkNcIHm@aichat.c7sw0kqsq1e1.eu-north-1.rds.amazonaws.com:5432/aichat"
print("SQLALCHEMY_DATABASE_URL:", SQLALCHEMY_DATABASE_URL)
engine = create_async_engine(SQLALCHEMY_DATABASE_URL, echo=True)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
