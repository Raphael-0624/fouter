import React from 'react';
import { Dashboard } from './Dashboard';
import './styles/global.css';

const isAuthenticated = () => localStorage.getItem('token') !== null;

const Layout: React.FC = () => {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-primary)' }}>
      <aside style={{ width: '260px', backgroundColor: 'var(--bg-secondary)', borderRight: '1px solid var(--border-color)', padding: '1.5rem' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-primary)', marginBottom: '2rem' }}>◈ Fouter</div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {['Dashboard', 'API Keys', 'Usage', 'Docs'].map(item => (
            <a key={item} href="#" style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item}</a>
          ))}
        </nav>
      </aside>
      <main style={{ flex: 1, overflow: 'auto' }}>
        <Dashboard />
      </main>
    </div>
  );
};

export const App: React.FC = () => {
  return <Layout />;
};
