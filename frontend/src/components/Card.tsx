import React from 'react';

interface CardProps {
  children: React.ReactNode;
  title?: string;
}

export const Card: React.FC<CardProps> = ({ children, title }) => {
  return (
    <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', padding: '2rem' }}>
      {title && <h3 style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)', marginBottom: '1rem' }}>{title}</h3>}
      {children}
    </div>
  );
};
