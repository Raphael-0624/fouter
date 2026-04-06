import { useState } from 'react';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { Input } from '../components/Input';
import { Table } from '../components/Table';
import { useApiKeys } from '../hooks/useApiKeys';
import { ApiKey } from '../types';

export function ApiKeysPage() {
  const { keys, error, createKey, deleteKey } = useApiKeys();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [keyName, setKeyName] = useState('');
  const [rateLimit, setRateLimit] = useState('60');
  const [creating, setCreating] = useState(false);
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);

  const handleCreate = async () => {
    try {
      setCreating(true);
      const result = await createKey({
        name: keyName || undefined,
        rate_limit_rpm: parseInt(rateLimit) || 60,
      });
      setNewlyCreatedKey(result.key_hash);
      setKeyName('');
      setRateLimit('60');
    } catch (err) {
      alert('创建失败');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (key: ApiKey) => {
    if (confirm(`确定删除 Key "${key.name}" 吗？`)) {
      try {
        await deleteKey(key.id);
      } catch (err) {
        alert('删除失败');
      }
    }
  };

  const closeModal = () => {
    setShowCreateModal(false);
    setNewlyCreatedKey(null);
  };

  const columns = [
    {
      key: 'name',
      header: '名称',
      render: (key: ApiKey) => (
        <span style={{ fontWeight: 600 }}>{key.name}</span>
      ),
    },
    {
      key: 'key_hash',
      header: 'API Key',
      render: (key: ApiKey) => (
        <code style={{
          backgroundColor: 'var(--bg-primary)',
          padding: '0.25rem 0.5rem',
          borderRadius: '4px',
          fontSize: '0.8rem',
        }}>
          {key.key_hash}
        </code>
      ),
    },
    {
      key: 'rate_limit_rpm',
      header: '限流 (RPM)',
      render: (key: ApiKey) => key.rate_limit_rpm,
    },
    {
      key: 'created_at',
      header: '创建时间',
      render: (key: ApiKey) => new Date(key.created_at).toLocaleDateString('zh-CN'),
    },
    {
      key: 'actions',
      header: '操作',
      render: (key: ApiKey) => (
        <Button variant="danger" size="sm" onClick={() => handleDelete(key)}>
          删除
        </Button>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem' }}>
          <span style={{ color: 'var(--accent-primary)', fontWeight: 700 }}>02</span>
          <h2 style={{ color: 'var(--text-primary)' }}>API Keys</h2>
        </div>
        <Button variant="primary" onClick={() => setShowCreateModal(true)}>
          创建 Key
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

      <Table columns={columns} data={keys} emptyMessage="暂无 API Keys，请点击上方按钮创建" />

      <Modal
        isOpen={showCreateModal}
        onClose={closeModal}
        title="创建 API Key"
        footer={
          newlyCreatedKey ? (
            <Button variant="primary" onClick={closeModal}>完成</Button>
          ) : (
            <>
              <Button variant="secondary" onClick={closeModal}>取消</Button>
              <Button variant="primary" onClick={handleCreate} disabled={creating}>
                {creating ? '创建中...' : '创建'}
              </Button>
            </>
          )
        }
      >
        {newlyCreatedKey ? (
          <div>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              API Key 创建成功！请立即复制保存，关闭后将无法再次查看。
            </p>
            <div style={{
              backgroundColor: 'var(--bg-primary)',
              padding: '1rem',
              borderRadius: '4px',
              wordBreak: 'break-all',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.85rem',
              color: 'var(--accent-primary)',
            }}>
              {newlyCreatedKey}
            </div>
          </div>
        ) : (
          <div>
            <Input
              label="Key 名称"
              value={keyName}
              onChange={setKeyName}
              placeholder="例如: My API Key"
            />
            <Input
              label="限流 (RPM)"
              value={rateLimit}
              onChange={setRateLimit}
              placeholder="60"
              type="number"
            />
          </div>
        )}
      </Modal>
    </div>
  );
}

export default ApiKeysPage;
