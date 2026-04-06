import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const { user, logout } = useAuth();

  return (
    <header style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '2rem',
      paddingBottom: '1rem',
      borderBottom: '2px solid var(--border-color)',
    }}>
      <div>
        <h1 style={{ color: 'var(--text-primary)', fontSize: '1.5rem', marginBottom: '0.25rem' }}>
          <span style={{ color: 'var(--accent-primary)', marginRight: '0.5rem' }}>◈</span>
          {title}
        </h1>
        {subtitle && (
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{subtitle}</p>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {user && (
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{user.name}</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
              {user.is_admin ? '管理员' : '员工'}
            </div>
          </div>
        )}
        <button
          onClick={logout}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: 'var(--bg-tertiary)',
            color: 'var(--text-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: '4px',
            fontSize: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.borderColor = 'var(--accent-danger)';
            e.currentTarget.style.color = 'var(--accent-danger)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-color)';
            e.currentTarget.style.color = 'var(--text-secondary)';
          }}
        >
          退出
        </button>
      </div>
    </header>
  );
}
