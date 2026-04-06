import { Card } from '../components/Card';

export function DocsPage() {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem', marginBottom: '2rem' }}>
        <span style={{ color: 'var(--accent-primary)', fontWeight: 700 }}>04</span>
        <h2 style={{ color: 'var(--text-primary)' }}>API 文档</h2>
      </div>

      <Card title="Anthropic API (推荐)">
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          使用 Anthropic 兼容格式调用模型，支持 Claude 系列模型。
        </p>

        <div style={{ marginBottom: '2rem' }}>
          <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>基础调用</h4>
          <pre style={{
            backgroundColor: 'var(--code-bg)',
            padding: '1rem',
            borderRadius: '4px',
            overflow: 'auto',
            fontSize: '0.85rem',
            color: 'var(--text-primary)',
          }}>
{`import anthropic

client = anthropic.Anthropic(
    api_key="fk-your-api-key",
    base_url="http://8.147.68.240/v1/anthropic"
)

response = client.messages.create(
    model="MiniMax-M2.7",
    max_tokens=1024,
    messages=[
        {"role": "user", "content": "Hello, world!"}
    ]
)

print(response.content)`}
          </pre>
        </div>

        <div>
          <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Python SDK 安装</h4>
          <pre style={{
            backgroundColor: 'var(--code-bg)',
            padding: '1rem',
            borderRadius: '4px',
            overflow: 'auto',
            fontSize: '0.85rem',
            color: 'var(--accent-cyan)',
          }}>
{`pip install anthropic`}
          </pre>
        </div>
      </Card>

      <Card title="OpenAI SDK 兼容模式" style={{ marginTop: '1.5rem' }}>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          使用 OpenAI SDK 格式调用（注意：仅支持 OpenAI 格式的模型）。
        </p>

        <div style={{ marginBottom: '2rem' }}>
          <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>基础调用</h4>
          <pre style={{
            backgroundColor: 'var(--code-bg)',
            padding: '1rem',
            borderRadius: '4px',
            overflow: 'auto',
            fontSize: '0.85rem',
            color: 'var(--text-primary)',
          }}>
{`from openai import OpenAI

client = OpenAI(
    api_key="fk-your-api-key",
    base_url="http://8.147.68.240/v1/openai"
)

response = client.chat.completions.create(
    model="gpt-4o",
    messages=[
        {"role": "user", "content": "Hello!"}
    ]
)

print(response.choices[0].message.content)`}
          </pre>
        </div>
      </Card>

      <Card title="API 端点" style={{ marginTop: '1.5rem' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase' }}>端点</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase' }}>方法</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase' }}>说明</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '0.75rem', color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>/v1/anthropic/messages</td>
                <td style={{ padding: '0.75rem', color: 'var(--text-primary)' }}>POST</td>
                <td style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>发送消息（流式）</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '0.75rem', color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>/v1/anthropic/models</td>
                <td style={{ padding: '0.75rem', color: 'var(--text-primary)' }}>GET</td>
                <td style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>列出可用模型</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '0.75rem', color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>/v1/openai/chat/completions</td>
                <td style={{ padding: '0.75rem', color: 'var(--text-primary)' }}>POST</td>
                <td style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>Chat Completions（流式）</td>
              </tr>
              <tr>
                <td style={{ padding: '0.75rem', color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>/v1/openai/models</td>
                <td style={{ padding: '0.75rem', color: 'var(--text-primary)' }}>GET</td>
                <td style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>列出可用模型</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

export default DocsPage;
