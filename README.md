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
