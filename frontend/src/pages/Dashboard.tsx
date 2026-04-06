import { Card } from '../components/Card';
import { StatCard } from '../components/StatCard';
import { useAuth } from '../context/AuthContext';
import { useApiKeys } from '../hooks/useApiKeys';

interface DashboardProps {
  onNavigate: (path: string) => void;
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const { user } = useAuth();
  const { keys } = useApiKeys();

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem', marginBottom: '3rem', paddingBottom: '1rem', borderBottom: '2px solid var(--border-color)' }}>
        <span style={{ color: 'var(--accent-primary)', fontWeight: 700 }}>01</span>
        <h2 style={{ color: 'var(--text-primary)' }}>Dashboard</h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
        <StatCard label="API Keys" value={keys.length} unit="个" color="primary" />
        <StatCard label="活跃模型" value="2" unit="个" color="cyan" />
        <StatCard label="今日调用" value="0" unit="次" color="secondary" />
        <StatCard label="Token 消耗" value="0" unit="tokens" color="danger" />
      </div>

      <Card title="欢迎回来">
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
          欢迎 <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>{user?.name}</span> 使用 Fouter AI 模型聚合平台。
        </p>
        {keys.length === 0 && (
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            你还没有 API Key，请先{' '}
            <button
              onClick={() => onNavigate('/keys')}
              style={{
                color: 'var(--accent-primary)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              创建 API Key
            </button>
            。
          </p>
        )}
      </Card>

      <Card title="快速开始" style={{ marginTop: '1.5rem' }}>
        <div style={{ color: 'var(--text-secondary)' }}>
          <p style={{ marginBottom: '1rem' }}>1. 在 Keys 页面创建 API Key</p>
          <p style={{ marginBottom: '1rem' }}>2. 使用 Anthropic SDK 调用:</p>
          <pre style={{ backgroundColor: 'var(--code-bg)', padding: '1rem', borderRadius: '4px', overflow: 'auto', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
{`import anthropic

client = anthropic.Anthropic(
    api_key="your-fouter-key",
    base_url="http://8.147.68.240/v1/anthropic"
)

response = client.messages.create(
    model="MiniMax-M2.7",
    max_tokens=1024,
    messages=[{"role": "user", "content": "Hello!"}]
)

print(response.content)`}
          </pre>
        </div>
      </Card>
    </div>
  );
}

export default Dashboard;
