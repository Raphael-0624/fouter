import { ReactNode, CSSProperties } from 'react';

interface CardProps {
  children: ReactNode;
  title?: string;
  style?: CSSProperties;
}

export function Card({ children, title, style }: CardProps) {
  return (
    <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', padding: '2rem', ...style }}>
      {title && <h3 style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)', marginBottom: '1rem' }}>{title}</h3>}
      {children}
    </div>
  );
}
