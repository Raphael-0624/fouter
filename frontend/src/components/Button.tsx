import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  disabled?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', size = 'md', onClick, disabled = false }) => {
  const baseStyles: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
    fontFamily: 'var(--font-mono)', fontWeight: 700, textTransform: 'uppercase',
    letterSpacing: '0.05em', border: '1px solid transparent', transition: 'all 0.2s',
    cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1
  };

  const variantStyles: Record<string, React.CSSProperties> = {
    primary: { backgroundColor: 'var(--accent-primary)', color: 'var(--bg-primary)', borderColor: 'var(--accent-primary)' },
    secondary: { backgroundColor: 'transparent', color: 'var(--accent-primary)', borderColor: 'var(--accent-primary)' },
    danger: { backgroundColor: 'var(--accent-danger)', color: 'var(--bg-primary)', borderColor: 'var(--accent-danger)' }
  };

  const sizeStyles: Record<string, React.CSSProperties> = {
    sm: { padding: '0.5rem 1rem', fontSize: '0.75rem' },
    md: { padding: '0.75rem 1.5rem', fontSize: '0.875rem' },
    lg: { padding: '1rem 2rem', fontSize: '1rem' }
  };

  return (
    <button style={{ ...baseStyles, ...variantStyles[variant], ...sizeStyles[size] }} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
};
