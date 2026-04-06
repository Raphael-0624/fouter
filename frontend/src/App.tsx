import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { ApiKeysPage } from './pages/ApiKeys';
import { UsagePage } from './pages/Usage';
import { DocsPage } from './pages/Docs';
import { AdminLayout } from './pages/admin/Layout';
import { ProvidersPage } from './pages/admin/Providers';
import { ModelsPage } from './pages/admin/Models';
import './styles/global.css';

const employeeNavItems = [
  { label: 'Dashboard', path: '/dashboard', icon: '◈' },
  { label: 'API Keys', path: '/keys', icon: '◇' },
  { label: 'Usage', path: '/usage', icon: '○' },
  { label: 'Docs', path: '/docs', icon: '▷' },
];

const adminNavItems = [
  { label: '概览', path: '/admin', icon: '◈' },
  { label: '渠道管理', path: '/admin/providers', icon: '◇' },
  { label: '模型管理', path: '/admin/models', icon: '○' },
];

function EmployeeApp() {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--bg-primary)',
        color: 'var(--text-secondary)',
      }}>
        加载中...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  // Redirect root to dashboard
  if (location.pathname === '/' || location.pathname === '/fouter' || location.pathname === '/fouter/') {
    return <Navigate to="/dashboard" replace />;
  }

  const currentPath = location.pathname.replace('/fouter', '') || '/dashboard';

  return (
    <Layout
      title="Fouter"
      subtitle="AI Model Gateway"
      navItems={employeeNavItems}
      currentPath={currentPath}
      onNavigate={(path) => navigate(`/fouter${path}`)}
    >
      <Routes>
        <Route path="/dashboard" element={<Dashboard onNavigate={(path) => navigate(`/fouter${path}`)} />} />
        <Route path="/keys" element={<ApiKeysPage />} />
        <Route path="/usage" element={<UsagePage />} />
        <Route path="/docs" element={<DocsPage />} />
        {isAdmin && (
          <>
            <Route path="/admin" element={<Navigate to="/fouter/admin/providers" replace />} />
            <Route path="/admin/providers" element={<AdminProvidersPage />} />
            <Route path="/admin/models" element={<AdminModelsPage />} />
          </>
        )}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Layout>
  );
}

function AdminProvidersPage() {
  const navigate = useNavigate();
  return (
    <AdminLayout
      title="渠道管理"
      subtitle="Provider Management"
      navItems={adminNavItems}
      currentPath="/admin/providers"
      onNavigate={(path) => navigate(`/fouter${path}`)}
    >
      <ProvidersPage />
    </AdminLayout>
  );
}

function AdminModelsPage() {
  const navigate = useNavigate();
  return (
    <AdminLayout
      title="模型管理"
      subtitle="Model Management"
      navItems={adminNavItems}
      currentPath="/admin/models"
      onNavigate={(path) => navigate(`/fouter${path}`)}
    >
      <ModelsPage />
    </AdminLayout>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <EmployeeApp />
      </AuthProvider>
    </BrowserRouter>
  );
}
