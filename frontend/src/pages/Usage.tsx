import { Card } from '../components/Card';
import { StatCard } from '../components/StatCard';
import { useStats } from '../hooks/useStats';

export function UsagePage() {
  const { stats, loading, error } = useStats();

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem', marginBottom: '2rem' }}>
        <span style={{ color: 'var(--accent-primary)', fontWeight: 700 }}>03</span>
        <h2 style={{ color: 'var(--text-primary)' }}>用量统计</h2>
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

      {loading ? (
        <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '3rem' }}>
          加载中...
        </div>
      ) : stats ? (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            <StatCard label="总调用次数" value={stats.total_calls.toLocaleString()} color="primary" />
            <StatCard label="总 Token 消耗" value={(stats.total_tokens / 1000).toFixed(1)} unit="K" color="cyan" />
            <StatCard label="总成本" value={`$${stats.total_cost.toFixed(4)}`} color="secondary" />
          </div>

          <Card title="按模型统计">
            {stats.by_model.length > 0 ? (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase' }}>模型</th>
                      <th style={{ padding: '0.75rem', textAlign: 'right', color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase' }}>调用次数</th>
                      <th style={{ padding: '0.75rem', textAlign: 'right', color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Token</th>
                      <th style={{ padding: '0.75rem', textAlign: 'right', color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase' }}>成本</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.by_model.map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '0.75rem', color: 'var(--text-primary)' }}>{item.model_name}</td>
                        <td style={{ padding: '0.75rem', textAlign: 'right', color: 'var(--text-primary)' }}>{item.calls.toLocaleString()}</td>
                        <td style={{ padding: '0.75rem', textAlign: 'right', color: 'var(--text-primary)' }}>{item.tokens.toLocaleString()}</td>
                        <td style={{ padding: '0.75rem', textAlign: 'right', color: 'var(--accent-secondary)' }}>${item.cost.toFixed(6)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>
                暂无数据
              </div>
            )}
          </Card>
        </>
      ) : (
        <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '3rem' }}>
          暂无统计数据
        </div>
      )}
    </div>
  );
}

export default UsagePage;
