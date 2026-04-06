import { ApiKey, CreateApiKeyRequest } from '../types';
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

export const keysApi = {
  async list(): Promise<ApiKey[]> {
    const response = await fetchWithAuth(`${API_BASE}/users/keys`);
    if (!response.ok) throw new Error('Failed to list keys');
    return response.json();
  },

  async create(data: CreateApiKeyRequest): Promise<ApiKey> {
    const response = await fetchWithAuth(`${API_BASE}/users/keys`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create key');
    return response.json();
  },

  async delete(keyId: number): Promise<void> {
    const response = await fetchWithAuth(`${API_BASE}/users/keys/${keyId}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete key');
  },
};
