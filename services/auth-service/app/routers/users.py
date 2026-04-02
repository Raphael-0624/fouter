from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import secrets
import hashlib

from app.database import get_db
from app.models import User, UserKey
from app.schemas import UserKeyCreate, UserKeyResponse
from app.services.jwt import verify_token

router = APIRouter(prefix="/users", tags=["users"])
security = HTTPBearer()


def generate_api_key() -> str:
    return f"fk-{secrets.token_urlsafe(32)}"


def hash_key(key: str) -> str:
    return hashlib.sha256(key.encode()).hexdigest()


async def get_current_user_id(credentials: HTTPAuthorizationCredentials, db: AsyncSession) -> int:
    token = credentials.credentials
    payload = verify_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    return int(payload.get("sub"))


@router.post("/keys", response_model=UserKeyResponse)
async def create_key(request: UserKeyCreate, credentials: HTTPAuthorizationCredentials = Depends(security), db: AsyncSession = Depends(get_db)):
    user_id = await get_current_user_id(credentials, db)

    api_key = generate_api_key()
    key_hash = hash_key(api_key)

    user_key = UserKey(user_id=user_id, key_hash=key_hash, name=request.name or "My Key", rate_limit_rpm=request.rate_limit_rpm, is_active=True)
    db.add(user_key)
    await db.commit()
    await db.refresh(user_key)

    response = UserKeyResponse.model_validate(user_key)
    response.key_hash = api_key
    return response


@router.get("/keys", response_model=list[UserKeyResponse])
async def list_keys(credentials: HTTPAuthorizationCredentials = Depends(security), db: AsyncSession = Depends(get_db)):
    user_id = await get_current_user_id(credentials, db)

    result = await db.execute(select(UserKey).where(UserKey.user_id == user_id))
    keys = result.scalars().all()

    responses = []
    for key in keys:
        resp = UserKeyResponse.model_validate(key)
        resp.key_hash = f"{key.key_hash[:8]}...{key.key_hash[-8:]}"
        responses.append(resp)

    return responses


@router.delete("/keys/{key_id}")
async def delete_key(key_id: int, credentials: HTTPAuthorizationCredentials = Depends(security), db: AsyncSession = Depends(get_db)):
    user_id = await get_current_user_id(credentials, db)

    result = await db.execute(select(UserKey).where(UserKey.id == key_id, UserKey.user_id == user_id))
    key = result.scalar_one_or_none()

    if not key:
        raise HTTPException(status_code=404, detail="Key not found")

    await db.delete(key)
    await db.commit()

    return {"message": "Key deleted"}
