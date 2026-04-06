import { Provider, CreateProviderRequest, Model, CreateModelRequest, UsageStats } from '../types';
import { authApi } from './auth';

const API_BASE = '/api/v1';

async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const token = authApi.getToken();
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
}

export const adminApi = {
  // Providers
  async listProviders(): Promise<Provider[]> {
    const response = await fetchWithAuth(`${API_BASE}/admin/providers`);
    if (!response.ok) throw new Error('Failed to list providers');
    return response.json();
  },

  async createProvider(data: CreateProviderRequest): Promise<Provider> {
    const response = await fetchWithAuth(`${API_BASE}/admin/providers`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create provider');
    return response.json();
  },

  async updateProvider(id: number, data: Partial<CreateProviderRequest>): Promise<Provider> {
    const response = await fetchWithAuth(`${API_BASE}/admin/providers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update provider');
    return response.json();
  },

  async deleteProvider(id: number): Promise<void> {
    const response = await fetchWithAuth(`${API_BASE}/admin/providers/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete provider');
  },

  // Models
  async listModels(): Promise<Model[]> {
    const response = await fetchWithAuth(`${API_BASE}/admin/models`);
    if (!response.ok) throw new Error('Failed to list models');
    return response.json();
  },

  async createModel(data: CreateModelRequest): Promise<Model> {
    const response = await fetchWithAuth(`${API_BASE}/admin/models`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create model');
    return response.json();
  },

  async updateModel(id: number, data: Partial<CreateModelRequest>): Promise<Model> {
    const response = await fetchWithAuth(`${API_BASE}/admin/models/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update model');
    return response.json();
  },

  async deleteModel(id: number): Promise<void> {
    const response = await fetchWithAuth(`${API_BASE}/admin/models/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete model');
  },

  // Stats
  async getUsageStats(params?: { start_date?: string; end_date?: string }): Promise<UsageStats> {
    const searchParams = new URLSearchParams();
    if (params?.start_date) searchParams.set('start_date', params.start_date);
    if (params?.end_date) searchParams.set('end_date', params.end_date);
    
    const query = searchParams.toString();
    const response = await fetchWithAuth(`${API_BASE}/admin/stats/usage${query ? `?${query}` : ''}`);
    if (!response.ok) throw new Error('Failed to get usage stats');
    return response.json();
  },
};
