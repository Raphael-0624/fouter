import { useAuth } from '../context/AuthContext';

export interface NavItem {
  label: string;
  path: string;
  icon: string;
}

interface SidebarProps {
  items: NavItem[];
  currentPath: string;
  onNavigate: (path: string) => void;
}

export function Sidebar({ items, currentPath, onNavigate }: SidebarProps) {
  const { isAdmin } = useAuth();

  return (
    <aside style={{
      width: '240px',
      backgroundColor: 'var(--bg-secondary)',
      borderRight: '1px solid var(--border-color)',
      padding: '1.5rem',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      position: 'fixed',
      left: 0,
      top: 0,
    }}>
      <div style={{
        fontFamily: 'var(--font-display)',
        fontSize: '1.5rem',
        fontWeight: 800,
        color: 'var(--accent-primary)',
        marginBottom: '2rem',
      }}>
        ◈ Fouter
      </div>
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
        {items.map((item) => (
          <button
            key={item.path}
            onClick={() => onNavigate(item.path)}
            style={{
              padding: '0.75rem 1rem',
              color: currentPath === item.path ? 'var(--accent-primary)' : 'var(--text-secondary)',
              backgroundColor: currentPath === item.path ? 'rgba(255, 107, 53, 0.1)' : 'transparent',
              border: 'none',
              borderLeft: currentPath === item.path ? '3px solid var(--accent-primary)' : '3px solid transparent',
              textAlign: 'left',
              fontSize: '0.875rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              cursor: 'pointer',
              transition: 'all 0.2s',
              fontFamily: 'var(--font-mono)',
            }}
            onMouseOver={(e) => {
              if (currentPath !== item.path) {
                e.currentTarget.style.color = 'var(--text-primary)';
                e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
              }
            }}
            onMouseOut={(e) => {
              if (currentPath !== item.path) {
                e.currentTarget.style.color = 'var(--text-secondary)';
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}
          >
            <span style={{ marginRight: '0.75rem' }}>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>
      {isAdmin && (
        <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>
            管理
          </div>
        </div>
      )}
    </aside>
  );
}
