import { ReactNode, CSSProperties } from 'react';

interface ButtonProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  disabled?: boolean;
  style?: CSSProperties;
}

export function Button({ children, variant = 'primary', size = 'md', onClick, disabled = false, style }: ButtonProps) {
  const baseStyles: CSSProperties = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
    fontFamily: 'var(--font-mono)', fontWeight: 700, textTransform: 'uppercase',
    letterSpacing: '0.05em', border: '1px solid transparent', transition: 'all 0.2s',
    cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1,
  };

  const variantStyles: Record<string, CSSProperties> = {
    primary: { backgroundColor: 'var(--accent-primary)', color: 'var(--bg-primary)', borderColor: 'var(--accent-primary)' },
    secondary: { backgroundColor: 'transparent', color: 'var(--accent-primary)', borderColor: 'var(--accent-primary)' },
    danger: { backgroundColor: 'var(--accent-danger)', color: 'var(--bg-primary)', borderColor: 'var(--accent-danger)' }
  };

  const sizeStyles: Record<string, CSSProperties> = {
    sm: { padding: '0.5rem 1rem', fontSize: '0.75rem' },
    md: { padding: '0.75rem 1.5rem', fontSize: '0.875rem' },
    lg: { padding: '1rem 2rem', fontSize: '1rem' }
  };

  return (
    <button style={{ ...baseStyles, ...variantStyles[variant], ...sizeStyles[size], ...style }} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}
