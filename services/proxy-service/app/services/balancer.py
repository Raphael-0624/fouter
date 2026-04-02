from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models import Provider, Model


class LoadBalancer:
    async def select_provider(self, db: AsyncSession, model_identifier: str, exclude_providers: List[int] = None) -> Optional[Provider]:
        result = await db.execute(
            select(Model, Provider)
            .join(Provider)
            .where(Model.display_name == model_identifier, Model.is_active == True, Provider.is_active == True)
        )
        rows = result.all()

        if not rows:
            return None

        available = []
        for model, provider in rows:
            if provider.balance is not None and provider.balance <= 0:
                continue
            if exclude_providers and provider.id in exclude_providers:
                continue
            available.append(provider)

        if not available:
            return None

        available.sort(key=lambda p: p.priority)
        return available[0]
