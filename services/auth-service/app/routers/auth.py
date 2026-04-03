from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models import User, UserKey
from app.schemas import TokenResponse, UserResponse, FeishuAuthRequest
from app.services.jwt import create_access_token, verify_token
from app.services.feishu import FeishuOAuth, FeishuOAuthError
from datetime import timedelta
import secrets

router = APIRouter(prefix="/auth", tags=["auth"])
security = HTTPBearer()

# In-memory state store for CSRF protection (use Redis in production)
_state_store: dict = {}


def generate_state() -> str:
    """Generate a random state parameter for OAuth CSRF protection."""
    return secrets.token_urlsafe(32)


def validate_state(state: str) -> bool:
    """Validate the state parameter to prevent CSRF attacks."""
    # In production, use Redis with TTL
    if state in _state_store:
        del _state_store[state]
        return True
    return False


@router.post("/feishu/callback", response_model=TokenResponse)
async def feishu_callback(request: FeishuAuthRequest, db: AsyncSession = Depends(get_db)):
    if not request.code:
        raise HTTPException(status_code=400, detail="Authorization code required")

    # Validate state if provided (CSRF protection)
    if request.state and not validate_state(request.state):
        raise HTTPException(status_code=400, detail="Invalid or expired state parameter")

    feishu = FeishuOAuth()

    try:
        access_token = await feishu.get_access_token(request.code)
        if not access_token:
            raise HTTPException(status_code=401, detail="Invalid authorization code")

        user_info = await feishu.get_user_info(access_token)
        if not user_info:
            raise HTTPException(status_code=401, detail="Failed to get user info")

    except FeishuOAuthError as e:
        raise HTTPException(status_code=503, detail=f"Feishu OAuth service error: {str(e)}")

    feishu_user_id = user_info.get("user_id")
    name = user_info.get("name", "Unknown")
    email = user_info.get("email")

    result = await db.execute(select(User).where(User.feishu_user_id == feishu_user_id))
    user = result.scalar_one_or_none()

    if user is None:
        user = User(feishu_user_id=feishu_user_id, name=name, email=email, is_active=True, is_admin=False)
        db.add(user)
        await db.commit()
        await db.refresh(user)

    token_data = {"sub": str(user.id), "feishu_id": user.feishu_user_id, "is_admin": user.is_admin}
    access_token = create_access_token(data=token_data, expires_delta=timedelta(hours=24))

    return TokenResponse(access_token=access_token, token_type="bearer", expires_in=86400, user=UserResponse.model_validate(user))


@router.get("/me", response_model=UserResponse)
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: AsyncSession = Depends(get_db)):
    token = credentials.credentials
    payload = verify_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")

    user_id = int(payload.get("sub"))
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return UserResponse.model_validate(user)
