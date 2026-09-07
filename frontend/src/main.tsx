import { StrictMode, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import {
  RouterProvider,
  createBrowserRouter,
  Navigate,
} from 'react-router-dom';
import './index.css';
import { AuthProvider, useAuth } from './auth';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import TenantsPage from './pages/TenantsPage';
import TemplatesPage from './pages/TemplatesPage';
import LeadsPage from './pages/LeadsPage';
import SendPage from './pages/SendPage';

function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="app-loading">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function HomeRedirect() {
  const { user } = useAuth();
  return <Navigate to={user?.role === 'admin' ? '/tenants' : '/templates'} replace />;
}

function RoleRoute({
  allow,
  children,
}: {
  allow: 'admin' | 'tenant';
  children: ReactNode;
}) {
  const { user } = useAuth();
  if (user && user.role !== allow) return <HomeRedirect />;
  return <>{children}</>;
}

const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    path: '/',
    element: (
      <RequireAuth>
        <Layout />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <HomeRedirect /> },
      {
        path: 'tenants',
        element: (
          <RoleRoute allow="admin">
            <TenantsPage />
          </RoleRoute>
        ),
      },
      {
        path: 'templates',
        element: (
          <RoleRoute allow="tenant">
            <TemplatesPage />
          </RoleRoute>
        ),
      },
      {
        path: 'leads',
        element: (
          <RoleRoute allow="tenant">
            <LeadsPage />
          </RoleRoute>
        ),
      },
      {
        path: 'send',
        element: (
          <RoleRoute allow="tenant">
            <SendPage />
          </RoleRoute>
        ),
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </StrictMode>,
);
