from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import datetime, timedelta
from typing import Optional

from app.database import get_db
from app.models import UsageLog, User

router = APIRouter(prefix="/stats", tags=["statistics"])


@router.get("/dashboard")
async def get_dashboard_stats(days: int = Query(7, ge=1, le=90), db: AsyncSession = Depends(get_db)):
    since = datetime.utcnow() - timedelta(days=days)

    total_result = await db.execute(select(func.count(UsageLog.id)).where(UsageLog.time >= since))
    total_requests = total_result.scalar()

    tokens_result = await db.execute(select(func.sum(UsageLog.total_tokens)).where(UsageLog.time >= since))
    total_tokens = tokens_result.scalar() or 0

    users_result = await db.execute(select(func.count(func.distinct(UsageLog.user_id))).where(UsageLog.time >= since))
    active_users = users_result.scalar()

    models_result = await db.execute(
        select(UsageLog.model_id, func.count(UsageLog.id).label("count"))
        .where(UsageLog.time >= since)
        .group_by(UsageLog.model_id)
        .order_by(func.count(UsageLog.id).desc())
        .limit(10)
    )
    top_models = [{"model_id": r[0], "requests": r[1]} for r in models_result.all()]

    return {"period_days": days, "total_requests": total_requests, "total_tokens": total_tokens, "active_users": active_users, "top_models": top_models}
