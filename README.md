# Fouter - AI Model Gateway

企业级 AI 模型聚合平台，为团队提供统一的 AI API 访问入口，支持多种模型提供商。

## 功能特性

- **多模型支持**: 支持 Anthropic、OpenAI 等多种模型提供商
- **飞书登录**: 使用飞书 SSO 进行身份认证
- **API Key 管理**: 便捷的 API Key 创建与管理
- **用量统计**: 实时查看 API 调用次数与 Token 消耗
- **管理员面板**: 管理员可配置模型提供商与渠道
- **Rate Limiting**: 基于 Token Bucket 算法的流量控制

## 技术架构

### 后端服务 (Python/FastAPI)

| 服务 | 端口 | 说明 |
|------|------|------|
| Auth Service | 8001 | 用户认证、OAuth |
| Key Service | 8003 | API Key 管理 |
| Admin Service | 8004 | 管理后台 API |
| Proxy Service | 8002 | AI 模型代理转发 |

### 前端 (React + TypeScript)

- 工业未来主义设计风格
- 响应式布局
- 暗色主题

### 数据库

- PostgreSQL 13 + TimescaleDB (时序数据)
- Redis (缓存与限流)

## 快速开始

### 前置要求

- Python 3.8+
- Node.js 18+
- PostgreSQL 13+
- Redis
- Nginx
- Podman (容器运行时)

### 环境变量

```bash
# .env
FEISHU_APP_ID=cli_xxxxx
FEISHU_APP_SECRET=your_secret
ANTHROPIC_API_KEY=sk-xxxxx
ANTHROPIC_BASE_URL=https://api.minimaxi.com/anthropic
DATABASE_URL=postgresql://fouter:xxx@localhost:5432/fouter
REDIS_URL=redis://localhost:6379
```

### 安装依赖

```bash
# 后端
cd services/auth-service && pip install -r requirements.txt
cd services/key-service && pip install -r requirements.txt
cd services/admin-service && pip install -r requirements.txt
cd services/proxy-service && pip install -r requirements.txt

# 前端
cd frontend && npm install
```

### 启动服务

```bash
# 启动数据库和 Redis (使用 podman)
podman-compose up -d postgres redis

# 初始化数据库
# 参考 services/*/app/init_db.py 初始化脚本

# 启动后端服务
cd services/auth-service && python -m uvicorn app.main:app --host 0.0.0.0 --port 8001
cd services/key-service && python -m uvicorn app.main:app --host 0.0.0.0 --port 8003
cd services/admin-service && python -m uvicorn app.main:app --host 0.0.0.0 --port 8004
cd services/proxy-service && python -m uvicorn app.main:app --host 0.0.0.0 --port 8002

# 构建并启动前端
cd frontend && npm run build
# 将 dist 内容部署到 Nginx
```

### Nginx 配置

参考 `nginx/nginx.conf`，包含完整的 API 路由配置。

## API 调用示例

### Anthropic 格式

```python
import anthropic

client = anthropic.Anthropic(
    api_key="your-fouter-key",
    base_url="http://8.147.68.240/v1/anthropic"
)

response = client.messages.create(
    model="MiniMax-M2.7",
    max_tokens=1024,
    messages=[{"role": "user", "content": "Hello!"}]
)

print(response.content)
```

### OpenAI 兼容格式

```python
from openai import OpenAI

client = OpenAI(
    api_key="your-fouter-key",
    base_url="http://8.147.68.240/v1/openai"
)

response = client.chat.completions.create(
    model="MiniMax-M2.7",
    messages=[{"role": "user", "content": "Hello!"}]
)

print(response.choices[0].message.content)
```

## 项目结构

```
fouter-project/
├── frontend/                 # React 前端
│   ├── src/
│   │   ├── api/             # API 客户端
│   │   ├── components/      # UI 组件
│   │   ├── context/         # React Context
│   │   ├── hooks/           # 自定义 Hooks
│   │   ├── pages/           # 页面组件
│   │   └── styles/          # 全局样式
│   └── package.json
├── services/                 # 后端微服务
│   ├── auth-service/        # 认证服务
│   ├── key-service/         # Key 管理服务
│   ├── admin-service/       # 管理服务
│   └── proxy-service/       # 代理服务
├── nginx/                   # Nginx 配置
├── .env                     # 环境变量
└── README.md
```

## 环境变量说明

| 变量 | 说明 | 必需 |
|------|------|------|
| `FEISHU_APP_ID` | 飞书应用 App ID | 是 |
| `FEISHU_APP_SECRET` | 飞书应用 App Secret | 是 |
| `ANTHROPIC_API_KEY` | Anthropic API Key | 是 |
| `ANTHROPIC_BASE_URL` | Anthropic API 基础 URL | 是 |
| `DATABASE_URL` | PostgreSQL 连接字符串 | 是 |
| `REDIS_URL` | Redis 连接字符串 | 是 |

## 文档

- [设计文档](docs/design.md)
- [实现计划](docs/superpowers/plans/2026-04-02-fouter-implementation-plan.md)

## 许可证

Internal Use Only
