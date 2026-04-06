import React from 'react';
import { Header } from '../../components/Header';
import { Sidebar } from '../../components/Sidebar';

interface NavItem {
  label: string;
  path: string;
  icon: string;
}

interface AdminLayoutProps {
  title: string;
  subtitle?: string;
  navItems: NavItem[];
  currentPath: string;
  onNavigate: (path: string) => void;
  children: React.ReactNode;
}

export function AdminLayout({ title, subtitle, navItems, currentPath, onNavigate, children }: AdminLayoutProps) {
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
