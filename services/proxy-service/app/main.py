from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
try:
    from contextlib import asynccontextmanager
except ImportError:
    from async_generator import asynccontextmanager

from app.database import engine, Base
from app.routers import openai, anthropic


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    await engine.dispose()


app = FastAPI(title="Fouter Proxy Service", version="1.0.0", lifespan=lifespan)

app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

app.include_router(openai.router)
app.include_router(anthropic.router)


@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "proxy"}


@app.get("/")
async def root():
    return {"service": "fouter-proxy", "version": "1.0.0"}
