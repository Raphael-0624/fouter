from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
import redis.asyncio as redis
from contextlib import asynccontextmanager

from app.config import settings
from app.limiter import TokenBucketLimiter

redis_client: redis.Redis = None
limiter: TokenBucketLimiter = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global redis_client, limiter
    redis_client = redis.from_url(settings.redis_url, decode_responses=True)
    limiter = TokenBucketLimiter(redis_client)
    yield
    await redis_client.close()


app = FastAPI(title="Fouter Rate Limit Service", version="1.0.0", lifespan=lifespan)


@app.get("/health")
async def health_check():
    try:
        await redis_client.ping()
        return {"status": "healthy", "redis": "connected"}
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Redis unavailable: {str(e)}")


@app.post("/check")
async def check_rate_limit(
    user_key: str, provider_id: str,
    user_rate: int = 1, user_burst: int = 60,
    provider_rate: int = 5, provider_burst: int = 10
):
    allowed, details = await limiter.check_limits(
        user_key=user_key, provider_id=provider_id,
        user_rate=user_rate, user_burst=user_burst,
        provider_rate=provider_rate, provider_burst=provider_burst
    )

    headers = {
        "X-RateLimit-User-Remaining": str(details["user_remaining"]),
        "X-RateLimit-Provider-Remaining": str(details["provider_remaining"]),
    }

    if not allowed:
        headers["Retry-After"] = "1"
        raise HTTPException(
            status_code=429,
            detail={"error": {"code": "rate_limit_exceeded", "message": "Rate limit exceeded"}},
            headers=headers
        )

    return JSONResponse(content={"allowed": True, "details": details}, headers=headers)


@app.get("/")
async def root():
    return {"service": "fouter-rate-limit", "version": "1.0.0"}
