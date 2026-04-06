import { useState, useEffect } from 'react';
import { Button } from '../../components/Button';
import { Modal } from '../../components/Modal';
import { Input } from '../../components/Input';
import { Table } from '../../components/Table';
import { Model, Provider, CreateModelRequest } from '../../types';
import { adminApi } from '../../api/admin';

export function ModelsPage() {
  const [models, setModels] = useState<Model[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<CreateModelRequest>({
    provider_id: 0,
    model_id: '',
    display_name: '',
    description: '',
    context_window: 32768,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setError(null);
      const [modelsData, providersData] = await Promise.all([
        adminApi.listModels(),
        adminApi.listProviders(),
      ]);
      setModels(modelsData);
      setProviders(providersData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    }
  };

  const handleOpenModal = () => {
    setFormData({
      provider_id: providers[0]?.id || 0,
      model_id: '',
      display_name: '',
      description: '',
      context_window: 32768,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await adminApi.createModel(formData);
      setShowModal(false);
      fetchData();
    } catch (err) {
      alert('创建失败');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (model: Model) => {
    if (confirm(`确定删除模型 "${model.display_name}" 吗？`)) {
      try {
        await adminApi.deleteModel(model.id);
        fetchData();
      } catch (err) {
        alert('删除失败');
      }
    }
  };

  const getProviderName = (providerId: number) => {
    const provider = providers.find(p => p.id === providerId);
    return provider?.name || 'Unknown';
  };

  const columns = [
    {
      key: 'display_name',
      header: '显示名称',
      render: (m: Model) => (
        <span style={{ fontWeight: 600, color: 'var(--accent-cyan)' }}>{m.display_name}</span>
      ),
    },
    { key: 'model_id', header: '模型 ID' },
    {
      key: 'provider_id',
      header: '渠道',
      render: (m: Model) => getProviderName(m.provider_id),
    },
    {
      key: 'context_window',
      header: '上下文',
      render: (m: Model) => m.context_window ? `${(m.context_window / 1000).toFixed(0)}K` : '-',
    },
    {
      key: 'is_active',
      header: '状态',
      render: (m: Model) => (
        <span style={{
          padding: '0.25rem 0.5rem',
          borderRadius: '4px',
          fontSize: '0.75rem',
          backgroundColor: m.is_active ? 'rgba(0, 212, 170, 0.1)' : 'rgba(255, 45, 85, 0.1)',
          color: m.is_active ? 'var(--accent-cyan)' : 'var(--accent-danger)',
        }}>
          {m.is_active ? '启用' : '禁用'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '操作',
      render: (m: Model) => (
        <Button variant="danger" size="sm" onClick={() => handleDelete(m)}>删除</Button>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem' }}>
          <span style={{ color: 'var(--accent-primary)', fontWeight: 700 }}>模型管理</span>
        </div>
        <Button variant="primary" onClick={handleOpenModal} disabled={providers.length === 0}>
          添加模型
        </Button>
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

      <Table columns={columns} data={models} emptyMessage="暂无模型" />

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="添加模型"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowModal(false)}>取消</Button>
            <Button variant="primary" onClick={handleSave} disabled={saving}>
              {saving ? '保存中...' : '保存'}
            </Button>
          </>
        }
      >
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
            渠道 *
          </label>
          <select
            value={formData.provider_id}
            onChange={(e) => setFormData({ ...formData, provider_id: parseInt(e.target.value) })}
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
            {providers.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
        <Input label="模型 ID" value={formData.model_id} onChange={(v) => setFormData({ ...formData, model_id: v })} required />
        <Input label="显示名称" value={formData.display_name} onChange={(v) => setFormData({ ...formData, display_name: v })} required />
        <Input label="描述" value={formData.description || ''} onChange={(v) => setFormData({ ...formData, description: v })} />
        <Input label="上下文窗口" value={String(formData.context_window || 0)} onChange={(v) => setFormData({ ...formData, context_window: parseInt(v) || 0 })} type="number" />
      </Modal>
    </div>
  );
}

export default ModelsPage;
