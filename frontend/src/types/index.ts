// User types
export interface User {
  id: number;
  feishu_user_id: string;
  name: string;
  email?: string;
  department_id?: number;
  avatar_url?: string;
  is_active: boolean;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

// API Key types
export interface ApiKey {
  id: number;
  user_id: number;
  key_hash: string;
  name: string;
  rate_limit_rpm: number;
  is_active: boolean;
  last_used_at?: string;
  expires_at?: string;
  created_at: string;
}

export interface CreateApiKeyRequest {
  name?: string;
  rate_limit_rpm?: number;
}

// Provider types
export interface Provider {
  id: number;
  name: string;
  type: 'openai' | 'anthropic' | 'azure' | 'custom';
  base_url: string;
  api_key_encrypted: string;
  rate_limit_qps: number;
  rate_limit_rpm: number;
  balance?: number;
  balance_currency: string;
  is_active: boolean;
  priority: number;
  created_at: string;
  updated_at: string;
}

export interface CreateProviderRequest {
  name: string;
  type: 'openai' | 'anthropic' | 'azure' | 'custom';
  base_url: string;
  api_key_encrypted: string;
  rate_limit_qps?: number;
  rate_limit_rpm?: number;
  balance?: number;
  priority?: number;
}

// Model types
export interface Model {
  id: number;
  provider_id: number;
  model_id: string;
  display_name: string;
  description?: string;
  context_window?: number;
  input_price_per_1k?: number;
  output_price_per_1k?: number;
  capabilities?: Record<string, any>;
  is_active: boolean;
  created_at: string;
}

export interface CreateModelRequest {
  provider_id: number;
  model_id: string;
  display_name: string;
  description?: string;
  context_window?: number;
}

// Usage stats types
export interface UsageStats {
  total_calls: number;
  total_tokens: number;
  total_cost: number;
  by_model: ModelUsage[];
  by_day: DailyUsage[];
}

export interface ModelUsage {
  model_id: number;
  model_name: string;
  calls: number;
  tokens: number;
  cost: number;
}

export interface DailyUsage {
  date: string;
  calls: number;
  tokens: number;
  cost: number;
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: User;
}

// Table pagination
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  page_size: number;
}
