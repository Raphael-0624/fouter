from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class UserBase(BaseModel):
    name: str
    email: Optional[str] = None
    avatar_url: Optional[str] = None


class UserCreate(UserBase):
    feishu_user_id: str
    department_id: Optional[int] = None


class UserResponse(UserBase):
    id: int
    feishu_user_id: str
    is_active: bool
    is_admin: bool
    created_at: datetime

    class Config:
        from_attributes = True


class UserKeyBase(BaseModel):
    name: Optional[str] = None
    rate_limit_rpm: int = 60


class UserKeyCreate(UserKeyBase):
    pass


class UserKeyResponse(UserKeyBase):
    id: int
    key_hash: str
    is_active: bool
    last_used_at: Optional[datetime]
    expires_at: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserResponse


class FeishuAuthRequest(BaseModel):
    code: str
    state: Optional[str] = None
