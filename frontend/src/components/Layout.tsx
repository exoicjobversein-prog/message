import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../auth';

const ADMIN_TABS = [{ to: '/tenants', label: 'Tenants' }];
const TENANT_TABS = [
  { to: '/templates', label: 'Templates' },
  { to: '/leads', label: 'Leads' },
  { to: '/send', label: 'Send' },
];

export default function Layout() {
  const { user, tenant, logout } = useAuth();
  const tabs = user?.role === 'admin' ? ADMIN_TABS : TENANT_TABS;

  return (
    <>
      <header className="app-header">
        <div>
          <h1>
            Adora 7X{' '}
            {user?.role === 'admin' ? '· Admin' : tenant ? `· ${tenant.name}` : ''}
          </h1>
          <p>
            {user?.role === 'admin'
              ? 'Create tenant workspaces and login accounts'
              : 'Outbound SMS · Plivo default route · no DLT'}
          </p>
        </div>
        <div className="app-header__user">
          <span className="muted">{user?.email}</span>
          <button className="btn secondary" onClick={logout}>
            Log out
          </button>
        </div>
      </header>
      <nav className="tabs">
        {tabs.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            className={({ isActive }) => (isActive ? 'active' : '')}
          >
            {t.label}
          </NavLink>
        ))}
      </nav>
      <main>
        <Outlet />
      </main>
    </>
  );
}
