import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider, createBrowserRouter, Navigate } from 'react-router-dom';
import './index.css';
import Layout from './components/Layout';
import TenantsPage from './pages/TenantsPage';
import TemplatesPage from './pages/TemplatesPage';
import LeadsPage from './pages/LeadsPage';
import SendPage from './pages/SendPage';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Navigate to="/tenants" replace /> },
      { path: 'tenants', element: <TenantsPage /> },
      { path: 'templates', element: <TemplatesPage /> },
      { path: 'leads', element: <LeadsPage /> },
      { path: 'send', element: <SendPage /> },
    ],
  },
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
