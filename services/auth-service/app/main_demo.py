#!/usr/bin/env python3
"""
Fouter Auth Service - Demo Mode
Runs without Redis/PostgreSQL for UI demonstration
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn

app = FastAPI(title="Fouter Auth Service (Demo)", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "auth", "version": "1.0.0", "mode": "demo"}


@app.get("/")
async def root():
    return {"service": "fouter-auth", "version": "1.0.0", "mode": "demo"}


@app.get("/api/v1/auth/me")
async def get_current_user():
    return {
        "id": 1,
        "name": "Demo User",
        "email": "demo@fouter.local",
        "feishu_user_id": "demo_123",
        "is_active": True,
        "is_admin": True
    }


@app.post("/api/v1/auth/feishu/callback")
async def feishu_callback():
    return {
        "access_token": "demo_token_123",
        "token_type": "bearer",
        "expires_in": 86400,
        "user": {
            "id": 1,
            "name": "Demo User",
            "email": "demo@fouter.local",
            "feishu_user_id": "demo_123",
            "is_active": True,
            "is_admin": True
        }
    }


@app.get("/api/v1/users/keys")
async def list_keys():
    return [
        {
            "id": 1,
            "key_hash": "fk-demo_xxx",
            "name": "Demo Key",
            "rate_limit_rpm": 60,
            "is_active": True,
            "last_used_at": None,
            "expires_at": None
        }
    ]


if __name__ == "__main__":
    print("Starting Fouter Auth Service in DEMO mode...")
    print("Warning: This is for UI demonstration only!")
    uvicorn.run(app, host="0.0.0.0", port=8001)
