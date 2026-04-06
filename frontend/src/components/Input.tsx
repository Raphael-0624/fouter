interface InputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
  error?: string;
}

export function Input({ label, value, onChange, placeholder, type = 'text', required, error }: InputProps) {
  return (
    <div style={{ marginBottom: '1rem' }}>
      <label style={{
        display: 'block',
        color: 'var(--text-secondary)',
        fontSize: '0.75rem',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        marginBottom: '0.5rem',
      }}>
        {label}
        {required && <span style={{ color: 'var(--accent-danger)', marginLeft: '0.25rem' }}>*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%',
          padding: '0.75rem 1rem',
          backgroundColor: 'var(--bg-primary)',
          border: `1px solid ${error ? 'var(--accent-danger)' : 'var(--border-color)'}`,
          borderRadius: '4px',
          color: 'var(--text-primary)',
          fontSize: '0.875rem',
          fontFamily: 'var(--font-mono)',
          outline: 'none',
          transition: 'border-color 0.2s',
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = 'var(--accent-primary)';
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = error ? 'var(--accent-danger)' : 'var(--border-color)';
        }}
      />
      {error && (
        <div style={{ color: 'var(--accent-danger)', fontSize: '0.75rem', marginTop: '0.25rem' }}>
          {error}
        </div>
      )}
    </div>
  );
}
