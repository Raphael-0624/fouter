# Fouter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Fouter - an internal AI model aggregation platform with Feishu OAuth login, dual API formats (OpenAI/Anthropic), rate limiting, and usage statistics.

**Architecture:** Microservices architecture with 4 services (Auth, Proxy, RateLimit, Admin) behind Nginx gateway, PostgreSQL/TimescaleDB for data, Redis for rate limiting, React frontend with industrial futurism design.

**Tech Stack:** Python 3.11 + FastAPI, React 18 + TypeScript, PostgreSQL 15 + TimescaleDB, Redis 7, Docker Compose, Nginx

---

## Project Structure

```
fouter/
├── docker-compose.yml              # Service orchestration
├── .env.example                    # Environment template
├── nginx/
│   └── nginx.conf                  # Gateway config
├── frontend/                       # React SPA
│   ├── package.json
│   ├── tsconfig.json
│   ├── index.html
│   ├── src/
│   │   ├── main.tsx               # Entry point
│   │   ├── App.tsx                # Root component
│   │   ├── components/            # Reusable UI components
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Table.tsx
│   │   │   ├── Modal.tsx
│   │   │   └── Layout.tsx
│   │   ├── pages/                 # Page components
│   │   │   ├── Login.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Keys.tsx
│   │   │   ├── Usage.tsx
│   │   │   ├── AdminDashboard.tsx
│   │   │   ├── Providers.tsx
│   │   │   └── Logs.tsx
│   │   ├── hooks/                 # Custom React hooks
│   │   │   └── useAuth.ts
│   │   ├── services/              # API clients
│   │   │   ├── auth.ts
│   │   │   ├── proxy.ts
│   │   │   └── admin.ts
│   │   ├── styles/                # Global styles
│   │   │   ├── global.css
│   │   │   └── variables.css
│   │   └── types/                 # TypeScript types
│   │       └── index.ts
│   └── dist/                      # Build output (gitignored)
└── services/
    ├── auth-service/              # Authentication microservice
    │   ├── app/
    │   │   ├── __init__.py
    │   │   ├── main.py            # FastAPI entry
    │   │   ├── config.py          # Settings
    │   │   ├── database.py        # DB connection
    │   │   ├── models.py          # SQLAlchemy models
    │   │   ├── schemas.py         # Pydantic schemas
    │   │   ├── routers/
    │   │   │   ├── __init__.py
    │   │   │   ├── auth.py        # OAuth endpoints
    │   │   │   └── users.py       # User management
    │   │   └── services/
    │   │       ├── __init__.py
    │   │       ├── feishu.py      # Feishu OAuth
    │   │       └── jwt.py         # JWT handling
    │   ├── tests/
    │   │   └── test_auth.py
    │   ├── Dockerfile
    │   └── requirements.txt
    ├── rate-limit-service/        # Rate limiting microservice
    │   ├── app/
    │   │   ├── __init__.py
    │   │   ├── main.py
    │   │   ├── config.py
    │   │   ├── limiter.py         # Token bucket impl
    │   │   └── routers/
    │   │       └── __init__.py
    │   ├── tests/
    │   │   └── test_limiter.py
    │   ├── Dockerfile
    │   └── requirements.txt
    ├── proxy-service/             # API proxy microservice
    │   ├── app/
    │   │   ├── __init__.py
    │   │   ├── main.py
    │   │   ├── config.py
    │   │   ├── database.py
    │   │   ├── models.py
    │   │   ├── routers/
    │   │   │   ├── __init__.py
    │   │   │   ├── openai.py      # OpenAI format
    │   │   │   └── anthropic.py   # Anthropic format
    │   │   └── services/
    │   │       ├── __init__.py
    │   │       ├── proxy.py       # Forwarding logic
    │   │       ├── balancer.py    # Load balancing
    │   │       └── audit.py       # Sensitive data detection
    │   ├── tests/
    │   │   └── test_proxy.py
    │   ├── Dockerfile
    │   └── requirements.txt
    └── admin-service/             # Admin & stats microservice
        ├── app/
        │   ├── __init__.py
        │   ├── main.py
        │   ├── config.py
        │   ├── database.py
        │   ├── models.py
        │   ├── schemas.py
        │   ├── routers/
        │   │   ├── __init__.py
        │   │   ├── providers.py   # Provider CRUD
        │   │   ├── models.py      # Model CRUD
        │   │   ├── stats.py       # Statistics
        │   │   └── logs.py        # Log queries
        │   └── services/
        │       ├── __init__.py
        │       └── stats.py       # Stats aggregation
        ├── tests/
        │   └── test_stats.py
        ├── Dockerfile
        └── requirements.txt
```

---

## Phase 1: Infrastructure Setup

### Task 1: Initialize Project Structure

**Files:**
- Create: `docker-compose.yml`
- Create: `.env.example`
- Create: `nginx/nginx.conf`
- Create: `.gitignore`

- [ ] **Step 1: Create docker-compose.yml**

```yaml
version: '3.8'

services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./frontend/dist:/usr/share/nginx/html
    depends_on:
      - auth-service
      - proxy-service
      - admin-service
    restart: unless-stopped

  postgres:
    image: timescale/timescaledb:latest-pg15
    environment:
      POSTGRES_USER: fouter
      POSTGRES_PASSWORD: ${DB_PASSWORD:-fouter123}
      POSTGRES_DB: fouter
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init-db.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "5432:5432"
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
    restart: unless-stopped

  auth-service:
    build: ./services/auth-service
    environment:
      - DATABASE_URL=postgresql://fouter:${DB_PASSWORD:-fouter123}@postgres/fouter
      - REDIS_URL=redis://redis:6379
      - FEISHU_APP_ID=${FEISHU_APP_ID}
      - FEISHU_APP_SECRET=${FEISHU_APP_SECRET}
      - JWT_SECRET=${JWT_SECRET:-your-secret-key}
      - LOG_LEVEL=info
    ports:
      - "8001:8000"
    depends_on:
      - postgres
      - redis
    restart: unless-stopped

  rate-limit-service:
    build: ./services/rate-limit-service
    environment:
      - REDIS_URL=redis://redis:6379
      - LOG_LEVEL=info
    ports:
      - "8003:8000"
    depends_on:
      - redis
    restart: unless-stopped

  proxy-service:
    build: ./services/proxy-service
    environment:
      - DATABASE_URL=postgresql://fouter:${DB_PASSWORD:-fouter123}@postgres/fouter
      - REDIS_URL=redis://redis:6379
      - RATE_LIMIT_SERVICE_URL=http://rate-limit-service:8000
      - LOG_LEVEL=info
    ports:
      - "8002:8000"
    depends_on:
      - postgres
      - redis
      - rate-limit-service
    restart: unless-stopped

  admin-service:
    build: ./services/admin-service
    environment:
      - DATABASE_URL=postgresql://fouter:${DB_PASSWORD:-fouter123}@postgres/fouter
      - REDIS_URL=redis://redis:6379
      - LOG_LEVEL=info
    ports:
      - "8004:8000"
    depends_on:
      - postgres
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

- [ ] **Step 2: Create .env.example**

```bash
# Database
DB_PASSWORD=change_me_in_production

# Redis
REDIS_PASSWORD=change_me_in_production

# JWT
JWT_SECRET=your-super-secret-jwt-key-min-32-chars

# Feishu OAuth (Phase 1: Placeholder, fill in Phase 2)
FEISHU_APP_ID=your_feishu_app_id
FEISHU_APP_SECRET=your_feishu_app_secret

# Optional: Pre-configured provider keys
OPENAI_API_KEY=sk-xxx
ANTHROPIC_API_KEY=sk-ant-xxx
```

- [ ] **Step 3: Create nginx/nginx.conf**

```nginx
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Logging
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"'
                    'rt=$request_time uct="$upstream_connect_time" '
                    'uht="$upstream_header_time" urt="$upstream_response_time"';

    access_log /var/log/nginx/access.log main;
    error_log /var/log/nginx/error.log warn;

    # Gzip
    gzip on;
    gzip_vary on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    # Rate limit zones
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $http_x_api_key zone=key:10m rate=60r/m;

    # Upstream services
    upstream auth_service {
        server auth-service:8000;
    }

    upstream proxy_service {
        server proxy-service:8000;
    }

    upstream admin_service {
        server admin-service:8000;
    }

    # Main server
    server {
        listen 80;
        server_name localhost;
        root /usr/share/nginx/html;
        index index.html;

        # Frontend - React SPA
        location / {
            try_files $uri $uri/ /index.html;
        }

        # API Routes
        location /api/v1/auth/ {
            proxy_pass http://auth_service/;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        location /api/v1/admin/ {
            proxy_pass http://admin_service/;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Proxy service - OpenAI format
        location /v1/openai/ {
            proxy_pass http://proxy_service/v1/openai/;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_buffering off;
            proxy_read_timeout 300s;
        }

        # Proxy service - Anthropic format
        location /v1/anthropic/ {
            proxy_pass http://proxy_service/v1/anthropic/;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_buffering off;
            proxy_read_timeout 300s;
        }

        # Health checks
        location /health {
            access_log off;
            return 200 "healthy\n";
        }
    }
}
```

- [ ] **Step 4: Create .gitignore**

```gitignore
# Environment
.env
.env.local
.env.production

# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
build/
develop-eggs/
dist/
downloads/
eggs/
.eggs/
lib/
lib64/
parts/
sdist/
var/
wheels/
*.egg-info/
.installed.cfg
*.egg
.pytest_cache/
.coverage
htmlcov/

# Node
node_modules/
frontend/dist/
frontend/dist-ssr/
*.local

# Docker
*.log

# IDE
.idea/
.vscode/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db
```

- [ ] **Step 5: Commit infrastructure files**

```bash
git add docker-compose.yml .env.example nginx/nginx.conf .gitignore
git commit -m "chore: initialize project infrastructure

- Add docker-compose with 4 microservices
- Add nginx gateway configuration
- Add environment template
- Add gitignore for Python/Node"
```

---

### Task 2: Database Schema

**Files:**
- Create: `init-db.sql`
- Create: `services/auth-service/app/models.py`

- [ ] **Step 1: Create init-db.sql with all tables**

```sql
-- Enable TimescaleDB extension
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Departments table
CREATE TABLE departments (
    id SERIAL PRIMARY KEY,
    feishu_dept_id VARCHAR(64) UNIQUE,
    name VARCHAR(128) NOT NULL,
    parent_id INTEGER REFERENCES departments(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    feishu_user_id VARCHAR(64) UNIQUE NOT NULL,
    name VARCHAR(128) NOT NULL,
    email VARCHAR(256),
    department_id INTEGER REFERENCES departments(id),
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- User API Keys table
CREATE TABLE user_keys (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    key_hash VARCHAR(128) UNIQUE NOT NULL,
    name VARCHAR(128),
    rate_limit_rpm INTEGER DEFAULT 60,
    is_active BOOLEAN DEFAULT TRUE,
    last_used_at TIMESTAMP,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Providers table (channels)
CREATE TABLE providers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    type VARCHAR(32) NOT NULL CHECK (type IN ('openai', 'anthropic', 'azure', 'custom')),
    base_url TEXT NOT NULL,
    api_key_encrypted TEXT NOT NULL,
    rate_limit_qps INTEGER DEFAULT 5,
    rate_limit_rpm INTEGER DEFAULT 300,
    balance DECIMAL(20, 4),
    balance_currency VARCHAR(8) DEFAULT 'USD',
    is_active BOOLEAN DEFAULT TRUE,
    priority INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Models table
CREATE TABLE models (
    id SERIAL PRIMARY KEY,
    provider_id INTEGER REFERENCES providers(id) ON DELETE CASCADE,
    model_id VARCHAR(128) NOT NULL,
    display_name VARCHAR(128) NOT NULL,
    description TEXT,
    context_window INTEGER,
    input_price_per_1k DECIMAL(10, 6),
    output_price_per_1k DECIMAL(10, 6),
    capabilities JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(provider_id, model_id)
);

-- Usage logs table (will be converted to hypertable)
CREATE TABLE usage_logs (
    id BIGSERIAL,
    time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    user_key_id INTEGER REFERENCES user_keys(id),
    user_id INTEGER REFERENCES users(id),
    model_id INTEGER REFERENCES models(id),
    provider_id INTEGER REFERENCES providers(id),
    request_id VARCHAR(64) UNIQUE NOT NULL,
    input_tokens INTEGER DEFAULT 0,
    output_tokens INTEGER DEFAULT 0,
    total_tokens INTEGER DEFAULT 0,
    cost DECIMAL(20, 8) DEFAULT 0,
    latency_ms INTEGER,
    upstream_latency_ms INTEGER,
    request_method VARCHAR(16),
    request_path TEXT,
    request_body_size INTEGER,
    response_status INTEGER,
    has_sensitive_data BOOLEAN DEFAULT FALSE,
    sensitive_data_types TEXT[],
    request_content_snippet TEXT,
    PRIMARY KEY (id, time)
);

-- Convert to TimescaleDB hypertable
SELECT create_hypertable('usage_logs', 'time', chunk_time_interval => INTERVAL '1 day');

-- Indexes for performance
CREATE INDEX idx_users_feishu ON users(feishu_user_id);
CREATE INDEX idx_user_keys_hash ON user_keys(key_hash);
CREATE INDEX idx_user_keys_user ON user_keys(user_id);
CREATE INDEX idx_models_provider ON models(provider_id);
CREATE INDEX idx_models_active ON models(is_active);
CREATE INDEX idx_usage_logs_user_time ON usage_logs (user_id, time DESC);
CREATE INDEX idx_usage_logs_model_time ON usage_logs (model_id, time DESC);
CREATE INDEX idx_usage_logs_time ON usage_logs (time DESC);

-- Insert sample providers (disabled, for testing)
INSERT INTO providers (name, type, base_url, api_key_encrypted, is_active) VALUES
('OpenAI', 'openai', 'https://api.openai.com/v1', 'encrypted_placeholder', FALSE),
('Anthropic', 'anthropic', 'https://api.anthropic.com/v1', 'encrypted_placeholder', FALSE);
```

- [ ] **Step 2: Commit database schema**

```bash
git add init-db.sql
git commit -m "chore: add database schema

- Create tables: departments, users, user_keys, providers, models
- Create usage_logs hypertable with TimescaleDB
- Add indexes for common queries"
```

---

## Phase 2: Rate Limit Service

### Task 3: Rate Limit Service Implementation

**Files:**
- Create: `services/rate-limit-service/requirements.txt`
- Create: `services/rate-limit-service/Dockerfile`
- Create: `services/rate-limit-service/app/__init__.py`
- Create: `services/rate-limit-service/app/config.py`
- Create: `services/rate-limit-service/app/limiter.py`
- Create: `services/rate-limit-service/app/main.py`
- Create: `services/rate-limit-service/tests/test_limiter.py`

- [ ] **Step 1: Create requirements.txt**

```
fastapi==0.104.1
uvicorn[standard]==0.24.0
redis==5.0.1
pydantic-settings==2.1.0
pytest==7.4.3
pytest-asyncio==0.21.1
httpx==0.25.2
```

- [ ] **Step 2: Create Dockerfile**

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app/ ./app/

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

- [ ] **Step 3: Create app/config.py**

```python
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    redis_url: str = "redis://localhost:6379"
    log_level: str = "info"

    class Config:
        env_file = ".env"


settings = Settings()
```

- [ ] **Step 4: Create app/limiter.py**

```python
import time
from typing import Tuple, Optional
import redis.asyncio as redis


class TokenBucketLimiter:
    """Token bucket rate limiter using Redis."""

    def __init__(self, redis_client: redis.Redis):
        self.redis = redis_client
        self.lua_script = """
            local key = KEYS[1]
            local rate = tonumber(ARGV[1])
            local burst = tonumber(ARGV[2])
            local now = tonumber(ARGV[3])

            local last_tokens = redis.call('hget', key, 'tokens')
            local last_updated = redis.call('hget', key, 'updated')

            if not last_tokens then
                last_tokens = burst
                last_updated = now
            else
                last_tokens = tonumber(last_tokens)
                last_updated = tonumber(last_updated)
                local delta = math.max(0, now - last_updated)
                local tokens_to_add = delta * rate
                last_tokens = math.min(burst, last_tokens + tokens_to_add)
            end

            local allowed = 0
            if last_tokens >= 1 then
                last_tokens = last_tokens - 1
                allowed = 1
            end

            redis.call('hset', key, 'tokens', last_tokens)
            redis.call('hset', key, 'updated', now)
            redis.call('expire', key, math.ceil(burst / rate) + 1)

            return {allowed, last_tokens}
        """

    async def is_allowed(
        self,
        key: str,
        rate: float,
        burst: int
    ) -> Tuple[bool, int]:
        """
        Check if request is allowed.
        Returns: (is_allowed, remaining_tokens)
        """
        now = time.time()
        result = await self.redis.eval(
            self.lua_script,
            1,
            key,
            str(rate),
            str(burst),
            str(now)
        )
        return result[0] == 1, int(result[1])

    async def check_limits(
        self,
        user_key: str,
        provider_id: str,
        model_id: str,
        user_rate: int = 1,      # per second
        user_burst: int = 60,    # burst capacity
        provider_rate: int = 5,  # per second
        provider_burst: int = 10
    ) -> Tuple[bool, dict]:
        """
        Check all three levels of rate limiting.
        Returns: (is_allowed, details)
        """
        details = {
            "user_allowed": True,
            "user_remaining": 0,
            "provider_allowed": True,
            "provider_remaining": 0,
        }

        # Check user key limit
        user_allowed, user_remaining = await self.is_allowed(
            f"rate_limit:user:{user_key}",
            user_rate,
            user_burst
        )
        details["user_allowed"] = user_allowed
        details["user_remaining"] = user_remaining

        if not user_allowed:
            return False, details

        # Check provider limit
        prov_allowed, prov_remaining = await self.is_allowed(
            f"rate_limit:provider:{provider_id}",
            provider_rate,
            provider_burst
        )
        details["provider_allowed"] = prov_allowed
        details["provider_remaining"] = prov_remaining

        if not prov_allowed:
            return False, details

        return True, details
```

- [ ] **Step 5: Create app/main.py**

```python
from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
import redis.asyncio as redis
from contextlib import asynccontextmanager

from app.config import settings
from app.limiter import TokenBucketLimiter

# Global state
redis_client: redis.Redis = None
limiter: TokenBucketLimiter = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifespan."""
    global redis_client, limiter
    redis_client = redis.from_url(settings.redis_url, decode_responses=True)
    limiter = TokenBucketLimiter(redis_client)
    yield
    await redis_client.close()


app = FastAPI(
    title="Fouter Rate Limit Service",
    version="1.0.0",
    lifespan=lifespan
)


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    try:
        await redis_client.ping()
        return {"status": "healthy", "redis": "connected"}
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Redis unavailable: {str(e)}")


@app.post("/check")
async def check_rate_limit(
    user_key: str,
    provider_id: str,
    user_rate: int = 1,
    user_burst: int = 60,
    provider_rate: int = 5,
    provider_burst: int = 10
):
    """
    Check if request is allowed through all rate limits.
    """
    allowed, details = await limiter.check_limits(
        user_key=user_key,
        provider_id=provider_id,
        user_rate=user_rate,
        user_burst=user_burst,
        provider_rate=provider_rate,
        provider_burst=provider_burst
    )

    headers = {
        "X-RateLimit-User-Remaining": str(details["user_remaining"]),
        "X-RateLimit-Provider-Remaining": str(details["provider_remaining"]),
    }

    if not allowed:
        retry_after = 1
        headers["Retry-After"] = str(retry_after)
        raise HTTPException(
            status_code=429,
            detail={
                "error": {
                    "code": "rate_limit_exceeded",
                    "message": "Rate limit exceeded. Please retry.",
                    "details": details
                }
            },
            headers=headers
        )

    return JSONResponse(
        content={"allowed": True, "details": details},
        headers=headers
    )


@app.get("/")
async def root():
    return {"service": "fouter-rate-limit", "version": "1.0.0"}
```

- [ ] **Step 6: Create tests/test_limiter.py**

```python
import pytest
import redis.asyncio as redis
from app.limiter import TokenBucketLimiter


@pytest.fixture
async def redis_client():
    client = redis.from_url("redis://localhost:6379", decode_responses=True)
    yield client
    await client.flushdb()
    await client.close()


@pytest.fixture
async def limiter(redis_client):
    return TokenBucketLimiter(redis_client)


@pytest.mark.asyncio
async def test_token_bucket_allows_first_request(limiter):
    allowed, remaining = await limiter.is_allowed("test:key", rate=1, burst=10)
    assert allowed is True
    assert remaining == 9


@pytest.mark.asyncio
async def test_token_bucket_blocks_when_empty(limiter):
    # Exhaust all tokens
    for _ in range(10):
        await limiter.is_allowed("test:key2", rate=1, burst=10)

    allowed, remaining = await limiter.is_allowed("test:key2", rate=1, burst=10)
    assert allowed is False
    assert remaining == 0


@pytest.mark.asyncio
async def test_check_limits_all_pass(limiter):
    allowed, details = await limiter.check_limits(
        user_key="user:123",
        provider_id="prov:openai",
        user_rate=10,
        user_burst=100,
        provider_rate=5,
        provider_burst=10
    )
    assert allowed is True
    assert details["user_allowed"] is True
    assert details["provider_allowed"] is True
```

- [ ] **Step 7: Commit rate limit service**

```bash
git add services/rate-limit-service/
git commit -m "feat: implement rate limit service

- Add token bucket algorithm with Redis Lua script
- Implement three-level rate limiting (user/provider)
- Add health check endpoint
- Add comprehensive tests"
```

---

## Phase 3: Auth Service

### Task 4: Auth Service Core

**Files:**
- Create: `services/auth-service/requirements.txt`
- Create: `services/auth-service/Dockerfile`
- Create: `services/auth-service/app/config.py`
- Create: `services/auth-service/app/database.py`
- Create: `services/auth-service/app/models.py`
- Create: `services/auth-service/app/schemas.py`

- [ ] **Step 1: Create requirements.txt**

```
fastapi==0.104.1
uvicorn[standard]==0.24.0
sqlalchemy==2.0.23
asyncpg==0.29.0
redis==5.0.1
pyjwt==2.8.0
bcrypt==4.1.2
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
httpx==0.25.2
pydantic-settings==2.1.0
pytest==7.4.3
pytest-asyncio==0.21.1
```

- [ ] **Step 2: Create Dockerfile**

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install PostgreSQL client for health checks
RUN apt-get update && apt-get install -y postgresql-client && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app/ ./app/

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

- [ ] **Step 3: Create app/config.py**

```python
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql://fouter:fouter123@localhost/fouter"
    redis_url: str = "redis://localhost:6379"
    jwt_secret: str = "your-secret-key"
    jwt_algorithm: str = "HS256"
    jwt_expiration_hours: int = 24
    feishu_app_id: str = ""
    feishu_app_secret: str = ""
    log_level: str = "info"

    class Config:
        env_file = ".env"


settings = Settings()
```

- [ ] **Step 4: Create app/database.py**

```python
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from app.config import settings

# Convert sync URL to async
DATABASE_URL = settings.database_url.replace("postgresql://", "postgresql+asyncpg://")

engine = create_async_engine(DATABASE_URL, echo=False)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

Base = declarative_base()


async def get_db():
    """Database session dependency."""
    async with async_session() as session:
        try:
            yield session
        finally:
            await session.close()
```

- [ ] **Step 5: Create app/models.py**

```python
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, DECIMAL, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class Department(Base):
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True)
    feishu_dept_id = Column(String(64), unique=True)
    name = Column(String(128), nullable=False)
    parent_id = Column(Integer, ForeignKey("departments.id"))
    created_at = Column(DateTime, default=datetime.utcnow)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    feishu_user_id = Column(String(64), unique=True, nullable=False)
    name = Column(String(128), nullable=False)
    email = Column(String(256))
    department_id = Column(Integer, ForeignKey("departments.id"))
    avatar_url = Column(Text)
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    department = relationship("Department")
    keys = relationship("UserKey", back_populates="user", cascade="all, delete-orphan")


class UserKey(Base):
    __tablename__ = "user_keys"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    key_hash = Column(String(128), unique=True, nullable=False)
    name = Column(String(128))
    rate_limit_rpm = Column(Integer, default=60)
    is_active = Column(Boolean, default=True)
    last_used_at = Column(DateTime)
    expires_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="keys")
```

- [ ] **Step 6: Create app/schemas.py**

```python
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
```

- [ ] **Step 7: Commit auth service core**

```bash
git add services/auth-service/
git commit -m "feat: add auth service core

- Add SQLAlchemy models (User, UserKey, Department)
- Add Pydantic schemas for API
- Add database configuration
- Add requirements and Dockerfile"
```

---

### Task 5: Auth Service JWT & Feishu

**Files:**
- Create: `services/auth-service/app/services/jwt.py`
- Create: `services/auth-service/app/services/feishu.py`
- Create: `services/auth-service/app/routers/auth.py`
- Create: `services/auth-service/app/main.py`

- [ ] **Step 1: Create app/services/jwt.py**

```python
from datetime import datetime, timedelta
from typing import Optional, Dict
from jose import JWTError, jwt
from app.config import settings


def create_access_token(data: Dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(hours=settings.jwt_expiration_hours)

    to_encode.update({"exp": expire, "iat": datetime.utcnow()})
    encoded_jwt = jwt.encode(to_encode, settings.jwt_secret, algorithm=settings.jwt_algorithm)
    return encoded_jwt


def decode_token(token: str) -> Optional[Dict]:
    """Decode and verify JWT token."""
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
        return payload
    except JWTError:
        return None


def verify_token(token: str) -> Optional[Dict]:
    """Verify token and return user info."""
    payload = decode_token(token)
    if payload is None:
        return None
    if payload.get("exp") and datetime.utcnow().timestamp() > payload["exp"]:
        return None
    return payload
```

- [ ] **Step 2: Create app/services/feishu.py**

```python
import httpx
from typing import Optional, Dict
from app.config import settings


class FeishuOAuth:
    """Feishu OAuth2 client."""

    BASE_URL = "https://open.feishu.cn/open-apis"

    def __init__(self):
        self.app_id = settings.feishu_app_id
        self.app_secret = settings.feishu_app_secret

    async def get_access_token(self, code: str) -> Optional[str]:
        """Exchange authorization code for access token."""
        url = f"{self.BASE_URL}/authen/v1/access_token"
        payload = {
            "grant_type": "authorization_code",
            "code": code,
        }
        headers = {
            "Content-Type": "application/json",
        }

        async with httpx.AsyncClient() as client:
            # First get app access token
            app_token_resp = await client.post(
                f"{self.BASE_URL}/auth/v3/app_access_token/internal",
                json={"app_id": self.app_id, "app_secret": self.app_secret}
            )
            app_token_data = app_token_resp.json()
            app_access_token = app_token_data.get("app_access_token")

            if not app_access_token:
                return None

            # Then get user access token
            resp = await client.post(
                url,
                json=payload,
                headers={"Authorization": f"Bearer {app_access_token}"}
            )
            data = resp.json()

            if data.get("code") == 0:
                return data.get("data", {}).get("access_token")
            return None

    async def get_user_info(self, access_token: str) -> Optional[Dict]:
        """Get user info using access token."""
        url = f"{self.BASE_URL}/authen/v1/user_info"

        async with httpx.AsyncClient() as client:
            resp = await client.get(
                url,
                headers={"Authorization": f"Bearer {access_token}"}
            )
            data = resp.json()

            if data.get("code") == 0:
                return data.get("data")
            return None
```

- [ ] **Step 3: Create app/routers/auth.py**

```python
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import secrets
import hashlib

from app.database import get_db
from app.models import User, UserKey, Department
from app.schemas import TokenResponse, UserResponse, UserKeyCreate, UserKeyResponse, FeishuAuthRequest
from app.services.jwt import create_access_token, verify_token
from app.services.feishu import FeishuOAuth
from datetime import timedelta

router = APIRouter(prefix="/auth", tags=["auth"])
security = HTTPBearer()


def generate_api_key() -> str:
    """Generate a secure API key."""
    return f"fk-{secrets.token_urlsafe(32)}"


def hash_key(key: str) -> str:
    """Hash API key for storage."""
    return hashlib.sha256(key.encode()).hexdigest()


@router.post("/feishu/callback", response_model=TokenResponse)
async def feishu_callback(
    request: FeishuAuthRequest,
    db: AsyncSession = Depends(get_db)
):
    """Handle Feishu OAuth callback."""
    if not request.code:
        raise HTTPException(status_code=400, detail="Authorization code required")

    feishu = FeishuOAuth()

    # Exchange code for access token
    access_token = await feishu.get_access_token(request.code)
    if not access_token:
        raise HTTPException(status_code=401, detail="Invalid authorization code")

    # Get user info
    user_info = await feishu.get_user_info(access_token)
    if not user_info:
        raise HTTPException(status_code=401, detail="Failed to get user info")

    feishu_user_id = user_info.get("user_id")
    name = user_info.get("name", "Unknown")
    email = user_info.get("email")

    # Find or create user
    result = await db.execute(select(User).where(User.feishu_user_id == feishu_user_id))
    user = result.scalar_one_or_none()

    if user is None:
        # Create new user
        user = User(
            feishu_user_id=feishu_user_id,
            name=name,
            email=email,
            is_active=True,
            is_admin=False
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)

    # Create JWT token
    token_data = {
        "sub": str(user.id),
        "feishu_id": user.feishu_user_id,
        "is_admin": user.is_admin
    }
    access_token = create_access_token(
        data=token_data,
        expires_delta=timedelta(hours=24)
    )

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        expires_in=86400,
        user=UserResponse.model_validate(user)
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
):
    """Refresh JWT token."""
    token = credentials.credentials
    payload = verify_token(token)

    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")

    user_id = int(payload.get("sub"))
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found or inactive")

    new_token = create_access_token(
        data={"sub": str(user.id), "feishu_id": user.feishu_user_id, "is_admin": user.is_admin},
        expires_delta=timedelta(hours=24)
    )

    return TokenResponse(
        access_token=new_token,
        token_type="bearer",
        expires_in=86400,
        user=UserResponse.model_validate(user)
    )


@router.get("/me", response_model=UserResponse)
async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
):
    """Get current user info."""
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
```

- [ ] **Step 4: Create app/routers/users.py**

```python
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
async def create_key(
    request: UserKeyCreate,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
):
    """Create new API key for current user."""
    user_id = await get_current_user_id(credentials, db)

    # Generate key
    api_key = generate_api_key()
    key_hash = hash_key(api_key)

    # Create record
    user_key = UserKey(
        user_id=user_id,
        key_hash=key_hash,
        name=request.name or "My Key",
        rate_limit_rpm=request.rate_limit_rpm,
        is_active=True
    )
    db.add(user_key)
    await db.commit()
    await db.refresh(user_key)

    # Return with full key (only shown once)
    response = UserKeyResponse.model_validate(user_key)
    response.key_hash = api_key  # Return actual key, not hash
    return response


@router.get("/keys", response_model=list[UserKeyResponse])
async def list_keys(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
):
    """List API keys for current user."""
    user_id = await get_current_user_id(credentials, db)

    result = await db.execute(select(UserKey).where(UserKey.user_id == user_id))
    keys = result.scalars().all()

    # Mask actual keys
    responses = []
    for key in keys:
        resp = UserKeyResponse.model_validate(key)
        resp.key_hash = f"{key.key_hash[:8]}...{key.key_hash[-8:]}"
        responses.append(resp)

    return responses


@router.delete("/keys/{key_id}")
async def delete_key(
    key_id: int,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
):
    """Delete API key."""
    user_id = await get_current_user_id(credentials, db)

    result = await db.execute(
        select(UserKey).where(UserKey.id == key_id, UserKey.user_id == user_id)
    )
    key = result.scalar_one_or_none()

    if not key:
        raise HTTPException(status_code=404, detail="Key not found")

    await db.delete(key)
    await db.commit()

    return {"message": "Key deleted"}
```

- [ ] **Step 5: Create app/main.py**

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.database import engine, Base
from app.routers import auth, users


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifespan."""
    # Create tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    await engine.dispose()


app = FastAPI(
    title="Fouter Auth Service",
    version="1.0.0",
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router, prefix="/api/v1")
app.include_router(users.router, prefix="/api/v1")


@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "auth"}


@app.get("/")
async def root():
    return {"service": "fouter-auth", "version": "1.0.0"}
```

- [ ] **Step 6: Commit auth service**

```bash
git add services/auth-service/app/
git commit -m "feat: complete auth service implementation

- Add JWT token generation and verification
- Add Feishu OAuth2 integration
- Add user authentication endpoints
- Add API key management (create/list/delete)"
```

---

## Phase 4: Proxy Service

### Task 6: Proxy Service Implementation

**Files:**
- Create: `services/proxy-service/requirements.txt`
- Create: `services/proxy-service/Dockerfile`
- Create: `services/proxy-service/app/config.py`
- Create: `services/proxy-service/app/database.py`
- Create: `services/proxy-service/app/models.py`
- Create: `services/proxy-service/app/services/balancer.py`
- Create: `services/proxy-service/app/services/audit.py`
- Create: `services/proxy-service/app/services/proxy.py`

- [ ] **Step 1: Create requirements.txt**

```
fastapi==0.104.1
uvicorn[standard]==0.24.0
sqlalchemy==2.0.23
asyncpg==0.29.0
redis==5.1.0
httpx==0.25.2
pydantic-settings==2.1.0
pytest==7.4.3
pytest-asyncio==0.21.1
```

- [ ] **Step 2: Create Dockerfile**

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app/ ./app/

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

- [ ] **Step 3: Create app/models.py**

```python
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, DECIMAL, JSON
from sqlalchemy.orm import declarative_base
from datetime import datetime

Base = declarative_base()


class Provider(Base):
    __tablename__ = "providers"

    id = Column(Integer, primary_key=True)
    name = Column(String(128), nullable=False)
    type = Column(String(32), nullable=False)
    base_url = Column(Text, nullable=False)
    api_key_encrypted = Column(Text, nullable=False)
    rate_limit_qps = Column(Integer, default=5)
    rate_limit_rpm = Column(Integer, default=300)
    balance = Column(DECIMAL(20, 4))
    balance_currency = Column(String(8), default='USD')
    is_active = Column(Boolean, default=True)
    priority = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Model(Base):
    __tablename__ = "models"

    id = Column(Integer, primary_key=True)
    provider_id = Column(Integer, ForeignKey("providers.id", ondelete="CASCADE"))
    model_id = Column(String(128), nullable=False)
    display_name = Column(String(128), nullable=False)
    description = Column(Text)
    context_window = Column(Integer)
    input_price_per_1k = Column(DECIMAL(10, 6))
    output_price_per_1k = Column(DECIMAL(10, 6))
    capabilities = Column(JSON, default={})
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class UserKey(Base):
    __tablename__ = "user_keys"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer)
    key_hash = Column(String(128), nullable=False)
    name = Column(String(128))
    rate_limit_rpm = Column(Integer, default=60)
    is_active = Column(Boolean, default=True)
    last_used_at = Column(DateTime)
    expires_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
```

- [ ] **Step 4: Create app/services/balancer.py**

```python
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models import Provider, Model


class LoadBalancer:
    """Load balancer for selecting optimal provider."""

    async def select_provider(
        self,
        db: AsyncSession,
        model_identifier: str,
        exclude_providers: List[int] = None
    ) -> Optional[Provider]:
        """
        Select best provider for given model.
        Priority order: priority value (lower = higher), balance available.
        """
        # Find model by identifier
        result = await db.execute(
            select(Model, Provider)
            .join(Provider)
            .where(
                Model.display_name == model_identifier,
                Model.is_active == True,
                Provider.is_active == True
            )
        )
        rows = result.all()

        if not rows:
            return None

        # Filter providers with balance
        available = []
        for model, provider in rows:
            if provider.balance is not None and provider.balance <= 0:
                continue
            if exclude_providers and provider.id in exclude_providers:
                continue
            available.append(provider)

        if not available:
            return None

        # Sort by priority (lower = better)
        available.sort(key=lambda p: p.priority)
        return available[0]

    async def get_providers_for_model(
        self,
        db: AsyncSession,
        model_identifier: str
    ) -> List[Provider]:
        """Get all providers that offer this model."""
        result = await db.execute(
            select(Provider)
            .join(Model)
            .where(
                Model.display_name == model_identifier,
                Model.is_active == True,
                Provider.is_active == True
            )
            .order_by(Provider.priority)
        )
        return result.scalars().all()
```

- [ ] **Step 5: Create app/services/audit.py**

```python
import re
from typing import Dict, List, Tuple


class SensitiveDataDetector:
    """Detect sensitive information in text."""

    PATTERNS = {
        'phone': re.compile(r'1[3-9]\d{9}'),
        'id_card': re.compile(r'\d{17}[\dXx]|\d{15}'),
        'email': re.compile(r'[\w.-]+@[\w.-]+\.\w+'),
        'bank_card': re.compile(r'\d{16,19}'),
    }

    SENSITIVE_KEYWORDS = [
        '密码', 'password', 'pwd',
        '密钥', 'secret', 'key',
        'token', 'api_key',
    ]

    def detect(self, text: str) -> Dict:
        """Detect sensitive data in text."""
        result = {
            'has_sensitive': False,
            'types': [],
            'positions': [],
            'keywords': []
        }

        # Regex patterns
        for data_type, pattern in self.PATTERNS.items():
            for match in pattern.finditer(text):
                result['has_sensitive'] = True
                result['types'].append(data_type)
                result['positions'].append({
                    'start': match.start(),
                    'end': match.end(),
                    'type': data_type
                })

        # Keywords
        text_lower = text.lower()
        for keyword in self.SENSITIVE_KEYWORDS:
            if keyword.lower() in text_lower:
                result['has_sensitive'] = True
                result['keywords'].append(keyword)

        return result

    def mask_text(self, text: str, positions: List[Dict]) -> str:
        """Mask sensitive data in text."""
        if not positions:
            return text

        # Sort by position
        positions = sorted(positions, key=lambda x: x['start'], reverse=True)

        masked = text
        for pos in positions:
            start, end = pos['start'], pos['end']
            masked = masked[:start] + '*' * (end - start) + masked[end:]

        return masked
```

- [ ] **Step 6: Create app/services/proxy.py**

```python
import httpx
import json
import time
from typing import Dict, Optional, AsyncGenerator
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models import UserKey, Provider, Model
from app.services.balancer import LoadBalancer
from app.services.audit import SensitiveDataDetector


class ProxyService:
    """Main proxy service for forwarding requests."""

    def __init__(self):
        self.balancer = LoadBalancer()
        self.detector = SensitiveDataDetector()
        self.http_client = httpx.AsyncClient(timeout=300.0)

    async def validate_key(self, db: AsyncSession, api_key: str) -> Optional[UserKey]:
        """Validate API key and return user key info."""
        import hashlib
        key_hash = hashlib.sha256(api_key.encode()).hexdigest()

        result = await db.execute(
            select(UserKey).where(
                UserKey.key_hash == key_hash,
                UserKey.is_active == True
            )
        )
        return result.scalar_one_or_none()

    async def get_model_info(self, db: AsyncSession, model_name: str) -> Optional[Model]:
        """Get model info by name."""
        result = await db.execute(
            select(Model).where(
                Model.display_name == model_name,
                Model.is_active == True
            )
        )
        return result.scalar_one_or_none()

    async def forward_openai_request(
        self,
        db: AsyncSession,
        api_key: str,
        request_body: Dict,
        request_path: str
    ) -> AsyncGenerator[bytes, None]:
        """Forward OpenAI format request."""
        # Validate key
        user_key = await self.validate_key(db, api_key)
        if not user_key:
            raise HTTPException(status_code=401, detail="Invalid API key")

        # Get model
        model_name = request_body.get("model")
        if not model_name:
            raise HTTPException(status_code=400, detail="Model not specified")

        model = await self.get_model_info(db, model_name)
        if not model:
            raise HTTPException(status_code=404, detail=f"Model '{model_name}' not found")

        # Get provider
        provider = await self.balancer.select_provider(db, model_name)
        if not provider:
            raise HTTPException(status_code=503, detail="No available provider for this model")

        # Check if provider type matches request format
        if provider.type not in ['openai', 'azure', 'custom']:
            raise HTTPException(
                status_code=400,
                detail=f"Model '{model_name}' requires {provider.type} format. Use /v1/{provider.type}/..."
            )

        # Prepare request
        headers = {
            "Authorization": f"Bearer {provider.api_key_encrypted}",
            "Content-Type": "application/json"
        }

        # Detect sensitive data
        request_text = json.dumps(request_body)
        audit_result = self.detector.detect(request_text)

        # Forward request
        start_time = time.time()
        url = f"{provider.base_url}{request_path}"

        async with self.http_client.stream(
            "POST",
            url,
            headers=headers,
            json=request_body
        ) as response:
            if response.status_code != 200:
                body = await response.aread()
                raise HTTPException(
                    status_code=response.status_code,
                    detail=body.decode()
                )

            async for chunk in response.aiter_bytes():
                yield chunk

        # Log usage (async background task would be better)
        latency = int((time.time() - start_time) * 1000)

    async def forward_anthropic_request(
        self,
        db: AsyncSession,
        api_key: str,
        request_body: Dict,
        request_path: str
    ) -> AsyncGenerator[bytes, None]:
        """Forward Anthropic format request."""
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
            raise HTTPException(
                status_code=400,
                detail=f"Model '{model_name}' requires OpenAI format. Use /v1/openai/..."
            )

        headers = {
            "x-api-key": provider.api_key_encrypted,
            "Content-Type": "application/json",
            "anthropic-version": "2023-06-01"
        }

        request_text = json.dumps(request_body)
        audit_result = self.detector.detect(request_text)

        start_time = time.time()
        url = f"{provider.base_url}{request_path}"

        async with self.http_client.stream(
            "POST",
            url,
            headers=headers,
            json=request_body
        ) as response:
            if response.status_code != 200:
                body = await response.aread()
                raise HTTPException(status_code=response.status_code, detail=body.decode())

            async for chunk in response.aiter_bytes():
                yield chunk
```

- [ ] **Step 7: Commit proxy service core**

```bash
git add services/proxy-service/
git commit -m "feat: add proxy service core

- Add load balancer with priority-based selection
- Add sensitive data detector (phone/id_card/email)
- Add OpenAI and Anthropic request forwarding
- Add API key validation"
```

---

### Task 7: Proxy Service API Endpoints

**Files:**
- Create: `services/proxy-service/app/routers/openai.py`
- Create: `services/proxy-service/app/routers/anthropic.py`
- Create: `services/proxy-service/app/main.py`

- [ ] **Step 1: Create app/routers/openai.py**

```python
from fastapi import APIRouter, Request, Header, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.services.proxy import ProxyService

router = APIRouter(prefix="/v1/openai")
proxy_service = ProxyService()


@router.post("/chat/completions")
async def chat_completions(
    request: Request,
    authorization: str = Header(...),
    db: AsyncSession = Depends(get_db)
):
    """OpenAI chat completions endpoint."""
    # Extract API key
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")

    api_key = authorization[7:]
    body = await request.json()

    async def generate():
        async for chunk in proxy_service.forward_openai_request(
            db, api_key, body, "/chat/completions"
        ):
            yield chunk

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no"
        }
    )


@router.post("/completions")
async def completions(
    request: Request,
    authorization: str = Header(...),
    db: AsyncSession = Depends(get_db)
):
    """OpenAI completions endpoint."""
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")

    api_key = authorization[7:]
    body = await request.json()

    async def generate():
        async for chunk in proxy_service.forward_openai_request(
            db, api_key, body, "/completions"
        ):
            yield chunk

    return StreamingResponse(
        generate(),
        media_type="text/event-stream"
    )


@router.get("/models")
async def list_models(
    authorization: str = Header(...),
    db: AsyncSession = Depends(get_db)
):
    """List available models."""
    from sqlalchemy import select
    from app.models import Model, Provider

    result = await db.execute(
        select(Model, Provider)
        .join(Provider)
        .where(Model.is_active == True, Provider.is_active == True)
    )
    rows = result.all()

    models = []
    for model, provider in rows:
        if provider.type in ['openai', 'azure', 'custom']:
            models.append({
                "id": model.display_name,
                "object": "model",
                "created": int(model.created_at.timestamp()),
                "owned_by": provider.name
            })

    return {
        "object": "list",
        "data": models
    }
```

- [ ] **Step 2: Create app/routers/anthropic.py**

```python
from fastapi import APIRouter, Request, Header, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.services.proxy import ProxyService

router = APIRouter(prefix="/v1/anthropic")
proxy_service = ProxyService()


@router.post("/messages")
async def messages(
    request: Request,
    x_api_key: str = Header(...),
    db: AsyncSession = Depends(get_db)
):
    """Anthropic messages endpoint."""
    body = await request.json()

    async def generate():
        async for chunk in proxy_service.forward_anthropic_request(
            db, x_api_key, body, "/v1/messages"
        ):
            yield chunk

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no"
        }
    )


@router.get("/models")
async def list_models(
    x_api_key: str = Header(...),
    db: AsyncSession = Depends(get_db)
):
    """List available Anthropic models."""
    from sqlalchemy import select
    from app.models import Model, Provider

    result = await db.execute(
        select(Model, Provider)
        .join(Provider)
        .where(Model.is_active == True, Provider.is_active == True)
    )
    rows = result.all()

    models = []
    for model, provider in rows:
        if provider.type == 'anthropic':
            models.append({
                "id": model.display_name,
                "display_name": model.display_name,
                "created_at": model.created_at.isoformat()
            })

    return {
        "data": models
    }
```

- [ ] **Step 3: Create app/main.py**

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.database import engine, Base
from app.routers import openai, anthropic


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifespan."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    await engine.dispose()


app = FastAPI(
    title="Fouter Proxy Service",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(openai.router)
app.include_router(anthropic.router)


@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "proxy"}


@app.get("/")
async def root():
    return {"service": "fouter-proxy", "version": "1.0.0"}
```

- [ ] **Step 4: Commit proxy endpoints**

```bash
git add services/proxy-service/app/routers services/proxy-service/app/main.py
git commit -m "feat: add proxy service API endpoints

- Add OpenAI format endpoints (/chat/completions, /completions, /models)
- Add Anthropic format endpoints (/messages, /models)
- Add streaming response support"
```

---

## Phase 5: Admin Service

### Task 8: Admin Service Implementation

**Files:**
- Create: `services/admin-service/requirements.txt`
- Create: `services/admin-service/Dockerfile`
- Create: `services/admin-service/app/config.py`
- Create: `services/admin-service/app/database.py`
- Create: `services/admin-service/app/models.py`
- Create: `services/admin-service/app/schemas.py`
- Create: `services/admin-service/app/routers/providers.py`
- Create: `services/admin-service/app/routers/stats.py`
- Create: `services/admin-service/app/main.py`

- [ ] **Step 1: Create requirements.txt**

```
fastapi==0.104.1
uvicorn[standard]==0.24.0
sqlalchemy==2.0.23
asyncpg==0.29.0
pydantic-settings==2.1.0
pytest==7.4.3
pytest-asyncio==0.21.1
```

- [ ] **Step 2: Create Dockerfile**

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app/ ./app/

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

- [ ] **Step 3: Create models, schemas, config, database (similar to auth-service)**

```python
# app/models.py
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, DECIMAL, JSON, BigInteger
from sqlalchemy.orm import declarative_base
from datetime import datetime

Base = declarative_base()


class Department(Base):
    __tablename__ = "departments"
    id = Column(Integer, primary_key=True)
    feishu_dept_id = Column(String(64), unique=True)
    name = Column(String(128), nullable=False)
    parent_id = Column(Integer, ForeignKey("departments.id"))
    created_at = Column(DateTime, default=datetime.utcnow)


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    feishu_user_id = Column(String(64), unique=True, nullable=False)
    name = Column(String(128), nullable=False)
    email = Column(String(256))
    department_id = Column(Integer, ForeignKey("departments.id"))
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)


class Provider(Base):
    __tablename__ = "providers"
    id = Column(Integer, primary_key=True)
    name = Column(String(128), nullable=False)
    type = Column(String(32), nullable=False)
    base_url = Column(Text, nullable=False)
    api_key_encrypted = Column(Text, nullable=False)
    rate_limit_qps = Column(Integer, default=5)
    rate_limit_rpm = Column(Integer, default=300)
    balance = Column(DECIMAL(20, 4))
    is_active = Column(Boolean, default=True)
    priority = Column(Integer, default=0)


class Model(Base):
    __tablename__ = "models"
    id = Column(Integer, primary_key=True)
    provider_id = Column(Integer, ForeignKey("providers.id"))
    model_id = Column(String(128), nullable=False)
    display_name = Column(String(128), nullable=False)
    is_active = Column(Boolean, default=True)


class UsageLog(Base):
    __tablename__ = "usage_logs"
    id = Column(BigInteger, primary_key=True)
    time = Column(DateTime, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"))
    model_id = Column(Integer, ForeignKey("models.id"))
    provider_id = Column(Integer, ForeignKey("providers.id"))
    input_tokens = Column(Integer, default=0)
    output_tokens = Column(Integer, default=0)
    total_tokens = Column(Integer, default=0)
    cost = Column(DECIMAL(20, 8), default=0)
    latency_ms = Column(Integer)
    has_sensitive_data = Column(Boolean, default=False)
```

- [ ] **Step 4: Create routers/providers.py**

```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from app.database import get_db
from app.models import Provider, Model
from app.schemas import ProviderCreate, ProviderResponse, ModelCreate, ModelResponse

router = APIRouter(prefix="/providers", tags=["providers"])


@router.get("/", response_model=List[ProviderResponse])
async def list_providers(db: AsyncSession = Depends(get_db)):
    """List all providers."""
    result = await db.execute(select(Provider))
    return result.scalars().all()


@router.post("/", response_model=ProviderResponse)
async def create_provider(
    provider: ProviderCreate,
    db: AsyncSession = Depends(get_db)
):
    """Create new provider."""
    db_provider = Provider(**provider.model_dump())
    db.add(db_provider)
    await db.commit()
    await db.refresh(db_provider)
    return db_provider


@router.put("/{provider_id}", response_model=ProviderResponse)
async def update_provider(
    provider_id: int,
    provider: ProviderCreate,
    db: AsyncSession = Depends(get_db)
):
    """Update provider."""
    result = await db.execute(select(Provider).where(Provider.id == provider_id))
    db_provider = result.scalar_one_or_none()
    if not db_provider:
        raise HTTPException(status_code=404, detail="Provider not found")

    for key, value in provider.model_dump().items():
        setattr(db_provider, key, value)

    await db.commit()
    await db.refresh(db_provider)
    return db_provider


@router.delete("/{provider_id}")
async def delete_provider(provider_id: int, db: AsyncSession = Depends(get_db)):
    """Delete provider."""
    result = await db.execute(select(Provider).where(Provider.id == provider_id))
    provider = result.scalar_one_or_none()
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")

    await db.delete(provider)
    await db.commit()
    return {"message": "Provider deleted"}


@router.get("/models", response_model=List[ModelResponse])
async def list_models(db: AsyncSession = Depends(get_db)):
    """List all models with provider info."""
    result = await db.execute(select(Model))
    return result.scalars().all()


@router.post("/models", response_model=ModelResponse)
async def create_model(
    model: ModelCreate,
    db: AsyncSession = Depends(get_db)
):
    """Create new model."""
    db_model = Model(**model.model_dump())
    db.add(db_model)
    await db.commit()
    await db.refresh(db_model)
    return db_model
```

- [ ] **Step 5: Create routers/stats.py**

```python
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from datetime import datetime, timedelta
from typing import Optional

from app.database import get_db
from app.models import UsageLog, User, Department

router = APIRouter(prefix="/stats", tags=["statistics"])


@router.get("/dashboard")
async def get_dashboard_stats(
    days: int = Query(7, ge=1, le=90),
    db: AsyncSession = Depends(get_db)
):
    """Get dashboard statistics."""
    since = datetime.utcnow() - timedelta(days=days)

    # Total requests
    total_result = await db.execute(
        select(func.count(UsageLog.id))
        .where(UsageLog.time >= since)
    )
    total_requests = total_result.scalar()

    # Total tokens
    tokens_result = await db.execute(
        select(func.sum(UsageLog.total_tokens))
        .where(UsageLog.time >= since)
    )
    total_tokens = tokens_result.scalar() or 0

    # Active users
    users_result = await db.execute(
        select(func.count(func.distinct(UsageLog.user_id)))
        .where(UsageLog.time >= since)
    )
    active_users = users_result.scalar()

    # Top models
    models_result = await db.execute(
        select(UsageLog.model_id, func.count(UsageLog.id).label("count"))
        .where(UsageLog.time >= since)
        .group_by(UsageLog.model_id)
        .order_by(func.count(UsageLog.id).desc())
        .limit(10)
    )
    top_models = [{"model_id": r[0], "requests": r[1]} for r in models_result.all()]

    return {
        "period_days": days,
        "total_requests": total_requests,
        "total_tokens": total_tokens,
        "active_users": active_users,
        "top_models": top_models
    }


@router.get("/usage")
async def get_usage_stats(
    user_id: Optional[int] = Query(None),
    department_id: Optional[int] = Query(None),
    days: int = Query(7, ge=1, le=90),
    db: AsyncSession = Depends(get_db)
):
    """Get usage statistics with filters."""
    since = datetime.utcnow() - timedelta(days=days)

    query = select(
        func.date_trunc('day', UsageLog.time).label("day"),
        func.count(UsageLog.id).label("requests"),
        func.sum(UsageLog.total_tokens).label("tokens"),
        func.sum(UsageLog.cost).label("cost")
    ).where(UsageLog.time >= since)

    if user_id:
        query = query.where(UsageLog.user_id == user_id)

    if department_id:
        query = query.join(User).where(User.department_id == department_id)

    query = query.group_by(func.date_trunc('day', UsageLog.time))

    result = await db.execute(query)
    rows = result.all()

    return {
        "period_days": days,
        "data": [
            {
                "date": r[0].isoformat(),
                "requests": r[1],
                "tokens": r[2] or 0,
                "cost": float(r[3] or 0)
            }
            for r in rows
        ]
    }
```

- [ ] **Step 6: Create main.py**

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.database import engine, Base
from app.routers import providers, stats


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    await engine.dispose()


app = FastAPI(
    title="Fouter Admin Service",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(providers.router, prefix="/api/v1")
app.include_router(stats.router, prefix="/api/v1")


@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "admin"}
```

- [ ] **Step 7: Commit admin service**

```bash
git add services/admin-service/
git commit -m "feat: add admin service

- Add provider CRUD endpoints
- Add model management endpoints
- Add statistics dashboard and usage queries
- Support filtering by user/department/time"
```

---

## Phase 6: Frontend

### Task 9: Frontend Setup

**Files:**
- Create: `frontend/package.json`
- Create: `frontend/tsconfig.json`
- Create: `frontend/index.html`
- Create: `frontend/vite.config.ts`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "fouter-frontend",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "axios": "^1.6.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.37",
    "@types/react-dom": "^18.2.15",
    "@vitejs/plugin-react": "^4.2.0",
    "typescript": "^5.2.2",
    "vite": "^5.0.0"
  }
}
```

- [ ] **Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

- [ ] **Step 3: Create index.html**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <link rel="icon" type="image/svg+xml" href="/vite.svg" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Fouter - AI Model Gateway</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Space+Mono:ital,wght@0,400;0,700;1,400&family=Syne:wght@400;700;800&display=swap" rel="stylesheet">
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.tsx"></script>
</body>
</html>
```

- [ ] **Step 4: Create vite.config.ts**

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': 'http://localhost:80',
      '/v1': 'http://localhost:80'
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
})
```

- [ ] **Step 5: Commit frontend setup**

```bash
git add frontend/package.json frontend/tsconfig.json frontend/index.html frontend/vite.config.ts
git commit -m "chore: initialize frontend project

- Add React + TypeScript + Vite setup
- Add Space Mono and Syne fonts
- Configure proxy for API calls"
```

---

### Task 10: Frontend Styles and Components

**Files:**
- Create: `frontend/src/styles/variables.css`
- Create: `frontend/src/styles/global.css`
- Create: `frontend/src/components/Button.tsx`
- Create: `frontend/src/components/Card.tsx`
- Create: `frontend/src/components/Layout.tsx`

- [ ] **Step 1: Create variables.css**

```css
:root {
  /* Background */
  --bg-primary: #0a0a0b;
  --bg-secondary: #111113;
  --bg-tertiary: #1a1a1d;
  --bg-card: #141416;

  /* Text */
  --text-primary: #f5f5f5;
  --text-secondary: #8a8a8a;
  --text-muted: #5a5a5a;

  /* Accent */
  --accent-primary: #ff6b35;
  --accent-secondary: #f7c548;
  --accent-cyan: #00d4aa;
  --accent-danger: #ff2d55;

  /* Border */
  --border-color: #2a2a2e;
  --border-accent: #ff6b35;

  /* Code */
  --code-bg: #0d0d0f;
  --shadow-glow: rgba(255, 107, 53, 0.15);

  /* Fonts */
  --font-mono: 'Space Mono', monospace;
  --font-display: 'Syne', sans-serif;
}
```

- [ ] **Step 2: Create global.css**

```css
@import './variables.css';

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
}

body {
  font-family: var(--font-mono);
  background-color: var(--bg-primary);
  color: var(--text-primary);
  line-height: 1.7;
  font-size: 14px;
  min-height: 100vh;
}

h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-display);
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: -0.02em;
}

a {
  color: var(--accent-primary);
  text-decoration: none;
}

a:hover {
  color: var(--accent-secondary);
}

button {
  font-family: var(--font-mono);
  cursor: pointer;
  border: none;
  background: none;
}

/* Scrollbar */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: var(--bg-secondary);
}

::-webkit-scrollbar-thumb {
  background: var(--border-color);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--accent-primary);
}
```

- [ ] **Step 3: Create Button.tsx**

```tsx
import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  onClick,
  disabled = false,
  className = ''
}) => {
  const baseStyles = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    fontFamily: 'var(--font-mono)',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    border: '1px solid transparent',
    transition: 'all 0.2s',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1
  };

  const variantStyles = {
    primary: {
      backgroundColor: 'var(--accent-primary)',
      color: 'var(--bg-primary)',
      borderColor: 'var(--accent-primary)'
    },
    secondary: {
      backgroundColor: 'transparent',
      color: 'var(--accent-primary)',
      borderColor: 'var(--accent-primary)'
    },
    danger: {
      backgroundColor: 'var(--accent-danger)',
      color: 'var(--bg-primary)',
      borderColor: 'var(--accent-danger)'
    }
  };

  const sizeStyles = {
    sm: { padding: '0.5rem 1rem', fontSize: '0.75rem' },
    md: { padding: '0.75rem 1.5rem', fontSize: '0.875rem' },
    lg: { padding: '1rem 2rem', fontSize: '1rem' }
  };

  const style = {
    ...baseStyles,
    ...variantStyles[variant],
    ...sizeStyles[size]
  };

  return (
    <button
      style={style}
      onClick={onClick}
      disabled={disabled}
      className={className}
    >
      {children}
    </button>
  );
};
```

- [ ] **Step 4: Create Card.tsx**

```tsx
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  title?: string;
  icon?: string;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, title, icon, className = '' }) => {
  return (
    <div
      style={{
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        padding: '2rem',
        position: 'relative',
        transition: 'all 0.3s'
      }}
      className={className}
    >
      {(title || icon) && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1rem'
        }}>
          {icon && (
            <span style={{
              fontSize: '1.5rem',
              color: 'var(--accent-primary)'
            }}>{icon}</span>
          )}
          {title && (
            <h3 style={{
              margin: 0,
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-display)'
            }}>{title}</h3>
          )}
        </div>
      )}
      {children}
    </div>
  );
};
```

- [ ] **Step 5: Commit frontend components**

```bash
git add frontend/src/styles frontend/src/components
git commit -m "feat: add frontend styles and components

- Add industrial futurism design system
- Add Button component with variants
- Add Card component
- Add global CSS with dark theme"
```

---

### Task 11: Frontend Pages

**Files:**
- Create: `frontend/src/pages/Login.tsx`
- Create: `frontend/src/pages/Dashboard.tsx`
- Create: `frontend/src/pages/Keys.tsx`
- Create: `frontend/src/App.tsx`
- Create: `frontend/src/main.tsx`

- [ ] **Step 1: Create Login.tsx**

```tsx
import React from 'react';
import { Button } from '../components/Button';

export const Login: React.FC = () => {
  const handleFeishuLogin = () => {
    // Redirect to Feishu OAuth
    const FEISHU_APP_ID = 'your_app_id';
    const REDIRECT_URI = encodeURIComponent('http://8.147.68.240/api/v1/auth/feishu/callback');
    const state = Math.random().toString(36).substring(7);

    window.location.href = `https://open.feishu.cn/open-apis/authen/v1/index?app_id=${FEISHU_APP_ID}&redirect_uri=${REDIRECT_URI}&state=${state}`;
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'var(--bg-primary)',
      position: 'relative'
    }}>
      {/* Grid background */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `
          linear-gradient(rgba(255, 107, 53, 0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255, 107, 53, 0.03) 1px, transparent 1px)
        `,
        backgroundSize: '50px 50px',
        pointerEvents: 'none'
      }} />

      <div style={{
        textAlign: 'center',
        zIndex: 1,
        padding: '3rem'
      }}>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '4rem',
          fontWeight: 800,
          color: 'var(--text-primary)',
          marginBottom: '1rem'
        }}>
          <span style={{ color: 'var(--accent-primary)' }}>F</span>outer
        </h1>

        <p style={{
          color: 'var(--text-secondary)',
          marginBottom: '3rem',
          fontSize: '1.1rem'
        }}>
          AI Model Gateway for Enterprise
        </p>

        <Button variant="primary" size="lg" onClick={handleFeishuLogin}>
          <span style={{ marginRight: '0.5rem' }}>◈</span>
          飞书登录
        </Button>

        <p style={{
          color: 'var(--text-muted)',
          marginTop: '2rem',
          fontSize: '0.8rem'
        }}>
          内部员工专用平台
        </p>
      </div>
    </div>
  );
};
```

- [ ] **Step 2: Create Dashboard.tsx**

```tsx
import React from 'react';
import { Card } from '../components/Card';

export const Dashboard: React.FC = () => {
  const stats = [
    { label: '今日调用', value: '1,234', unit: '次' },
    { label: 'Token 消耗', value: '2.5M', unit: 'tokens' },
    { label: '活跃模型', value: '8', unit: '个' },
    { label: 'API Keys', value: '3', unit: '个' }
  ];

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{
        display: 'flex',
        alignItems: 'baseline',
        gap: '1rem',
        marginBottom: '3rem',
        paddingBottom: '1rem',
        borderBottom: '2px solid var(--border-color)'
      }}>
        <span style={{
          color: 'var(--accent-primary)',
          fontWeight: 700
        }}>01</span>
        <h2 style={{ color: 'var(--text-primary)' }}>Dashboard</h2>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '1.5rem',
        marginBottom: '3rem'
      }}>
        {stats.map((stat, index) => (
          <Card key={index}>
            <div style={{
              borderLeft: '3px solid var(--accent-primary)',
              paddingLeft: '1rem'
            }}>
              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: '2.5rem',
                fontWeight: 800,
                color: 'var(--text-primary)'
              }}>{stat.value}</div>
              <div style={{
                fontSize: '0.75rem',
                color: 'var(--text-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                marginTop: '0.5rem'
              }}>{stat.label}</div>
            </div>
          </Card>
        ))}
      </div>

      <Card title="Quick Start">
        <div style={{ color: 'var(--text-secondary)' }}>
          <p style={{ marginBottom: '1rem' }}>1. 在 Keys 页面创建 API Key</p>
          <p style={{ marginBottom: '1rem' }}>2. 使用 OpenAI SDK 调用:</p>
          <pre style={{
            backgroundColor: 'var(--code-bg)',
            padding: '1rem',
            borderRadius: '4px',
            overflow: 'auto',
            fontSize: '0.85rem'
          }}>
{`from openai import OpenAI

client = OpenAI(
    api_key="your-fouter-key",
    base_url="http://8.147.68.240/v1/openai"
)

response = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "Hello!"}]
)`}
          </pre>
        </div>
      </Card>
    </div>
  );
};
```

- [ ] **Step 3: Create App.tsx**

```tsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import './styles/global.css';

// Simple auth check
const isAuthenticated = () => {
  return localStorage.getItem('token') !== null;
};

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return isAuthenticated() ? <>{children}</> : <Navigate to="/login" />;
};

const Layout: React.FC = () => {
  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      backgroundColor: 'var(--bg-primary)'
    }}>
      {/* Sidebar */}
      <aside style={{
        width: '260px',
        backgroundColor: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border-color)',
        padding: '1.5rem'
      }}>
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.5rem',
          fontWeight: 800,
          color: 'var(--accent-primary)',
          marginBottom: '2rem'
        }}>
          ◈ Fouter
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {[
            { path: '/', label: 'Dashboard' },
            { path: '/keys', label: 'API Keys' },
            { path: '/usage', label: 'Usage' },
            { path: '/docs', label: 'Docs' }
          ].map(item => (
            <a
              key={item.path}
              href={item.path}
              style={{
                padding: '0.75rem 1rem',
                color: 'var(--text-secondary)',
                textDecoration: 'none',
                fontSize: '0.875rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                border: '1px solid transparent',
                transition: 'all 0.2s'
              }}
            >
              {item.label}
            </a>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, overflow: 'auto' }}>
        <Dashboard />
      </main>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>} />
      </Routes>
    </BrowserRouter>
  );
};
```

- [ ] **Step 4: Create main.tsx**

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

- [ ] **Step 5: Commit frontend pages**

```bash
git add frontend/src/pages frontend/src/App.tsx frontend/src/main.tsx
git commit -m "feat: add frontend pages

- Add Login page with Feishu OAuth
- Add Dashboard with stats and quick start
- Add App router with auth check
- Add sidebar navigation"
```

---

## Phase 7: Documentation & Final Setup

### Task 12: README and Final Commits

**Files:**
- Create: `README.md`
- Modify: `docs/design.md` (add reference)

- [ ] **Step 1: Create README.md**

```markdown
# Fouter - AI Model Gateway

AI 模型聚合平台，支持 OpenAI/Anthropic 多协议，飞书登录，统一 API 管理。

## 技术栈

- **Backend**: Python 3.11 + FastAPI
- **Frontend**: React 18 + TypeScript
- **Database**: PostgreSQL 15 + TimescaleDB
- **Cache**: Redis 7
- **Gateway**: Nginx
- **Deploy**: Docker Compose

## 快速开始

### 1. 环境准备

```bash
cp .env.example .env
# 编辑 .env 配置数据库密码、飞书应用信息
```

### 2. 启动服务

```bash
docker-compose up -d
```

### 3. 访问

- 前端: http://8.147.68.240
- API Docs: http://8.147.68.240/api/v1/docs

## 项目结构

```
fouter/
├── docker-compose.yml
├── nginx/
├── frontend/           # React SPA
└── services/
    ├── auth-service/   # 认证服务
    ├── proxy-service/  # API 代理服务
    ├── rate-limit-service/  # 限流服务
    └── admin-service/  # 管理服务
```

## API 格式

### OpenAI 格式
```bash
curl http://8.147.68.240/v1/openai/chat/completions \
  -H "Authorization: Bearer your-key" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4o",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

### Anthropic 格式
```bash
curl http://8.147.68.240/v1/anthropic/messages \
  -H "x-api-key: your-key" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "claude-3-opus",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

## 文档

- [设计文档](docs/design.md)
- [实现计划](docs/superpowers/plans/2026-04-02-fouter-implementation-plan.md)

## License

Internal Use Only
```

- [ ] **Step 2: Commit README**

```bash
git add README.md
git commit -m "docs: add README with quick start guide

- Add project overview and tech stack
- Add quick start instructions
- Add API usage examples"
```

---

## Plan Summary

This implementation plan covers:

1. **Infrastructure** (Tasks 1-2): Docker Compose, Nginx, Database Schema
2. **Rate Limit Service** (Task 3): Token bucket algorithm with Redis
3. **Auth Service** (Tasks 4-5): Feishu OAuth, JWT, API Key management
4. **Proxy Service** (Tasks 6-7): OpenAI/Anthropic forwarding, load balancing, audit
5. **Admin Service** (Task 8): Provider/model management, statistics
6. **Frontend** (Tasks 9-11): React + Industrial Futurism design
7. **Documentation** (Task 12): README and final setup

**Estimated Time**: 8-10 hours of development time
**Dependencies**: PostgreSQL, Redis, Docker
**Test Strategy**: Unit tests for critical components, integration testing via Docker Compose
