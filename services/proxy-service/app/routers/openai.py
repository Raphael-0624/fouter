from fastapi import APIRouter, Request, Header, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.services.proxy import ProxyService

router = APIRouter(prefix="/v1/openai")
proxy_service = ProxyService()


@router.post("/chat/completions")
async def chat_completions(request: Request, authorization: str = Header(...), db: AsyncSession = Depends(get_db)):
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")

    api_key = authorization[7:]
    body = await request.json()

    async def generate():
        async for chunk in proxy_service.forward_openai_request(db, api_key, body, "/chat/completions"):
            yield chunk

    return StreamingResponse(generate(), media_type="text/event-stream", headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})


@router.post("/completions")
async def completions(request: Request, authorization: str = Header(...), db: AsyncSession = Depends(get_db)):
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")

    api_key = authorization[7:]
    body = await request.json()

    async def generate():
        async for chunk in proxy_service.forward_openai_request(db, api_key, body, "/completions"):
            yield chunk

    return StreamingResponse(generate(), media_type="text/event-stream")


@router.get("/models")
async def list_models(db: AsyncSession = Depends(get_db)):
    from sqlalchemy import select
    from app.models import Model, Provider

    result = await db.execute(select(Model, Provider).join(Provider).where(Model.is_active == True, Provider.is_active == True))
    rows = result.all()

    models = []
    for model, provider in rows:
        if provider.type in ['openai', 'azure', 'custom']:
            models.append({"id": model.display_name, "object": "model", "created": int(model.created_at.timestamp()), "owned_by": provider.name})

    return {"object": "list", "data": models}
