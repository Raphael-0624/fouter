import React from 'react';
import { Card } from '../components/Card';

export const Dashboard: React.FC = () => {
  const stats = [
    { label: '今日调用', value: '0', unit: '次' },
    { label: 'Token 消耗', value: '0', unit: 'tokens' },
    { label: '活跃模型', value: '0', unit: '个' },
    { label: 'API Keys', value: '0', unit: '个' }
  ];

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem', marginBottom: '3rem', paddingBottom: '1rem', borderBottom: '2px solid var(--border-color)' }}>
        <span style={{ color: 'var(--accent-primary)', fontWeight: 700 }}>01</span>
        <h2 style={{ color: 'var(--text-primary)' }}>Dashboard</h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
        {stats.map((stat, index) => (
          <Card key={index}>
            <div style={{ borderLeft: '3px solid var(--accent-primary)', paddingLeft: '1rem' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>{stat.value}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '0.5rem' }}>{stat.label}</div>
            </div>
          </Card>
        ))}
      </div>

      <Card title="Quick Start">
        <div style={{ color: 'var(--text-secondary)' }}>
          <p style={{ marginBottom: '1rem' }}>1. 在 Keys 页面创建 API Key</p>
          <p style={{ marginBottom: '1rem' }}>2. 使用 OpenAI SDK 调用:</p>
          <pre style={{ backgroundColor: 'var(--code-bg)', padding: '1rem', borderRadius: '4px', overflow: 'auto', fontSize: '0.85rem' }}>
{`from openai import OpenAI

client = OpenAI(
    api_key="your-fouter-key",
    base_url="http://8.147.68.240/v1/openai"
)

response = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "Hello!"}]
)`}
          </pre>
        </div>
      </Card>
    </div>
  );
};
