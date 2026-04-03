#!/usr/bin/env python3
"""
Fouter Proxy Service - Demo Mode
"""
from fastapi import FastAPI
from fastapi.responses import JSONResponse
import uvicorn

app = FastAPI(title="Fouter Proxy Service (Demo)", version="1.0.0")


@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "proxy", "version": "1.0.0", "mode": "demo"}


@app.get("/")
async def root():
    return {"service": "fouter-proxy", "version": "1.0.0", "mode": "demo"}


@app.get("/v1/openai/models")
async def list_openai_models():
    return {
        "object": "list",
        "data": [
            {"id": "gpt-4o", "object": "model", "created": 1692900000, "owned_by": "OpenAI"},
            {"id": "gpt-4o-mini", "object": "model", "created": 1692900000, "owned_by": "OpenAI"},
            {"id": "gpt-3.5-turbo", "object": "model", "created": 1692900000, "owned_by": "OpenAI"}
        ]
    }


@app.get("/v1/anthropic/models")
async def list_anthropic_models():
    return {
        "data": [
            {"id": "claude-3-opus", "display_name": "Claude 3 Opus", "created_at": "2024-01-01T00:00:00Z"},
            {"id": "claude-3-sonnet", "display_name": "Claude 3 Sonnet", "created_at": "2024-01-01T00:00:00Z"},
            {"id": "claude-3-haiku", "display_name": "Claude 3 Haiku", "created_at": "2024-01-01T00:00:00Z"}
        ]
    }


if __name__ == "__main__":
    print("Starting Fouter Proxy Service in DEMO mode...")
    print("Warning: This is for UI demonstration only!")
    uvicorn.run(app, host="0.0.0.0", port=8002)
