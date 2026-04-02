import React from 'react';
import { Button } from '../components/Button';

export const Login: React.FC = () => {
  const handleFeishuLogin = () => {
    alert('飞书登录功能需要配置 FEISHU_APP_ID');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-primary)', position: 'relative' }}>
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `linear-gradient(rgba(255, 107, 53, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 107, 53, 0.03) 1px, transparent 1px)`,
        backgroundSize: '50px 50px', pointerEvents: 'none'
      }} />

      <div style={{ textAlign: 'center', zIndex: 1, padding: '3rem' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '4rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '1rem' }}>
          <span style={{ color: 'var(--accent-primary)' }}>F</span>outer
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '3rem', fontSize: '1.1rem' }}>AI Model Gateway for Enterprise</p>
        <Button variant="primary" size="lg" onClick={handleFeishuLogin}>
          <span style={{ marginRight: '0.5rem' }}>◈</span> 飞书登录
        </Button>
        <p style={{ color: 'var(--text-muted)', marginTop: '2rem', fontSize: '0.8rem' }}>内部员工专用平台</p>
      </div>
    </div>
  );
};
