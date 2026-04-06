import { User, AuthResponse } from '../types';

const API_BASE = '/api/v1';

function getToken(): string | null {
  return localStorage.getItem('fouter_token');
}

function setToken(token: string): void {
  localStorage.setItem('fouter_token', token);
}

function removeToken(): void {
  localStorage.removeItem('fouter_token');
}

export const authApi = {
  async login(): Promise<void> {
    // Redirect to Feishu OAuth
    window.location.href = `${API_BASE}/auth/feishu/login`;
  },

  async callback(code: string, state: string): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE}/auth/feishu/callback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, state }),
    });
    
    if (!response.ok) {
      throw new Error('Login failed');
    }
    
    const data: AuthResponse = await response.json();
    setToken(data.access_token);
    return data;
  },

  async getMe(): Promise<User> {
    const token = getToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      if (response.status === 401) {
        removeToken();
        window.location.href = '/fouter/';
      }
      throw new Error('Failed to get user info');
    }

    return response.json();
  },

  logout(): void {
    removeToken();
    window.location.href = '/fouter/';
  },

  isAuthenticated(): boolean {
    return !!getToken();
  },

  getToken,
};
