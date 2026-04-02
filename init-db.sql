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
