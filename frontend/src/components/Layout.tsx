import { ReactNode } from 'react';
import { Header } from './Header';
import { Sidebar, NavItem } from './Sidebar';

interface LayoutProps {
  title: string;
  subtitle?: string;
  navItems: NavItem[];
  currentPath: string;
  onNavigate: (path: string) => void;
  children: ReactNode;
}

export function Layout({ title, subtitle, navItems, currentPath, onNavigate, children }: LayoutProps) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-primary)' }}>
      <Sidebar items={navItems} currentPath={currentPath} onNavigate={onNavigate} />
      <main style={{ flex: 1, marginLeft: '240px', padding: '2rem' }}>
        <Header title={title} subtitle={subtitle} />
        {children}
      </main>
    </div>
  );
}
