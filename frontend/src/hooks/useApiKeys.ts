import { useState, useEffect, useCallback } from 'react';
import { ApiKey, CreateApiKeyRequest } from '../types';
import { keysApi } from '../api/keys';

export function useApiKeys() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchKeys = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await keysApi.list();
      setKeys(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch keys');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKeys();
  }, [fetchKeys]);

  const createKey = async (data: CreateApiKeyRequest) => {
    const newKey = await keysApi.create(data);
    setKeys(prev => [...prev, newKey]);
    return newKey;
  };

  const deleteKey = async (keyId: number) => {
    await keysApi.delete(keyId);
    setKeys(prev => prev.filter(k => k.id !== keyId));
  };

  return { keys, loading, error, createKey, deleteKey, refresh: fetchKeys };
}
