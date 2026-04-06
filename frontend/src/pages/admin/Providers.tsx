import { useState, useEffect } from 'react';
import { Button } from '../../components/Button';
import { Modal } from '../../components/Modal';
import { Input } from '../../components/Input';
import { Table } from '../../components/Table';
import { Provider, CreateProviderRequest } from '../../types';
import { adminApi } from '../../api/admin';

export function ProvidersPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingProvider, setEditingProvider] = useState<Provider | null>(null);
  const [formData, setFormData] = useState<CreateProviderRequest>({
    name: '',
    type: 'anthropic',
    base_url: '',
    api_key_encrypted: '',
    rate_limit_qps: 5,
    rate_limit_rpm: 300,
    priority: 0,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    try {
      setError(null);
      const data = await adminApi.listProviders();
      setProviders(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch providers');
    }
  };

  const handleOpenModal = (provider?: Provider) => {
    if (provider) {
      setEditingProvider(provider);
      setFormData({
        name: provider.name,
        type: provider.type,
        base_url: provider.base_url,
        api_key_encrypted: provider.api_key_encrypted,
        rate_limit_qps: provider.rate_limit_qps,
        rate_limit_rpm: provider.rate_limit_rpm,
        priority: provider.priority,
      });
    } else {
      setEditingProvider(null);
      setFormData({
        name: '',
        type: 'anthropic',
        base_url: '',
        api_key_encrypted: '',
        rate_limit_qps: 5,
        rate_limit_rpm: 300,
        priority: 0,
      });
    }
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      if (editingProvider) {
        await adminApi.updateProvider(editingProvider.id, formData);
      } else {
        await adminApi.createProvider(formData);
      }
      setShowModal(false);
      fetchProviders();
    } catch (err) {
      alert(editingProvider ? '更新失败' : '创建失败');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (provider: Provider) => {
    if (confirm(`确定删除 Provider "${provider.name}" 吗？`)) {
      try {
        await adminApi.deleteProvider(provider.id);
        fetchProviders();
      } catch (err) {
        alert('删除失败');
      }
    }
  };

  const columns = [
    {
      key: 'name',
      header: '名称',
      render: (p: Provider) => (
        <span style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>{p.name}</span>
      ),
    },
    { key: 'type', header: '类型' },
    { key: 'base_url', header: 'Base URL' },
    {
      key: 'priority',
      header: '优先级',
      render: (p: Provider) => p.priority || 0,
    },
    {
      key: 'is_active',
      header: '状态',
      render: (p: Provider) => (
        <span style={{
          padding: '0.25rem 0.5rem',
          borderRadius: '4px',
          fontSize: '0.75rem',
          backgroundColor: p.is_active ? 'rgba(0, 212, 170, 0.1)' : 'rgba(255, 45, 85, 0.1)',
          color: p.is_active ? 'var(--accent-cyan)' : 'var(--accent-danger)',
        }}>
          {p.is_active ? '启用' : '禁用'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '操作',
      render: (p: Provider) => (
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Button variant="secondary" size="sm" onClick={() => handleOpenModal(p)}>编辑</Button>
          <Button variant="danger" size="sm" onClick={() => handleDelete(p)}>删除</Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem' }}>
          <span style={{ color: 'var(--accent-primary)', fontWeight: 700 }}>渠道管理</span>
        </div>
        <Button variant="primary" onClick={() => handleOpenModal()}>添加渠道</Button>
      </div>

      {error && (
        <div style={{
          padding: '1rem',
          backgroundColor: 'rgba(255, 45, 85, 0.1)',
          border: '1px solid var(--accent-danger)',
          borderRadius: '4px',
          color: 'var(--accent-danger)',
          marginBottom: '1rem',
        }}>
          {error}
        </div>
      )}

      <Table columns={columns} data={providers} emptyMessage="暂无渠道" />

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingProvider ? '编辑渠道' : '添加渠道'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowModal(false)}>取消</Button>
            <Button variant="primary" onClick={handleSave} disabled={saving}>
              {saving ? '保存中...' : '保存'}
            </Button>
          </>
        }
      >
        <Input label="名称" value={formData.name} onChange={(v) => setFormData({ ...formData, name: v })} required />
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
            类型 *
          </label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
            style={{
              width: '100%',
              padding: '0.75rem 1rem',
              backgroundColor: 'var(--bg-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: '4px',
              color: 'var(--text-primary)',
              fontSize: '0.875rem',
            }}
          >
            <option value="openai">OpenAI</option>
            <option value="anthropic">Anthropic</option>
            <option value="azure">Azure</option>
            <option value="custom">Custom</option>
          </select>
        </div>
        <Input label="Base URL" value={formData.base_url} onChange={(v) => setFormData({ ...formData, base_url: v })} required />
        <Input label="API Key" value={formData.api_key_encrypted} onChange={(v) => setFormData({ ...formData, api_key_encrypted: v })} required />
        <Input label="QPS 限制" value={String(formData.rate_limit_qps || 0)} onChange={(v) => setFormData({ ...formData, rate_limit_qps: parseInt(v) || 0 })} type="number" />
        <Input label="RPM 限制" value={String(formData.rate_limit_rpm || 0)} onChange={(v) => setFormData({ ...formData, rate_limit_rpm: parseInt(v) || 0 })} type="number" />
        <Input label="优先级" value={String(formData.priority || 0)} onChange={(v) => setFormData({ ...formData, priority: parseInt(v) || 0 })} type="number" />
      </Modal>
    </div>
  );
}

export default ProvidersPage;
