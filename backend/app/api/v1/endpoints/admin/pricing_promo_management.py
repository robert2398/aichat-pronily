from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List

from app.api.v1.deps import get_db, require_admin
from app.models.subscription import PricingPlan, PromoManagement, Order, CoinTransaction
from app.schemas.subscription import (
    PricingPlanRead, PromoManagementRead, PricingPlanUpdate, PromoManagementUpdate,
    PricingPlanCreate, PromoManagementCreate, OrderRead, CoinTransactionRead
)

router = APIRouter()

@router.post("/create-pricing", dependencies=[Depends(require_admin)], response_model=PricingPlanRead)
async def create_pricing(
    pricing_data: PricingPlanCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new pricing plan.
    """
    new_plan = PricingPlan(**pricing_data.model_dump())
    db.add(new_plan)
    await db.commit()
    await db.refresh(new_plan)
    return new_plan


@router.put("/edit-pricing/{plan_id}", dependencies=[Depends(require_admin)])
async def edit_pricing(
    plan_id: int,
    pricing_data: PricingPlanUpdate,
    db: AsyncSession = Depends(get_db)
):
    """
    Edit a pricing plan's details.
    """
    result = await db.execute(select(PricingPlan).where(PricingPlan.plan_id == plan_id))
    pricing_plan = result.scalar_one_or_none()

    if not pricing_plan:
        raise HTTPException(status_code=404, detail="Pricing plan not found")

    update_data = pricing_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(pricing_plan, field, value)

    await db.commit()
    await db.refresh(pricing_plan)
    return {"detail": f"Pricing plan {plan_id} has been updated."}

@router.post("/create-promo", dependencies=[Depends(require_admin)], response_model=PromoManagementRead)
async def create_promo(
    promo_data: PromoManagementCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new promotion.
    """
    new_promo = PromoManagement(**promo_data.model_dump())
    db.add(new_promo)
    await db.commit()
    await db.refresh(new_promo)
    return new_promo


@router.put("/edit-promo/{promo_id}", dependencies=[Depends(require_admin)])
async def edit_promo(
    promo_id: int,
    promo_data: PromoManagementUpdate,
    db: AsyncSession = Depends(get_db)
):
    """
    Edit a promotion's details.
    """
    result = await db.execute(select(PromoManagement).where(PromoManagement.promo_id == promo_id))
    promo = result.scalar_one_or_none()

    if not promo:
        raise HTTPException(status_code=404, detail="Promotion not found")

    update_data = promo_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(promo, field, value)

    await db.commit()
    await db.refresh(promo)
    return {"detail": f"Promotion {promo_id} has been updated."}

@router.get("/all-orders", dependencies=[Depends(require_admin)], response_model=List[OrderRead])
async def get_all_orders(db: AsyncSession = Depends(get_db)) -> List[OrderRead]:
    result = await db.execute(select(Order))
    orders = result.scalars().all()
    return orders

@router.get("/all-coin-transactions", dependencies=[Depends(require_admin)], response_model=List[CoinTransactionRead])
async def get_all_coin_transactions(db: AsyncSession = Depends(get_db)) -> List[CoinTransactionRead]:
    result = await db.execute(select(CoinTransaction))
    coin_transactions = result.scalars().all()
    return coin_transactions
