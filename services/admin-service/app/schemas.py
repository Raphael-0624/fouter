from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class ProviderCreate(BaseModel):
    name: str
    type: str
    base_url: str
    api_key_encrypted: str
    rate_limit_qps: int = 5
    rate_limit_rpm: int = 300
    priority: int = 0


class ProviderResponse(ProviderCreate):
    id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class ModelCreate(BaseModel):
    provider_id: int
    model_id: str
    display_name: str


class ModelResponse(ModelCreate):
    id: int
    is_active: bool

    class Config:
        from_attributes = True
