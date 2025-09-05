from sqlalchemy.future import select
from app.core.database import get_db
from app.models.subscription import PricingPlan
from sqlalchemy.ext.asyncio import AsyncSession

async def get_pricing(price_id: str, db: AsyncSession):
    if not price_id:
        return None
    res = await db.execute(
        select(PricingPlan).where(PricingPlan.pricing_id == price_id)
    )
    return res.scalars().first()