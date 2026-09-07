import { NavLink, Outlet } from 'react-router-dom';

const tabs = [
  { to: '/tenants', label: 'Tenants' },
  { to: '/templates', label: 'Templates' },
  { to: '/leads', label: 'Leads' },
  { to: '/send', label: 'Send' },
];

export default function Layout() {
  return (
    <>
      <header className="app-header">
        <h1>Adora SMS Service</h1>
        <p>Multi-tenant outbound SMS demo · Plivo default route · no DLT</p>
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
