from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from app.database import get_db
from app.models import Provider, Model
from app.schemas import ProviderCreate, ProviderResponse, ModelCreate, ModelResponse

router = APIRouter(prefix="/providers", tags=["providers"])


@router.get("/", response_model=List[ProviderResponse])
async def list_providers(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Provider))
    return result.scalars().all()


@router.post("/", response_model=ProviderResponse)
async def create_provider(provider: ProviderCreate, db: AsyncSession = Depends(get_db)):
    db_provider = Provider(**provider.model_dump())
    db.add(db_provider)
    await db.commit()
    await db.refresh(db_provider)
    return db_provider


@router.get("/models", response_model=List[ModelResponse])
async def list_models(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Model))
    return result.scalars().all()


@router.post("/models", response_model=ModelResponse)
async def create_model(model: ModelCreate, db: AsyncSession = Depends(get_db)):
    db_model = Model(**model.model_dump())
    db.add(db_model)
    await db.commit()
    await db.refresh(db_model)
    return db_model
