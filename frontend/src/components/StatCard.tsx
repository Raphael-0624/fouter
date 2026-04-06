interface StatCardProps {
  label: string;
  value: string | number;
  unit?: string;
  color?: 'primary' | 'cyan' | 'secondary' | 'danger';
}

export function StatCard({ label, value, unit, color = 'primary' }: StatCardProps) {
  const accentColor = {
    primary: 'var(--accent-primary)',
    cyan: 'var(--accent-cyan)',
    secondary: 'var(--accent-secondary)',
    danger: 'var(--accent-danger)',
  }[color];

  return (
    <div style={{
      backgroundColor: 'var(--bg-card)',
      border: '1px solid var(--border-color)',
      borderRadius: '8px',
      padding: '1.5rem',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '4px',
        height: '100%',
        backgroundColor: accentColor,
      }} />
      <div style={{
        fontFamily: 'var(--font-display)',
        fontSize: '2.5rem',
        fontWeight: 800,
        color: 'var(--text-primary)',
        marginLeft: '0.75rem',
      }}>
        {value}
        {unit && (
          <span style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginLeft: '0.5rem' }}>
            {unit}
          </span>
        )}
      </div>
      <div style={{
        fontSize: '0.75rem',
        color: 'var(--text-secondary)',
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        marginTop: '0.5rem',
        marginLeft: '0.75rem',
      }}>
        {label}
      </div>
    </div>
  );
}
