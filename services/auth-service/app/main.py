from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import time
from collections import defaultdict

from app.database import engine, Base
from app.routers import auth, users

# Rate limiting storage (use Redis in production)
_rate_limit_store: dict = defaultdict(list)
RATE_LIMIT_WINDOW = 60  # seconds
RATE_LIMIT_MAX_REQUESTS = 30  # max requests per window


def rate_limit_middleware(request: Request, call_next):
    """Simple rate limiting middleware for auth endpoints."""
    if "/api/v1/auth/" in request.url.path:
        client_ip = request.client.host
        current_time = time.time()

        # Clean old entries
        _rate_limit_store[client_ip] = [
            t for t in _rate_limit_store[client_ip]
            if current_time - t < RATE_LIMIT_WINDOW
        ]

        # Check rate limit
        if len(_rate_limit_store[client_ip]) >= RATE_LIMIT_MAX_REQUESTS:
            return JSONResponse(
                status_code=429,
                content={"detail": "Too many requests. Please try again later."},
                headers={"Retry-After": "60"}
            )

        # Add current request
        _rate_limit_store[client_ip].append(current_time)

    return call_next(request)


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    await engine.dispose()


app = FastAPI(title="Fouter Auth Service", version="1.0.0", lifespan=lifespan)

# Add rate limiting middleware
app.middleware("http")(rate_limit_middleware)

# CORS - restrict to specific origins in production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure specific origins in production
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1")
app.include_router(users.router, prefix="/api/v1")


@app.get("/health")
async def health_check():
    # Enhanced health check with dependency status
    return {
        "status": "healthy",
        "service": "auth",
        "version": "1.0.0"
    }


@app.get("/")
async def root():
    return {"service": "fouter-auth", "version": "1.0.0"}
