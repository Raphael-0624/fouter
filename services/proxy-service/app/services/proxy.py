import httpx
import json
from typing import Dict, Optional, AsyncGenerator
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models import UserKey, Provider, Model
from app.services.balancer import LoadBalancer
from app.services.audit import SensitiveDataDetector


class ProxyService:
    def __init__(self):
        self.balancer = LoadBalancer()
        self.detector = SensitiveDataDetector()
        self.http_client = httpx.AsyncClient(timeout=300.0)

    async def validate_key(self, db: AsyncSession, api_key: str) -> Optional[UserKey]:
        import hashlib
        key_hash = hashlib.sha256(api_key.encode()).hexdigest()
        result = await db.execute(select(UserKey).where(UserKey.key_hash == key_hash, UserKey.is_active == True))
        return result.scalar_one_or_none()

    async def get_model_info(self, db: AsyncSession, model_name: str) -> Optional[Model]:
        result = await db.execute(select(Model).where(Model.display_name == model_name, Model.is_active == True))
        return result.scalar_one_or_none()

    async def forward_openai_request(self, db: AsyncSession, api_key: str, request_body: Dict, request_path: str) -> AsyncGenerator[bytes, None]:
        user_key = await self.validate_key(db, api_key)
        if not user_key:
            raise HTTPException(status_code=401, detail="Invalid API key")

        model_name = request_body.get("model")
        if not model_name:
            raise HTTPException(status_code=400, detail="Model not specified")

        model = await self.get_model_info(db, model_name)
        if not model:
            raise HTTPException(status_code=404, detail=f"Model '{model_name}' not found")

        provider = await self.balancer.select_provider(db, model_name)
        if not provider:
            raise HTTPException(status_code=503, detail="No available provider")

        if provider.type not in ['openai', 'azure', 'custom']:
            raise HTTPException(status_code=400, detail=f"Model requires {provider.type} format")

        headers = {"Authorization": f"Bearer {provider.api_key_encrypted}", "Content-Type": "application/json"}
        request_text = json.dumps(request_body)
        self.detector.detect(request_text)

        url = f"{provider.base_url}{request_path}"
        async with self.http_client.stream("POST", url, headers=headers, json=request_body) as response:
            if response.status_code != 200:
                body = await response.aread()
                raise HTTPException(status_code=response.status_code, detail=body.decode())
            async for chunk in response.aiter_bytes():
                yield chunk

    async def forward_anthropic_request(self, db: AsyncSession, api_key: str, request_body: Dict, request_path: str) -> AsyncGenerator[bytes, None]:
        user_key = await self.validate_key(db, api_key)
        if not user_key:
            raise HTTPException(status_code=401, detail="Invalid API key")

        model_name = request_body.get("model")
        if not model_name:
            raise HTTPException(status_code=400, detail="Model not specified")

        model = await self.get_model_info(db, model_name)
        if not model:
            raise HTTPException(status_code=404, detail=f"Model '{model_name}' not found")

        provider = await self.balancer.select_provider(db, model_name)
        if not provider:
            raise HTTPException(status_code=503, detail="No available provider")

        if provider.type != 'anthropic':
            raise HTTPException(status_code=400, detail="Model requires OpenAI format")

        headers = {"x-api-key": provider.api_key_encrypted, "Content-Type": "application/json", "anthropic-version": "2023-06-01"}
        request_text = json.dumps(request_body)
        self.detector.detect(request_text)

        url = f"{provider.base_url}{request_path}"
        # Use regular POST instead of stream() since MiniMax returns complete JSON
        response = await self.http_client.post(url, headers=headers, json=request_body)
        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail=response.text)
        # Return as SSE stream format
        yield f"data: {response.text}\n\n".encode()
