from fastapi import APIRouter, Request, Header, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.services.proxy import ProxyService

router = APIRouter(prefix="/v1/anthropic")
proxy_service = ProxyService()


@router.post("/messages")
async def messages(request: Request, x_api_key: str = Header(...), db: AsyncSession = Depends(get_db)):
    body = await request.json()

    async def generate():
        async for chunk in proxy_service.forward_anthropic_request(db, x_api_key, body, "/v1/messages"):
            yield chunk

    return StreamingResponse(generate(), media_type="text/event-stream", headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})


@router.get("/models")
async def list_models(x_api_key: str = Header(...), db: AsyncSession = Depends(get_db)):
    from sqlalchemy import select
    from app.models import Model, Provider

    result = await db.execute(select(Model, Provider).join(Provider).where(Model.is_active == True, Provider.is_active == True))
    rows = result.all()

    models = []
    for model, provider in rows:
        if provider.type == 'anthropic':
            models.append({"id": model.display_name, "display_name": model.display_name, "created_at": model.created_at.isoformat()})

    return {"data": models}
