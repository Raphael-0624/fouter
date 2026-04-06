export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
}

export interface AnthropicRequest {
  model: string;
  messages: ChatMessage[];
  max_tokens: number;
  temperature?: number;
}

const ANTHROPIC_BASE = '/v1/anthropic';

export const proxyApi = {
  async listModels(apiKey: string): Promise<any> {
    const response = await fetch(`${ANTHROPIC_BASE}/models`, {
      headers: { 'x-api-key': apiKey },
    });
    if (!response.ok) throw new Error('Failed to list models');
    return response.json();
  },

  async chatAnthropic(apiKey: string, request: AnthropicRequest): Promise<Response> {
    return fetch(`${ANTHROPIC_BASE}/messages`, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });
  },

  // Test API connection
  async testConnection(apiKey: string): Promise<boolean> {
    try {
      const response = await this.listModels(apiKey);
      return !!response.data;
    } catch {
      return false;
    }
  },
};
