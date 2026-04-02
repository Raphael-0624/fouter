# Fouter - AI 模型聚合平台设计文档

**版本**: v1.0
**日期**: 2026-04-02
**作者**: Claude Code + 用户协作

---

## 1. 项目概述

### 1.1 背景
公司内部员工使用大模型需要分别向各平台申请 API Key，维护成本高、管理困难。Fouter 作为统一的 AI 模型聚合平台，集中对接各大模型厂商，员工只需扫码登录即可领取个人 Key 使用。

### 1.2 产品定位
- **名称**: Fouter
- **类型**: 内部 AI API 聚合网关
- **目标用户**: 公司内部员工 + 平台管理员
- **核心价值**: 统一入口、简化管理、成本可控、安全审计

### 1.3 核心能力
1. **统一 API 入口** - 包装 OpenAI/Anthropic 等多厂商协议
2. **飞书登录** - OAuth2 扫码登录，绑定用户身份
3. **个人 Key 管理** - 员工自助申请、管理 API Key
4. **渠道管理** - 管理员配置多厂商渠道（OpenAI、Azure、Claude、硅基流动等）
5. **智能路由** - 支持分组显示、负载均衡、故障转移
6. **限流保护** - 令牌桶三层限流（用户/渠道/模型）
7. **统计监控** - 准实时统计（1小时延迟）按员工/部门/模型维度
8. **日志审计** - 敏感信息检测（手机号、身份证号、敏感词）

---

## 2. 技术架构

### 2.1 技术栈

| 层级 | 技术选型 | 说明 |
|------|----------|------|
| **网关** | Nginx | 反向代理、SSL、静态资源 |
| **限流服务** | Python + FastAPI + Redis | 令牌桶限流（独立服务） |
| **认证服务** | Python + FastAPI + PostgreSQL | 飞书 OAuth、用户管理 |
| **代理服务** | Python + FastAPI + Redis | API 转发、协议转换 |
| **管理服务** | Python + FastAPI + PostgreSQL/TimescaleDB | 渠道管理、统计 |
| **前端** | React + TypeScript | 工业未来主义风格 |
| **数据库** | PostgreSQL + TimescaleDB | 主库 + 时序扩展 |
| **缓存** | Redis | 限流、会话、实时统计 |
| **部署** | Docker Compose | 单机部署，后期迁移内网 |

### 2.2 服务架构

```
┌─────────────────────────────────────────────────────────────┐
│                        用户层                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │   员工      │  │  管理员     │  │    员工应用         │ │
│  │  (Web UI)   │  │  (Web UI)   │  │  (OpenAI SDK)       │ │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘ │
└─────────┼────────────────┼────────────────────┼────────────┘
          │                │                    │
          ▼                ▼                    ▼
┌─────────────────────────────────────────────────────────────┐
│                      Nginx 网关层                            │
│  • 反向代理 / 负载均衡                                       │
│  • SSL (如有)                                               │
│  • 静态资源 (前端)                                          │
│  • API 路由分发                                             │
└─────────┬────────────────┬────────────────────┬────────────┘
          │                │                    │
    ┌─────┴─────┐    ┌────┴────┐         ┌─────┴──────┐
    ▼           ▼    ▼         ▼         ▼            ▼
┌───────┐  ┌──────┐ ┌─────┐ ┌──────┐ ┌────────┐  ┌────────┐
│静态资源│  │限流  │ │认证 │ │代理  │ │管理    │  │监控    │
│React  │  │服务  │ │服务 │ │服务  │ │服务    │  │服务    │
└───────┘  └──┬───┘ └──┬──┘ └──┬───┘ └───┬────┘  └───┬────┘
              │        │       │         │           │
    ┌─────────┴────────┴───────┴─────────┴───────────┘
    ▼
┌─────────────────────────────────────────────────────────────┐
│                      数据层                                  │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐ │
│  │   PostgreSQL   │  │   TimescaleDB  │  │     Redis      │ │
│  │   (主数据库)    │  │   (时序数据)    │  │   (缓存队列)    │ │
│  └────────────────┘  └────────────────┘  └────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 2.3 服务职责

#### 2.3.1 RateLimit Service（限流服务）
- Redis 令牌桶算法实现
- 三层限流检查：用户级、渠道级、模型级
- 返回标准 429 响应头
- 独立部署，可被多个服务调用

#### 2.3.2 Auth Service（认证服务）
- 飞书 OAuth2 登录流程
- JWT Token 签发与验证
- 用户信息同步（飞书 API 获取部门信息）
- 用户 API Key 的 CRUD

#### 2.3.3 Proxy Service（代理服务）
- 两套 API 格式支持：OpenAI / Anthropic
- 请求协议转换与转发
- 调用日志记录（异步写入）
- 渠道负载均衡（全局配置）

#### 2.3.4 Admin Service（管理服务）
- 渠道管理（Provider + Model 配置）
- 用户管理
- 统计查询（个人/部门/模型/时间维度）
- 日志查询与敏感信息标记

---

## 3. 数据模型

### 3.1 核心实体

#### User（用户）
```sql
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
```

#### Department（部门）
```sql
CREATE TABLE departments (
    id SERIAL PRIMARY KEY,
    feishu_dept_id VARCHAR(64) UNIQUE,
    name VARCHAR(128) NOT NULL,
    parent_id INTEGER REFERENCES departments(id),
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### UserKey（用户 API Key）
```sql
CREATE TABLE user_keys (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    key_hash VARCHAR(128) UNIQUE NOT NULL,  -- 用于验证
    name VARCHAR(128),  -- 用户自定义名称
    rate_limit_rpm INTEGER DEFAULT 60,  -- requests per minute
    is_active BOOLEAN DEFAULT TRUE,
    last_used_at TIMESTAMP,
    expires_at TIMESTAMP,  -- NULL 表示永久有效
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### Provider（渠道）
```sql
CREATE TABLE providers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    type VARCHAR(32) NOT NULL,  -- 'openai', 'anthropic', 'azure', 'custom'
    base_url TEXT NOT NULL,
    api_key_encrypted TEXT NOT NULL,
    rate_limit_qps INTEGER DEFAULT 5,
    rate_limit_rpm INTEGER DEFAULT 300,
    balance DECIMAL(20, 4),  -- 余额
    balance_currency VARCHAR(8) DEFAULT 'USD',
    is_active BOOLEAN DEFAULT TRUE,
    priority INTEGER DEFAULT 0,  -- 负载均衡优先级
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Model（模型）
```sql
CREATE TABLE models (
    id SERIAL PRIMARY KEY,
    provider_id INTEGER REFERENCES providers(id) ON DELETE CASCADE,
    model_id VARCHAR(128) NOT NULL,  -- 厂商原始ID，如 gpt-4o
    display_name VARCHAR(128) NOT NULL,  -- 显示名称
    description TEXT,
    context_window INTEGER,  -- 上下文长度
    input_price_per_1k DECIMAL(10, 6),  -- 每1k tokens输入价格
    output_price_per_1k DECIMAL(10, 6),  -- 每1k tokens输出价格
    capabilities JSONB,  -- 功能特性，如 {"vision": true, "tools": true}
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### UsageLog（调用日志）- TimescaleDB 超表
```sql
CREATE TABLE usage_logs (
    id BIGSERIAL,
    time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    user_key_id INTEGER REFERENCES user_keys(id),
    user_id INTEGER REFERENCES users(id),
    model_id INTEGER REFERENCES models(id),
    provider_id INTEGER REFERENCES providers(id),
    request_id VARCHAR(64) UNIQUE NOT NULL,

    -- 用量统计
    input_tokens INTEGER DEFAULT 0,
    output_tokens INTEGER DEFAULT 0,
    total_tokens INTEGER DEFAULT 0,
    cost DECIMAL(20, 8) DEFAULT 0,  -- 估算成本

    -- 性能指标
    latency_ms INTEGER,  -- 总耗时毫秒
    upstream_latency_ms INTEGER,  -- 厂商响应耗时

    -- 请求信息
    request_method VARCHAR(16),
    request_path TEXT,
    request_body_size INTEGER,
    response_status INTEGER,

    -- 安全审计
    has_sensitive_data BOOLEAN DEFAULT FALSE,
    sensitive_data_types TEXT[],  -- ['phone', 'id_card', 'keyword_x']

    -- 原始请求（可选脱敏存储）
    request_content_snippet TEXT,

    PRIMARY KEY (id, time)
);

-- 转换为超表，按天分区
SELECT create_hypertable('usage_logs', 'time', chunk_time_interval => INTERVAL '1 day');
```

### 3.2 索引设计

```sql
-- 时序查询优化
CREATE INDEX idx_usage_logs_user_time ON usage_logs (user_id, time DESC);
CREATE INDEX idx_usage_logs_model_time ON usage_logs (model_id, time DESC);
CREATE INDEX idx_usage_logs_dept_time ON usage_logs (department_id, time DESC);

-- 唯一性约束
CREATE UNIQUE INDEX idx_user_keys_hash ON user_keys (key_hash);
CREATE UNIQUE INDEX idx_models_provider_model ON models (provider_id, model_id);
```

---

## 4. API 设计

### 4.1 认证流程

#### 飞书 OAuth2 登录
```
1. GET  /api/v1/auth/feishu/login     -> 重定向到飞书授权页
2. GET  /api/v1/auth/feishu/callback -> 飞书回调，获取用户信息，签发 JWT
3. POST /api/v1/auth/refresh         -> 刷新 JWT Token
```

### 4.2 OpenAI 兼容 API

#### 基础信息
- **Base URL**: `http://8.147.68.240:8080/v1/openai`
- **认证**: `Authorization: Bearer {user_key}`

#### 端点
```
POST /v1/openai/chat/completions
POST /v1/openai/completions
GET  /v1/openai/models
```

#### 模型格式
```json
{
  "model": "gpt-4o",  // 或 anthropic/claude-3-opus 等分组标识
  "messages": [...]
}
```

**重要**: 如果模型与格式不匹配（如用 OpenAI 格式调用 claude 模型），返回 400 错误：
```json
{
  "error": {
    "code": "format_mismatch",
    "message": "Model 'claude-3-opus' requires Anthropic format. Use /v1/anthropic/messages"
  }
}
```

### 4.3 Anthropic 兼容 API

#### 基础信息
- **Base URL**: `http://8.147.68.240:8080/v1/anthropic`
- **认证**: `x-api-key: {user_key}`

#### 端点
```
POST /v1/anthropic/messages
GET  /v1/anthropic/models
```

### 4.4 限流响应头

```http
HTTP/1.1 200 OK
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1712044800

HTTP/1.1 429 Too Many Requests
Retry-After: 1
{
  "error": {
    "code": "rate_limit_exceeded",
    "message": "Rate limit exceeded. Please retry after 1 second."
  }
}
```

---

## 5. 前端设计

### 5.1 设计风格

**工业未来主义**（参考 Rafa_learn_cc 项目）

```css
:root {
  /* 色彩系统 */
  --bg-primary: #0a0a0b;      /* 主背景 - 纯黑 */
  --bg-secondary: #111113;    /* 次级背景 */
  --bg-card: #141416;         /* 卡片背景 */
  --text-primary: #f5f5f5;    /* 主文字 - 白 */
  --text-secondary: #8a8a8a;  /* 次级文字 - 灰 */
  --accent-primary: #ff6b35;  /* 强调色 - 橙 */
  --accent-secondary: #f7c548; /* 次强调 - 黄 */
  --accent-cyan: #00d4aa;     /* 辅助色 - 青 */
  --accent-danger: #ff2d55;   /* 危险 - 红 */
  --border-color: #2a2a2e;    /* 边框 */

  /* 字体 */
  --font-mono: 'Space Mono', monospace;
  --font-display: 'Syne', sans-serif;
}
```

### 5.2 页面结构

#### 员工端
```
/                           # 首页 - 登录入口
/dashboard                  # 控制台
  ├── /keys                 # 我的 API Keys
  ├── /usage                # 用量统计（个人）
  └── /docs                 # API 文档
```

#### 管理端
```
/admin                      # 管理后台
  ├── /dashboard            # 概览面板
  ├── /providers            # 渠道管理
  ├── /models               # 模型管理
  ├── /users                # 用户管理
  ├── /usage                # 用量统计（全局）
  └── /logs                 # 日志审计
```

### 5.3 核心组件

- **Header** - 固定导航，玻璃态效果
- **StatCard** - 数据卡片，橙/青双色强调
- **ModelCard** - 模型选择卡片，分组显示
- **Table** - 数据表格，深色主题
- **CodeBlock** - API 代码示例，语法高亮
- **Timeline** - 用量时间线
- **Modal** - 对话框，边框发光效果

---

## 6. 核心功能实现

### 6.1 限流实现（Token Bucket）

```python
# 令牌桶限流（Redis 实现）
class TokenBucketLimiter:
    def __init__(self, redis: Redis):
        self.redis = redis

    async def is_allowed(
        self,
        key: str,        # 限流标识，如 user:123, provider:openai
        rate: int,       # 速率（每秒）
        burst: int       # 突发容量
    ) -> Tuple[bool, int]:
        """
        检查请求是否允许通过
        返回: (是否允许, 剩余令牌数)
        """
        lua_script = """
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

        now = time.time()
        result = await self.redis.eval(
            lua_script, 1, key, rate, burst, now
        )
        return result[0] == 1, result[1]
```

### 6.2 负载均衡策略

```python
# 全局负载均衡配置
class LoadBalancer:
    def __init__(self, strategy: str = "priority"):
        self.strategy = strategy  # priority, round_robin, weighted

    async def select_provider(
        self,
        model_identifier: str,
        exclude_providers: List[int] = None
    ) -> Optional[Provider]:
        """
        根据模型标识选择最优渠道
        """
        # 1. 获取该模型对应的所有可用渠道
        providers = await self.get_providers_for_model(model_identifier)

        # 2. 过滤不可用的（余额不足、已禁用、排除列表）
        available = [
            p for p in providers
            if p.is_active
            and p.balance > 0
            and p.id not in (exclude_providers or [])
        ]

        if not available:
            return None

        # 3. 按优先级排序（优先级数字越小越优先）
        available.sort(key=lambda p: p.priority)

        return available[0]
```

### 6.3 敏感信息检测

```python
import re

class SensitiveDataDetector:
    """敏感信息检测器"""

    PATTERNS = {
        'phone': re.compile(r'1[3-9]\d{9}'),  # 手机号
        'id_card': re.compile(r'\d{17}[\dXx]|\d{15}'),  # 身份证号
        'email': re.compile(r'[\w.-]+@[\w.-]+\.\w+'),
        'bank_card': re.compile(r'\d{16,19}'),
    }

    SENSITIVE_KEYWORDS = [
        '密码', 'password', 'pwd',
        '密钥', 'secret', 'key',
        'token', 'api_key',
        # 可配置扩展
    ]

    def detect(self, text: str) -> Dict[str, any]:
        """
        检测文本中的敏感信息
        返回: {
            'has_sensitive': True/False,
            'types': ['phone', 'id_card'],
            'positions': [(start, end, type)],
            'keywords': ['密码']
        }
        """
        result = {
            'has_sensitive': False,
            'types': [],
            'positions': [],
            'keywords': []
        }

        # 正则匹配
        for data_type, pattern in self.PATTERNS.items():
            for match in pattern.finditer(text):
                result['has_sensitive'] = True
                result['types'].append(data_type)
                result['positions'].append((match.start(), match.end(), data_type))

        # 关键词匹配
        for keyword in self.SENSITIVE_KEYWORDS:
            if keyword.lower() in text.lower():
                result['has_sensitive'] = True
                result['keywords'].append(keyword)

        return result
```

---

## 7. 部署架构

### 7.1 Docker Compose 配置

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

  postgres:
    image: timescale/timescaledb:latest-pg15
    environment:
      POSTGRES_USER: fouter
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: fouter
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"

  auth-service:
    build: ./services/auth-service
    environment:
      - DATABASE_URL=postgresql://fouter:${DB_PASSWORD}@postgres/fouter
      - REDIS_URL=redis://redis:6379
      - FEISHU_APP_ID=${FEISHU_APP_ID}
      - FEISHU_APP_SECRET=${FEISHU_APP_SECRET}
      - JWT_SECRET=${JWT_SECRET}
    ports:
      - "8001:8000"

  proxy-service:
    build: ./services/proxy-service
    environment:
      - DATABASE_URL=postgresql://fouter:${DB_PASSWORD}@postgres/fouter
      - REDIS_URL=redis://redis:6379
      - RATE_LIMIT_SERVICE_URL=http://rate-limit-service:8000
    ports:
      - "8002:8000"

  rate-limit-service:
    build: ./services/rate-limit-service
    environment:
      - REDIS_URL=redis://redis:6379
    ports:
      - "8003:8000"

  admin-service:
    build: ./services/admin-service
    environment:
      - DATABASE_URL=postgresql://fouter:${DB_PASSWORD}@postgres/fouter
      - REDIS_URL=redis://redis:6379
    ports:
      - "8004:8000"

volumes:
  postgres_data:
  redis_data:
```

### 7.2 环境变量模板

```bash
# .env
DB_PASSWORD=your_secure_db_password
REDIS_PASSWORD=your_redis_password
JWT_SECRET=your_jwt_secret_key

# 飞书应用配置
FEISHU_APP_ID=cli_xxx
FEISHU_APP_SECRET=xxx

# 可选：各厂商 API Keys（也可通过管理界面配置）
OPENAI_API_KEY=sk-xxx
ANTHROPIC_API_KEY=sk-ant-xxx
```

---

## 8. 安全设计

### 8.1 安全措施

| 层级 | 措施 |
|------|------|
| **传输层** | HTTPS（如有域名）/ 内网 TLS |
| **认证层** | JWT Token + 飞书 OAuth2 |
| **API Key** | 存储 hash，不可逆 |
| **数据库** | API Keys 加密存储（AES-256） |
| **日志** | 敏感信息标记，可选脱敏 |
| **限流** | 三层限流防止滥用 |
| **审计** | 全量调用日志，敏感信息检测 |

### 8.2 飞书 OAuth2 流程

```
1. 用户点击"飞书登录"
2. 后端生成 state 参数，重定向到飞书授权页
   https://open.feishu.cn/open-apis/authen/v1/index?app_id=xxx&redirect_uri=xxx&state=xxx
3. 用户扫码授权
4. 飞书回调到后端，携带 code
5. 后端用 code 换取 access_token
6. 用 access_token 获取用户信息（user_id, name, department）
7. 创建/更新用户记录
8. 签发 JWT Token 返回前端
```

---

## 9. 迭代规划

### 9.1 第一期（MVP）- 当前
- [x] 飞书 OAuth2 登录
- [x] 用户 API Key 管理
- [x] OpenAI + Anthropic 双格式 API
- [x] Provider + Model 管理
- [x] 分组显示模型
- [x] 三层限流（用户/渠道/模型）
- [x] 准实时统计（1小时延迟）
- [x] 日志审计（敏感信息检测）
- [x] 工业未来主义风格前端

### 9.2 第二期（优化）
- [ ] 飞书自建应用（工作台直接访问）
- [ ] 智能去重（自动路由最优渠道）
- [ ] 模型级负载均衡配置
- [ ] 实时监控大屏（WebSocket 推送）
- [ ] 告警系统（余额不足、异常用量）
- [ ] 用户费用预算设置
- [ ] 更多厂商支持（Gemini、Claude 3.5 等）

### 9.3 第三期（扩展）
- [ ] 团队/项目级别的 Key
- [ ] 模型 A/B 测试
- [ ] 智能缓存层
- [ ] 模型性能排行榜
- [ ] 多区域部署

---

## 10. 项目结构

```
fouter/
├── docker-compose.yml
├── .env.example
├── nginx/
│   └── nginx.conf
├── frontend/                    # React 前端
│   ├── package.json
│   ├── index.html
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── styles/
│   │   └── main.tsx
│   └── dist/                    # 构建输出
├── services/
│   ├── auth-service/           # 认证服务
│   │   ├── app/
│   │   │   ├── main.py
│   │   │   ├── routers/
│   │   │   ├── models/
│   │   │   └── services/
│   │   ├── Dockerfile
│   │   └── requirements.txt
│   ├── proxy-service/          # API 代理服务
│   ├── rate-limit-service/     # 限流服务
│   └── admin-service/          # 管理后台服务
├── docs/
│   └── design.md               # 本设计文档
└── README.md
```

---

## 11. 附录

### 11.1 术语表

| 术语 | 说明 |
|------|------|
| Provider | 大模型厂商渠道，如 OpenAI、Azure、Anthropic |
| Model | 具体的模型，如 GPT-4o、Claude 3 Opus |
| UserKey | 员工申请的 API Key |
| Rate Limit | 限流，控制请求频率 |
| Token | 大模型计费单位，输入输出分别计算 |
| TimescaleDB | PostgreSQL 时序扩展，优化时间序列查询 |

### 11.2 参考项目

- [OpenRouter](https://openrouter.ai/) - API 聚合平台参考
- [Rafa_learn_cc](/home/claudeuser/Rafa_learn_cc) - 前端风格参考
- [硅基流动](https://siliconflow.cn/) - 国内聚合平台参考

---

**文档状态**: 初稿完成
**最后更新**: 2026-04-02
**下一步**: 等待审查 → 编写实现计划
