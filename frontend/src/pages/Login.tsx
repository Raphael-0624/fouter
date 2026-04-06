import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../components/Button';
import { authApi } from '../api/auth';
import { useAuth } from '../context/AuthContext';

export const Login: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    // Handle OAuth callback
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (code && state) {
      handleCallback(code, state);
    }
  }, [searchParams]);

  useEffect(() => {
    if (isAuthenticated && !loading) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, loading, navigate]);

  const handleCallback = async (code: string, state: string) => {
    try {
      await authApi.callback(code, state);
      navigate('/dashboard');
    } catch (error) {
      console.error('Login failed:', error);
      alert('登录失败，请重试');
    }
  };

  const handleFeishuLogin = () => {
    authApi.login();
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
